import debounce from 'lodash.debounce';

const CATEGORY_TO_CLASS = {
  Biology: 'term-biology',
  Statistics: 'term-statistics',
  Methods: 'term-methods',
  Format: 'term-format',
  Genomics: 'term-biology',
  Bioinformatics: 'term-methods',
  Technical: 'term-format',
};

function normalizeToken(value) {
  return value
    .toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '')
    .trim();
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(input) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildTermIndex(terms) {
  const usable = terms
    .map((term) => ({
      key: term.name.toLowerCase(),
      name: term.name,
      category: term.category,
      aliases: term.aliases || [],
      workflowTags: term.workflowTags || [],
    }))
    .flatMap((term) => [term, ...term.aliases.map((alias) => ({ ...term, key: alias.toLowerCase(), alias }))])
    .filter((entry) => entry.key.length > 2)
    .sort((a, b) => b.key.length - a.key.length);

  const chunks = [];
  const tokenMap = new Map();
  const chunkSize = 180;
  for (let i = 0; i < usable.length; i += chunkSize) {
    const part = usable.slice(i, i + chunkSize);
    const pattern = part.map((entry) => escapeRegex(entry.key)).join('|');
    chunks.push({
      entries: part,
      regex: new RegExp(`\\b(${pattern})\\b`, 'gi'),
      map: new Map(part.map((entry) => [entry.key, entry])),
    });
  }

  for (const entry of usable) {
    if (entry.key.includes(' ')) continue;
    const token = normalizeToken(entry.key);
    if (!token || token.length < 3) continue;
    if (!tokenMap.has(token)) {
      tokenMap.set(token, entry);
    }
  }

  return { chunks, tokenMap, termCount: usable.length };
}

export function detectTermsInText(text, termIndex, workflow = null) {
  if (!text || !termIndex) {
    return [];
  }

  const matches = [];
  // 1. Regular Term Matching
  for (const chunk of termIndex.chunks) {
    chunk.regex.lastIndex = 0;
    let hit;
    while ((hit = chunk.regex.exec(text)) !== null) {
      const key = hit[0].toLowerCase();
      const entry = chunk.map.get(key);
      if (!entry) continue;
      let score = entry.key.length;
      if (workflow && entry.workflowTags?.includes(workflow)) {
        score += 8;
      }
      matches.push({
        start: hit.index,
        end: hit.index + hit[0].length,
        matchedText: hit[0],
        canonical: entry.name,
        category: entry.category,
        score,
      });
    }
  }

  // 2. Acronym Heuristic
  // Look for all-caps words (2-6 chars) that are NOT already matched
  const acronymRegex = /\b([A-Z]{2,6})\b/g;
  let acroHit;
  while ((acroHit = acronymRegex.exec(text)) !== null) {
    const acronym = acroHit[0];
    const start = acroHit.index;
    const end = start + acronym.length;

    // Skip if already covered by a known term match
    const alreadyCovered = matches.some(m => Math.max(start, m.start) < Math.min(end, m.end));
    if (alreadyCovered) continue;

    // Attempt to resolve acronym from term index (if defined as alias)
    // or check against common bio-acronyms if we had a list.
    // For now, let's see if there is a term where the acronym matches the start of words
    // This is expensive to do for every acronym on the fly without a pre-built acronym map.
    // A better approach is to add a generic "Potential Acronym" hit if it looks like one,
    // enabling the user to click and define it.

    matches.push({
      start,
      end,
      matchedText: acronym,
      canonical: acronym,
      category: 'Acronym', // Special category
      score: 1, // Low score so explicit terms override
      isPotential: true
    });
  }

  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.score - a.score;
  });

  const resolved = [];
  let cursor = -1;
  for (const match of matches) {
    if (match.start < cursor) continue;
    resolved.push(match);
    cursor = match.end;
  }

  return resolved;
}

export function renderTextWithTermMarkup(text, termIndex, workflow = null) {
  const matches = detectTermsInText(text, termIndex, workflow);
  if (matches.length === 0) {
    const fallbackMatch = text.match(/^([^A-Za-z0-9]*)([A-Za-z0-9][A-Za-z0-9+.-]*)([^A-Za-z0-9]*)$/);
    if (!fallbackMatch) {
      return escapeHtml(text);
    }

    const [, prefix, token, suffix] = fallbackMatch;
    const normalized = normalizeToken(token);
    if (!normalized || !termIndex?.tokenMap?.has(normalized)) {
      return escapeHtml(text);
    }

    const entry = termIndex.tokenMap.get(normalized);
    const cssClass = CATEGORY_TO_CLASS[entry.category] || 'term-biology';
    return `${escapeHtml(prefix)}<span class="term-hit ${cssClass}" data-term="${escapeHtml(
      entry.name
    )}" data-category="${escapeHtml(entry.category)}">${escapeHtml(token)}</span>${escapeHtml(
      suffix
    )}`;
  }

  let output = '';
  let last = 0;

  for (const match of matches) {
    if (match.start > last) {
      output += escapeHtml(text.slice(last, match.start));
    }

    const cssClass = CATEGORY_TO_CLASS[match.category] || 'term-biology';
    const escaped = escapeHtml(text.slice(match.start, match.end));
    output += `<span class="term-hit ${cssClass}" data-term="${escapeHtml(
      match.canonical
    )}" data-category="${escapeHtml(match.category)}">${escaped}</span>`;

    last = match.end;
  }

  if (last < text.length) {
    output += escapeHtml(text.slice(last));
  }

  return output;
}

export function makeDebouncedDetector(fn, wait = 500) {
  return debounce(fn, wait);
}
