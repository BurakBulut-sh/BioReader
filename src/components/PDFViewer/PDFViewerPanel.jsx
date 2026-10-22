import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { PanelHeader } from '../shared/PanelHeader.jsx';
import { FigureGalleryDrawer } from './FigureGalleryDrawer.jsx';

const SCALE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

function getClosestScale(target) {
  return SCALE_STEPS.reduce((prev, curr) => 
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

export function PDFViewerPanel({
  filePath,
  fileData,
  _highlights,
  _showHighlights = true,
  notes,
  onPaperMetadata,
  onProgressChange,
  onSelection,
  figuresOpen,
  onCloseFigures,
}) {
  const viewerRef = useRef(null);
  const searchInputRef = useRef(null);
  const documentRef = useRef(null);
  
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [rotation, setRotation] = useState(0);
  const [scrollMode, setScrollMode] = useState('continuous');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [searchMatches, setSearchMatches] = useState([]);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  // Build file object from fileData or filePath
  const file = useMemo(() => {
    if (fileData instanceof Uint8Array) {
      return { data: fileData };
    }
    if (!filePath) return null;
    return { url: encodeURI(`file://${filePath}`) };
  }, [filePath, fileData]);

  // Reset state when file changes
  useEffect(() => {
    if (filePath) {
      setCurrentPage(1);
      setNumPages(0);
      setSearchQuery('');
      setSearchMatches([]);
      setScale(1.25);
    }
  }, [filePath]);

  // Track progress
  useEffect(() => {
    if (numPages > 0 && currentPage > 0) {
      onProgressChange?.(currentPage, numPages);
    }
  }, [currentPage, numPages, onProgressChange]);

  // Search focus listener
  useEffect(() => {
    const listener = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener('pdf:focus-search', listener);
    return () => window.removeEventListener('pdf:focus-search', listener);
  }, []);

  // Scroll to page listener - FIXED
  useEffect(() => {
    const handleScrollToPage = (e) => {
      const page = e.detail?.page;
      if (!page || !viewerRef.current) return;
      
      console.log('[PDFViewer] Scrolling to page:', page);
      setCurrentPage(page);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const pageEl = viewerRef.current?.querySelector(`[data-page-number="${page}"]`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('[PDFViewer] Scrolled to page element:', page);
        } else {
          console.warn('[PDFViewer] Page element not found:', page);
        }
      }, 50);
    };
    window.addEventListener('pdf:scroll-to-page', handleScrollToPage);
    return () => window.removeEventListener('pdf:scroll-to-page', handleScrollToPage);
  }, []);

  // Scroll tracking for page number
  useEffect(() => {
    if (!viewerRef.current || scrollMode !== 'continuous') return;
    
    const container = viewerRef.current;
    const onScroll = () => {
      const pages = container.querySelectorAll('.react-pdf__Page');
      let visiblePage = 1;
      const containerRect = container.getBoundingClientRect();
      
      pages.forEach((page, idx) => {
        const rect = page.getBoundingClientRect();
        // If page top is within viewport (with some offset)
        if (rect.top <= containerRect.top + 100 && rect.bottom > containerRect.top + 100) {
          visiblePage = idx + 1;
        }
      });
      
      if (visiblePage !== currentPage) {
        setCurrentPage(visiblePage);
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [scrollMode, currentPage]);

  // Document load handlers
  const onDocumentLoadSuccess = useCallback(async (pdf) => {
    console.log('[PDFViewer] Document loaded, pages:', pdf.numPages);
    documentRef.current = pdf;
    setNumPages(pdf.numPages);
    
    // Extract text from first few pages for metadata
    try {
      const texts = [];
      for (let i = 1; i <= Math.min(3, pdf.numPages); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        texts.push(text);
      }
      
      const fullText = texts.join(' ');
      const lines = fullText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10);
      const title = lines[0] || filePath?.split('/').pop()?.replace('.pdf', '') || 'Untitled';
      
      onPaperMetadata?.({ title, abstract: texts.slice(0, 2).join(' ') });
    } catch (e) {
      console.error('Metadata extraction failed', e);
    }
  }, [filePath, onPaperMetadata]);

  const onDocumentError = useCallback((error) => {
    console.error('[PDF] Load error:', error);
  }, []);

  // Search functionality
  const runSearch = useCallback(async () => {
    if (!searchQuery || !documentRef.current) {
      setSearchMatches([]);
      return;
    }

    setIsSearching(true);
    const matches = [];
    
    try {
      const flags = matchCase ? 'g' : 'gi';
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, flags);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        let text = '';
        try {
          const page = await documentRef.current.getPage(pageNum);
          const textContent = await page.getTextContent();
          text = textContent.items.map(item => item.str).join(' ');
        } catch {
          continue;
        }

        const count = (text.match(regex) || []).length;
        if (count > 0) {
          matches.push({ page: pageNum, count });
        }
      }

      setSearchMatches(matches);
      if (matches.length > 0) {
        setSearchMatchIndex(1);
        setCurrentPage(matches[0].page);
        setTimeout(() => {
          const pageEl = viewerRef.current?.querySelector(`[data-page-number="${matches[0].page}"]`);
          if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    } catch (e) {
      console.error('Search failed', e);
    }
    
    setIsSearching(false);
  }, [searchQuery, matchCase, numPages]);

  const navigateSearch = useCallback((direction) => {
    if (searchMatches.length === 0) return;
    
    const total = searchMatches.reduce((sum, m) => sum + m.count, 0);
    let newIndex = searchMatchIndex + direction;
    if (newIndex < 1) newIndex = total;
    if (newIndex > total) newIndex = 1;
    
    setSearchMatchIndex(newIndex);
    
    let count = 0;
    for (const match of searchMatches) {
      if (newIndex <= count + match.count) {
        setCurrentPage(match.page);
        setTimeout(() => {
          const pageEl = viewerRef.current?.querySelector(`[data-page-number="${match.page}"]`);
          if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        break;
      }
      count += match.count;
    }
  }, [searchMatches, searchMatchIndex]);

  // Text selection handler
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString()?.trim();
    if (!text || text.length < 2) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length === 0) return;

    const firstRect = rects[0];
    onSelection?.({
      text,
      page: currentPage,
      rect: {
        x: firstRect.left + firstRect.width / 2,
        y: firstRect.top - 10
      }
    });
  }, [currentPage, onSelection]);

  // Count notes per page for thumbnail indicators
  const notesByPage = useMemo(() => {
    const map = new Map();
    for (const note of notes || []) {
      const p = Number(note.page);
      if (p > 0) map.set(p, (map.get(p) || 0) + 1);
    }
    return map;
  }, [notes]);

  // Calculate total search matches
  const totalSearchMatches = useMemo(() => 
    searchMatches.reduce((sum, m) => sum + m.count, 0),
    [searchMatches]
  );

  // Handle thumbnail click - FIXED
  const handleThumbnailClick = useCallback((page) => {
    console.log('[PDFViewer] Thumbnail clicked, page:', page);
    setCurrentPage(page);
    
    // Scroll to the page
    setTimeout(() => {
      const pageEl = viewerRef.current?.querySelector(`[data-page-number="${page}"]`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('[PDFViewer] Scrolled to page:', page);
      }
    }, 50);
  }, []);

  if (!filePath) {
    return (
      <div className="panel pdf-panel">
        <PanelHeader title="Paper" subtitle="Open a PDF" />
        <div className="empty-pdf-state">
          <div className="empty-state-icon">📄</div>
          <h3 className="empty-state-heading">Drop a PDF here</h3>
          <p className="empty-state-sub">or press <strong>⌘O</strong> to open one</p>
          <button 
            className="button-primary" 
            onClick={() => window.dispatchEvent(new CustomEvent('pdf:open-dialog'))}
            style={{ marginTop: '24px' }}
          >
            Open PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel pdf-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader 
        title="Paper" 
        subtitle={`Page ${currentPage}/${numPages || '?'}`} 
      />

      {/* Controls Bar */}
      <div className="pdf-controls-bar">
        <div className="pdf-controls-left">
          <button className="pdf-ctrl-icon" onClick={() => setScale(s => getClosestScale(s - 0.25))}>−</button>
          <span className="pdf-ctrl-zoom">{Math.round(scale * 100)}%</span>
          <button className="pdf-ctrl-icon" onClick={() => setScale(s => getClosestScale(s + 0.25))}>+</button>
          <button className="pdf-ctrl-btn" onClick={() => setScale(1.25)}>Fit</button>
          <div className="pdf-ctrl-divider" />
          <button className="pdf-ctrl-btn" onClick={() => setRotation(r => (r + 90) % 360)}>↻</button>
          <button 
            className="pdf-ctrl-btn" 
            onClick={() => setScrollMode(m => m === 'continuous' ? 'paged' : 'continuous')}
          >
            {scrollMode === 'continuous' ? '↕ Scroll' : '□ Page'}
          </button>
        </div>

        <div className="pdf-controls-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px' }}>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{ border: 'none', background: 'transparent', outline: 'none', padding: '4px', fontSize: '13px', width: '120px' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (searchMatches.length > 0) navigateSearch(e.shiftKey ? -1 : 1);
                  else runSearch();
                }
              }}
            />
            <button 
              className={`pdf-ctrl-btn ${matchCase ? 'active' : ''}`} 
              onClick={() => { setMatchCase(!matchCase); setTimeout(runSearch, 0); }}
              style={{ padding: '2px 6px', fontSize: '11px' }}
            >
              Aa
            </button>
            {searchQuery && (
              <button 
                className="pdf-ctrl-btn" 
                onClick={() => { setSearchQuery(''); setSearchMatches([]); }}
                style={{ padding: '2px 6px' }}
              >
                ✕
              </button>
            )}
          </div>
          <button className="pdf-ctrl-btn" onClick={runSearch} disabled={isSearching || !searchQuery}>
            {isSearching ? '…' : 'Find'}
          </button>
          {searchMatches.length > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {searchMatchIndex} / {totalSearchMatches}
            </span>
          )}
        </div>
      </div>

      {/* Viewer */}
      <div className="pdf-viewer-shell" onMouseUp={handleMouseUp} style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside className="thumbnail-rail" style={{ display: 'flex' }}>
          {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`${page === currentPage ? 'active' : ''} ${notesByPage.has(page) ? 'has-notes' : ''}`}
              onClick={() => handleThumbnailClick(page)}
            >
              {page}
            </button>
          ))}
        </aside>

        <div 
          ref={viewerRef}
          className="pdf-scroll-container"
          style={{ flex: 1, overflow: 'auto', padding: '20px' }}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentError}
            loading={<div style={{ padding: '40px', textAlign: 'center' }}>Loading PDF...</div>}
            error={<div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>Failed to load PDF</div>}
          >
            {scrollMode === 'paged' ? (
              <div key={`page-${currentPage}-${scale}`}>
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </div>
            ) : (
              Array.from({ length: numPages }, (_, i) => (
                <section key={`page-${i + 1}`} className="pdf-page-wrap">
                  <Page
                    pageNumber={i + 1}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer
                    renderAnnotationLayer
                    loading={<div style={{ height: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading page {i + 1}...</div>}
                  />
                </section>
              ))
            )}
          </Document>
        </div>
      </div>

      <FigureGalleryDrawer
        open={figuresOpen}
        onClose={onCloseFigures}
        pdfDocument={documentRef.current}
      />
    </div>
  );
}
