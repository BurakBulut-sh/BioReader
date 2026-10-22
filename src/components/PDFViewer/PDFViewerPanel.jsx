import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { FigureGalleryDrawer } from './FigureGalleryDrawer.jsx';
import { TOCDrawer } from './TOCDrawer.jsx';

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
  onToggleFigures,
  tocOpen,
  onCloseTOC,
  onToggleTOC,
  onLoadSample,
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

  // Scroll to page listener
  useEffect(() => {
    const handleScrollToPage = (e) => {
      const page = e.detail?.page;
      if (!page || !viewerRef.current) return;

      setCurrentPage(page);

      setTimeout(() => {
        const pageEl = viewerRef.current?.querySelector(`[data-page-number="${page}"]`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    };
    window.addEventListener('pdf:scroll-to-page', handleScrollToPage);
    return () => window.removeEventListener('pdf:scroll-to-page', handleScrollToPage);
  }, []);

  // Scroll tracking for page number in continuous mode
  useEffect(() => {
    if (!viewerRef.current || scrollMode !== 'continuous') return;

    const container = viewerRef.current;
    const onScroll = () => {
      const pages = container.querySelectorAll('.react-pdf__Page');
      let visiblePage = 1;
      const containerRect = container.getBoundingClientRect();

      pages.forEach((page, idx) => {
        const rect = page.getBoundingClientRect();
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
    documentRef.current = pdf;
    setNumPages(pdf.numPages);

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
        y: firstRect.top - 10,
      },
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

  const totalSearchMatches = useMemo(
    () => searchMatches.reduce((sum, m) => sum + m.count, 0),
    [searchMatches]
  );

  const handleThumbnailClick = useCallback((page) => {
    setCurrentPage(page);
    setTimeout(() => {
      const pageEl = viewerRef.current?.querySelector(`[data-page-number="${page}"]`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }, []);

  if (!filePath) {
    return (
      <div className="panel pdf-panel empty-container">
        <div className="empty-pdf-monograph">
          <div className="monograph-corner tl" />
          <div className="monograph-corner tr" />
          <div className="monograph-corner bl" />
          <div className="monograph-corner br" />

          <div className="empty-state-badge">SCHOLARLY WORKSPACE</div>
          <div className="empty-state-icon">🧬</div>
          <h3 className="empty-state-heading">No Manuscript Loaded</h3>
          <p className="empty-state-sub">
            Open a peer-reviewed PDF, pre-print, or genomic study to begin your literature session.
          </p>

          <div className="empty-cta-group">
            <button
              className="btn-primary"
              onClick={() => window.dispatchEvent(new CustomEvent('pdf:open-dialog'))}
            >
              <span>📄 Open PDF Document</span>
              <kbd className="kbd-shortcut-btn">⌘O</kbd>
            </button>

            {onLoadSample && (
              <button
                className="btn-secondary"
                onClick={onLoadSample}
                title="Load the Chironomus Riparius Mutation Study benchmark PDF"
              >
                <span>🧪 Load Sample Study</span>
                <span className="sample-pill">Chironomus WGS</span>
              </button>
            )}
          </div>

          <div className="empty-state-fine">
            Shortcuts: <strong>N</strong> Quick Note · <strong>D</strong> Glossary Lookup · <strong>⌘F</strong> Search · <strong>⌘⇧C</strong> Cite
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel pdf-panel">
      {/* Precision Controls Sub-bar */}
      <div className="pdf-controls-bar">
        <div className="pdf-controls-left">
          {/* Zoom controls */}
          <div className="control-button-group">
            <button
              className="pdf-ctrl-icon"
              onClick={() => setScale(s => getClosestScale(s - 0.25))}
              title="Zoom out"
            >
              −
            </button>
            <span className="pdf-ctrl-zoom">{Math.round(scale * 100)}%</span>
            <button
              className="pdf-ctrl-icon"
              onClick={() => setScale(s => getClosestScale(s + 0.25))}
              title="Zoom in"
            >
              +
            </button>
          </div>

          <button className="pdf-ctrl-btn" onClick={() => setScale(1.25)} title="Reset zoom to 125%">
            Fit
          </button>

          <span className="pdf-ctrl-divider" aria-hidden="true" />

          {/* Page Coordinate */}
          <span className="pdf-coord-badge">
            PAGE [{String(currentPage).padStart(2, '0')} / {String(numPages || 1).padStart(2, '0')}]
          </span>

          <span className="pdf-ctrl-divider" aria-hidden="true" />

          {/* Orientation & Scroll Mode */}
          <button
            className="pdf-ctrl-btn"
            onClick={() => setRotation(r => (r + 90) % 360)}
            title="Rotate 90 degrees clockwise"
          >
            ↻ Rotate
          </button>
          <button
            className={`pdf-ctrl-btn ${scrollMode === 'continuous' ? 'active' : ''}`}
            onClick={() => setScrollMode(m => m === 'continuous' ? 'paged' : 'continuous')}
            title="Toggle between Continuous Scroll and Paged view"
          >
            {scrollMode === 'continuous' ? '↕ Continuous' : '□ Paged'}
          </button>
        </div>

        <div className="pdf-controls-right">
          {/* Quick Drawers Toggles */}
          {onToggleTOC && (
            <button
              className={`pdf-ctrl-btn ${tocOpen ? 'active' : ''}`}
              onClick={onToggleTOC}
              title="Table of Contents (Outline)"
            >
              📑 Outline
            </button>
          )}

          {onToggleFigures && (
            <button
              className={`pdf-ctrl-btn ${figuresOpen ? 'active' : ''}`}
              onClick={onToggleFigures}
              title="Extracted Figures Gallery"
            >
              🖼️ Figures
            </button>
          )}

          <span className="pdf-ctrl-divider" aria-hidden="true" />

          {/* Search Bar */}
          <div className="search-cluster">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search manuscript..."
              className="search-input"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (searchMatches.length > 0) navigateSearch(e.shiftKey ? -1 : 1);
                  else runSearch();
                }
              }}
            />
            <button
              className={`pdf-ctrl-btn match-case-btn ${matchCase ? 'active' : ''}`}
              onClick={() => { setMatchCase(!matchCase); setTimeout(runSearch, 0); }}
              title="Match case"
            >
              Aa
            </button>
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => { setSearchQuery(''); setSearchMatches([]); }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            className="pdf-ctrl-btn search-execute-btn"
            onClick={runSearch}
            disabled={isSearching || !searchQuery}
          >
            {isSearching ? '…' : 'Find'}
          </button>

          {searchMatches.length > 0 && (
            <span className="search-counter-badge">
              {searchMatchIndex} / {totalSearchMatches}
            </span>
          )}
        </div>
      </div>

      {/* Viewer Workspace */}
      <div className="pdf-viewer-shell" onMouseUp={handleMouseUp}>
        {/* Monograph Thumbnail Rail */}
        <aside className="thumbnail-rail" aria-label="Page thumbnails">
          {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`thumb-btn ${page === currentPage ? 'active' : ''} ${notesByPage.has(page) ? 'has-notes' : ''}`}
              onClick={() => handleThumbnailClick(page)}
              title={`Jump to Page ${page}${notesByPage.has(page) ? ` (${notesByPage.get(page)} notes)` : ''}`}
            >
              <span className="thumb-num">{String(page).padStart(2, '0')}</span>
              {notesByPage.has(page) && <span className="thumb-dot" />}
            </button>
          ))}
        </aside>

        {/* Document Scroll Desk */}
        <div ref={viewerRef} className="pdf-scroll-container">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentError}
            loading={
              <div className="pdf-loading-state">
                <span className="pdf-loading-spinner" />
                <p>Loading manuscript...</p>
              </div>
            }
            error={
              <div className="pdf-error-state">
                <p>Failed to render PDF document.</p>
              </div>
            }
          >
            {scrollMode === 'paged' ? (
              <div key={`page-${currentPage}-${scale}`} className="pdf-page-wrap">
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
                    loading={
                      <div className="page-placeholder">
                        <span>Rendering Page {i + 1}...</span>
                      </div>
                    }
                  />
                </section>
              ))
            )}
          </Document>
        </div>
      </div>

      {/* Outlines & Figures Drawers */}
      <TOCDrawer
        open={tocOpen}
        onClose={onCloseTOC}
        pdfDocument={documentRef.current}
        onScrollToPage={handleThumbnailClick}
      />

      <FigureGalleryDrawer
        open={figuresOpen}
        onClose={onCloseFigures}
        pdfDocument={documentRef.current}
      />
    </div>
  );
}
