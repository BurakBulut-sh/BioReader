import { pdfjs } from 'react-pdf';
import workerSrc from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPageText(pdfDocument, pageNumber) {
  const page = await pdfDocument.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str).join(' ');
}

export async function extractDocumentText(pdfDocument, maxPages = 12) {
  const limit = Math.min(pdfDocument.numPages, maxPages);
  const segments = [];

  for (let page = 1; page <= limit; page += 1) {
    const text = await extractPageText(pdfDocument, page);
    segments.push({ page, text });
  }

  return segments;
}

export async function extractPageItems(pdfDocument, pageNumber) {
  const page = await pdfDocument.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items;
}

export function detectColumnStructure(items) {
  if (!items || items.length === 0) return { type: 'single', columns: [] };

  const xCoords = items
    .map((item) => item.transform?.[4])
    .filter((value) => typeof value === 'number');

  if (xCoords.length < 20) return { type: 'single', columns: [] };

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const width = maxX - minX;
  const midpoint = minX + (width / 2);

  const leftItems = items.filter(item => item.transform[4] < midpoint - 10);
  const rightItems = items.filter(item => item.transform[4] > midpoint + 10);

  // If balanced distribution, likely 2-column
  const total = items.length;
  const leftRatio = leftItems.length / total;
  const rightRatio = rightItems.length / total;

  if (leftRatio > 0.3 && rightRatio > 0.3) {
    return { 
      type: 'double',
      midpoint,
      leftParams: { min: minX, max: midpoint - 10 },
      rightParams: { min: midpoint + 10, max: maxX }
    };
  }

  return { type: 'single', columns: [] };
}

export function reflowText(items, structure) {
  if (structure.type !== 'double') {
    // Standard top-to-bottom sort
    return items.sort((a, b) => b.transform[5] - a.transform[5]).map(item => item.str).join(' ');
  }

  const { midpoint } = structure;

  // Separate columns
  const leftCol = items.filter(item => item.transform[4] <= midpoint);
  const rightCol = items.filter(item => item.transform[4] > midpoint);

  // Sort each column top-to-bottom (Y-coordinate descending)
  // PDF coordinate system: (0,0) is bottom-left, so higher Y is higher on page
  const sortFn = (a, b) => {
    const diffY = b.transform[5] - a.transform[5];
    if (Math.abs(diffY) < 5) {
      return a.transform[4] - b.transform[4]; // Same line, sort left-to-right
    }
    return diffY;
  };

  leftCol.sort(sortFn);
  rightCol.sort(sortFn);

  // Join simple text
  const leftText = leftCol.map(item => item.str).join(' ');
  const rightText = rightCol.map(item => item.str).join(' ');

  return leftText + '\n\n' + rightText;
}

export function generateReflowedHTML(items, structure) {
    if (!items || items.length === 0) return '';
    
    // Sort logic depends on structure
    let sortedItems = [];
    
    if (structure.type === 'double') {
        const { midpoint } = structure;
        const leftCol = items.filter(item => item.transform[4] <= midpoint);
        const rightCol = items.filter(item => item.transform[4] > midpoint);
        
        const sortFn = (a, b) => {
             // Major sort by Y (descending), minor by X (ascending)
            const diffY = b.transform[5] - a.transform[5];
            // Y coordinates are floats, use threshold
            if (Math.abs(diffY) < 8) {
                return a.transform[4] - b.transform[4];
            }
            return diffY;
        };

        leftCol.sort(sortFn);
        rightCol.sort(sortFn);
        sortedItems = [...leftCol, ...rightCol];
    } else {
        sortedItems = [...items].sort((a, b) => {
            const diffY = b.transform[5] - a.transform[5];
            if (Math.abs(diffY) < 8) return a.transform[4] - b.transform[4];
            return diffY;
        });
    }

    // Now reconstruct paragraphs based on Y-gaps and font size
    let html = '';
    let currentBlock = [];
    let lastY = null;
    let _lastX = null;
    let lastFontSize = null;
    let _lastFontName = null;

    // Helper to flush current block
    const flushBlock = () => {
        if (currentBlock.length === 0) return;
        
        const text = currentBlock.join(' ').replace(/\s+/g, ' ').trim();
        if (text.length === 0) {
            currentBlock = [];
            return;
        }

        // Detect if header based on font size (heuristic)
        // Normal text usually 9-12pt. Headers usually >14pt
        const isHeader = lastFontSize > 13; 
        
        if (isHeader) {
            html += `<h3>${text}</h3>`;
        } else {
            html += `<p>${text}</p>`;
        }
        currentBlock = [];
    };

    for (const item of sortedItems) {
        // transform[5] is Y, transform[4] is X, transform[0] is approx font size
        const y = item.transform[5];
        const x = item.transform[4];
        const fontSize = item.transform[0];
        const fontName = item.fontName;
        const text = item.str;

        if (!text.trim()) continue;

        if (lastY !== null) {
            // Check for new paragraph (significant Y gap)
            // Or change in font size indicating header/section change
            const yGap = Math.abs(y - lastY);
            if (yGap > 12 || Math.abs(fontSize - lastFontSize) > 2) {
                flushBlock();
            }
        }

        currentBlock.push(text);
        lastY = y;
        _lastX = x;
        lastFontSize = fontSize;
        _lastFontName = fontName;
    }
    
    flushBlock();
    return html;
}

export async function detectTwoColumnLayout(pdfDocument, samplePages = 3) {
  const limit = Math.min(pdfDocument.numPages, samplePages);
  let twoColumnVotes = 0;

  for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();

    const xCoords = content.items
      .map((item) => item.transform?.[4])
      .filter((value) => typeof value === 'number');

    if (xCoords.length < 20) {
      continue;
    }

    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const midpoint = (minX + maxX) / 2;
    const leftCount = xCoords.filter((x) => x <= midpoint - 20).length;
    const rightCount = xCoords.filter((x) => x >= midpoint + 20).length;
    const balance = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount);

    if (balance > 0.45 && leftCount > 25 && rightCount > 25) {
      twoColumnVotes += 1;
    }
  }

  return twoColumnVotes >= Math.ceil(limit / 2);
}

export function buildPaperMetadataFromText(firstPagesText) {
  const merged = firstPagesText.map((page) => page.text).join('\n');
  const lines = merged.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  const title = lines.find((line) => line.length > 25 && line.length < 220) || 'Untitled Paper';
  const abstractStart = merged.toLowerCase().indexOf('abstract');
  const methodsStart = Math.max(
    merged.toLowerCase().indexOf('methods'),
    merged.toLowerCase().indexOf('materials and methods')
  );

  const abstract = abstractStart >= 0
    ? merged.slice(abstractStart, methodsStart > abstractStart ? methodsStart : abstractStart + 1600)
    : merged.slice(0, 1200);

  const methods = methodsStart >= 0 ? merged.slice(methodsStart, methodsStart + 1800) : merged.slice(0, 1800);

  return { title, abstract, methods, mergedText: merged };
}
