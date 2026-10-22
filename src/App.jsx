import { useEffect, useRef, useState } from 'react';
import { PDFViewerPanel } from './components/PDFViewer/PDFViewerPanel.jsx';
import { Toolbar } from './components/shared/Toolbar.jsx';
import { ToastStack } from './components/shared/ToastStack.jsx';
import { SettingsModal } from './components/Settings/SettingsModal.jsx';
import { CitationPopup } from './components/Citation/CitationPopup.jsx';
import { VocabularyDrawer } from './components/Vocabulary/VocabularyDrawer.jsx';
import { TermDetailPopup } from './components/Dictionary/TermDetailPopup.jsx';
import { QuickNoteBubble } from './components/NotesPanel/QuickNoteBubble.jsx';
import { DEFAULT_SETTINGS } from './lib/constants.js';
import { dbClient, systemClient } from './lib/database.js';
import { buildTermIndex, detectTermsInText } from './lib/termDetector.js';
import { detectSectionFromSelection } from './lib/noteManager.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { generateNotesMarkdown } from './lib/markdownExport.js';

function basename(filePath) {
  if (!filePath) return '';
  return filePath.split('/').at(-1) || filePath;
}

function withId() {
  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function normalizePdfBytes(payload) {
  if (!payload) return null;
  if (payload instanceof Uint8Array) return payload;
  if (Array.isArray(payload)) return Uint8Array.from(payload);
  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  if (payload && typeof payload === 'object' && payload.type === 'Buffer' && Array.isArray(payload.data)) {
    return Uint8Array.from(payload.data);
  }
  if (payload instanceof ArrayBuffer) {
    return new Uint8Array(payload);
  }
  return null;
}

export default function App() {
  const rootRef = useRef(null);

  // Core settings & database state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dbPaths, setDbPaths] = useState({});
  const [backups, setBackups] = useState([]);
  const [appInitialized, setAppInitialized] = useState(false);

  // Active Paper state
  const [currentPaper, setCurrentPaper] = useState(null);
  const [currentFilePath, setCurrentFilePath] = useState('');
  const [currentPdfData, setCurrentPdfData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  // Content state
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [notes, setNotes] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [vocabTerms, setVocabTerms] = useState([]);

  // UI / Panel state
  const [selection, setSelection] = useState(null);
  const [quickNoteState, setQuickNoteState] = useState({ open: false, type: 'quick' });
  const [selectionTerms, setSelectionTerms] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [citationOpen, setCitationOpen] = useState(false);
  const [figuresOpen, setFiguresOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [vocabDrawerOpen, setVocabDrawerOpen] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);

  // Notes filtering and search state
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState('all');

  const termIndex = buildTermIndex(terms);

  // Keyboard shortcuts
  const shortcutHandlers = {
    quickNote: { handler: () => triggerNote('quick') },
    deepNote: { handler: () => triggerNote('deep') },
    questionNote: { handler: () => triggerNote('question') },
    critiqueNote: { handler: () => triggerNote('critique') },
    insightNote: { handler: () => triggerNote('insight') },
    dictionaryLookup: { handler: () => lookupSelectionTerm() },
    searchPdf: { handler: () => window.dispatchEvent(new CustomEvent('pdf:focus-search')) },
    toggleHighlights: { handler: () => setShowHighlights(prev => !prev) },
    panelRight: { handler: () => setShowNotesPanel(v => !v) },
    globalDictionary: { handler: () => setVocabDrawerOpen(v => !v) },
    escape: {
      handler: () => {
        setSettingsOpen(false);
        setFiguresOpen(false);
        setTocOpen(false);
        setVocabDrawerOpen(false);
        setSelectedTerm(null);
        setQuickNoteState(s => ({ ...s, open: false }));
      },
    },
  };

  useKeyboardShortcuts(settings.shortcuts, shortcutHandlers);

  // Initial data loading
  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const [
          loadedTerms,
          loadedNotes,
          loadedTheme,
          loadedShortcuts,
          paths,
          loadedBackups,
          loadedVocab,
        ] = await Promise.all([
          dbClient.terms.list(),
          dbClient.notes.list(),
          dbClient.prefs.get('theme', DEFAULT_SETTINGS.theme),
          dbClient.prefs.get('shortcuts', DEFAULT_SETTINGS.shortcuts),
          systemClient.getPaths(),
          dbClient.backups.list(),
          dbClient.vocab.list(),
        ]);

        if (!mounted) return;

        setTerms(loadedTerms);
        setNotes(loadedNotes);
        setVocabTerms(loadedVocab || []);
        setSettings(current => ({
          ...current,
          theme: loadedTheme,
          shortcuts: { ...current.shortcuts, ...loadedShortcuts },
        }));
        setDbPaths(paths || {});
        setBackups(loadedBackups || []);
      } catch (error) {
        console.error('[App] failed to load initial data', error);
        addToast('Initialization error', error.message, 'error');
      } finally {
        if (mounted) setAppInitialized(true);
      }
    }

    loadInitialData();

    // Register system event handlers
    const offOpen = systemClient.onOpenPdfRequest(() => openPdf());
    const offOpenFile = systemClient.onOpenFileRequest?.((path) => {
      if (path) loadPdfFromPath(path).catch(console.error);
    });
    const offFind = systemClient.onFindRequest?.(() => {
      window.dispatchEvent(new CustomEvent('pdf:focus-search'));
    });

    const handleOpenDialog = () => openPdf();
    window.addEventListener('pdf:open-dialog', handleOpenDialog);

    return () => {
      mounted = false;
      window.removeEventListener('pdf:open-dialog', handleOpenDialog);
      if (typeof offOpen === 'function') offOpen();
      if (typeof offOpenFile === 'function') offOpenFile?.();
      if (typeof offFind === 'function') offFind?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme sync
  useEffect(() => {
    dbClient.prefs.set('theme', settings.theme);
    systemClient.setNativeTheme(settings.theme === 'dark' ? 'dark' : 'light');
  }, [settings.theme]);

  // Auto backup every 30 minutes
  useEffect(() => {
    if (!appInitialized) return;
    const interval = setInterval(() => {
      createBackup().catch(console.error);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [appInitialized]);

  // Toast helper
  function addToast(title, message = '', type = 'info') {
    const id = withId();
    setToasts(current => [...current, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(current => current.filter(t => t.id !== id));
    }, 4000);
  }

  // PDF loading
  async function loadPdfFromPath(selectedPath) {
    if (!selectedPath) return false;

    try {
      const rawPdfData = await systemClient.readPdfFile(selectedPath);
      const pdfData = normalizePdfBytes(rawPdfData);

      if (!pdfData || pdfData.length === 0) {
        throw new Error('PDF bytes were empty or invalid.');
      }

      setCurrentFilePath(selectedPath);
      setCurrentPdfData(pdfData);

      // Check if paper already exists
      const knownPapers = await dbClient.papers.list();
      const existing = knownPapers.find(p => p.file_path === selectedPath);

      if (existing) {
        setCurrentPaper(existing);
        const [paperNotes, paperHighlights] = await Promise.all([
          dbClient.notes.list(existing.id),
          dbClient.highlights.list(existing.id),
        ]);
        setNotes(paperNotes);
        setHighlights(paperHighlights);
      } else {
        const paper = await dbClient.papers.upsert({
          title: basename(selectedPath),
          abstract: '',
          file_path: selectedPath,
          workflow_type: 'other',
        });
        setCurrentPaper(paper);
        setNotes([]);
        setHighlights([]);
      }

      return true;
    } catch (error) {
      console.error('[PDF] load failed', error);
      addToast('Failed to open PDF', error.message, 'error');
      return false;
    }
  }

  async function openPdf() {
    try {
      const selectedPath = await systemClient.openPdfDialog();
      if (selectedPath) await loadPdfFromPath(selectedPath);
    } catch (error) {
      addToast('Failed to open PDF', error.message, 'error');
    }
  }

  // Load sample test study
  async function loadSampleStudy() {
    try {
      const basePath = dbPaths.appPath || '.';
      const candidatePaths = [
        `${basePath}/fixtures/chironomus_mutation_study.pdf`,
        `${basePath}/chironomus_mutation_study.pdf`,
        `${basePath}/article.pdf`,
      ];

      for (const p of candidatePaths) {
        try {
          const loaded = await loadPdfFromPath(p);
          if (loaded) {
            addToast('Study Loaded', `${basename(p)} loaded into workspace`, 'success');
            return;
          }
        } catch {
          // try next
        }
      }
      openPdf();
    } catch (err) {
      console.error('Failed to load sample study', err);
      openPdf();
    }
  }

  // Note management
  function triggerNote(noteType) {
    if (!selection?.text) {
      addToast('No selected text', 'Select text in the PDF first.', 'warning');
      return;
    }
    setQuickNoteState({ open: true, type: noteType });
  }

  async function saveQuickNote(text, overriddenType) {
    if (!currentPaper || !selection) {
      addToast('Cannot save note', 'Open a paper and select text first.', 'error');
      return;
    }

    let noteType = overriddenType || quickNoteState.type || 'quick';
    let finalText = text || '(No note text entered)';

    if (finalText.startsWith('?')) {
      noteType = 'question';
      finalText = finalText.slice(1).trim() || finalText;
    } else if (finalText.startsWith('!')) {
      noteType = 'insight';
      finalText = finalText.slice(1).trim() || finalText;
    }

    const note = await dbClient.notes.create({
      paper_id: currentPaper.id,
      page: selection.page,
      section: detectSectionFromSelection(selection.text),
      type: noteType,
      note_text: finalText,
      highlighted_text: selection.text,
      paper_citation: `${currentPaper.title.split(' ')[0]} et al.`,
      tags: [],
      links: [],
    });

    setNotes(current => [note, ...current]);
    setQuickNoteState(s => ({ ...s, open: false }));
    setSelection(null);
    addToast('Note Saved', `Added to Page ${selection.page}`, 'success');
  }

  async function deleteNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (window.confirm('Delete this note?')) {
      await dbClient.notes.delete(noteId);
      setNotes(current => current.filter(n => n.id !== noteId));
      addToast('Note deleted', '', 'info');
    }
  }

  async function exportNotes() {
    if (!currentPaper || notes.length === 0) {
      addToast('No notes to export', 'Create some notes first.', 'info');
      return;
    }

    try {
      const markdown = generateNotesMarkdown(currentPaper, notes);
      const fileName = `${currentPaper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;

      const savedPath = await systemClient.saveFile({
        content: markdown,
        defaultPath: fileName,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });

      if (savedPath) {
        addToast('Notes exported', `Saved to ${basename(savedPath)}`, 'success');
      }
    } catch (error) {
      addToast('Export failed', error.message, 'error');
    }
  }

  function handleNoteClick(note) {
    window.dispatchEvent(new CustomEvent('pdf:scroll-to-page', {
      detail: { page: note.page, highlightedText: note.highlighted_text },
    }));
  }

  // Dictionary / Terms
  async function lookupTerm(name) {
    if (!name?.trim()) return;

    try {
      let term = await dbClient.terms.get(name.trim());
      if (!term) {
        const results = await dbClient.terms.search({ query: name.trim(), limit: 1 });
        term = results[0];
      }

      if (!term) {
        addToast('No glossary match', `No entry found for "${name.trim()}"`, 'warning');
        return;
      }

      setSelectedTerm(term);
    } catch (error) {
      addToast('Dictionary lookup failed', error.message, 'error');
    }
  }

  function lookupSelectionTerm() {
    if (!selection?.text) {
      addToast('No selection', 'Select text in the PDF first.', 'warning');
      return;
    }
    lookupTerm(selection.text);
  }

  async function saveTermToVocab(term) {
    try {
      const existing = await dbClient.vocab.get(term.name);
      if (existing) {
        addToast('Already saved', `"${term.name}" is already in your library.`, 'info');
        return;
      }
      const newTerm = await dbClient.vocab.create({
        ...term,
        status: 'New',
        workflow: 'General',
      });
      setVocabTerms(prev => [newTerm, ...prev]);
      addToast('Saved to Glossary', `"${term.name}" bookmarked.`, 'success');
      setSelectedTerm(null);
    } catch (error) {
      addToast('Failed to save term', error.message, 'error');
    }
  }

  function onPdfSelection(payload) {
    setSelection(payload);
    setSelectionTerms([]);
    setQuickNoteState({ open: true, type: 'quick' });

    if (payload?.text && termIndex) {
      const detected = detectTermsInText(payload.text, termIndex, 'other');
      setSelectionTerms(detected.filter(t => !t.isPotential));
    }
  }

  function updateSetting(key, value) {
    setSettings(current => ({ ...current, [key]: value }));
    dbClient.prefs.set(key, value);
  }

  async function createBackup() {
    await dbClient.backups.create();
    const list = await dbClient.backups.list();
    setBackups(list);
  }

  async function handlePaperMetadata(metadata) {
    if (!currentFilePath || !currentPaper) return;

    try {
      const paper = await dbClient.papers.upsert({
        id: currentPaper.id,
        title: metadata.title || currentPaper.title,
        abstract: metadata.abstract,
        file_path: currentFilePath,
        workflow_type: 'other',
      });
      setCurrentPaper(paper);
    } catch (error) {
      console.error('Metadata save failed', error);
    }
  }

  // Filter notes for current paper
  const currentPaperNotes = notes.filter(n => n.paper_id === currentPaper?.id);

  const filteredPaperNotes = currentPaperNotes.filter(note => {
    if (noteTypeFilter !== 'all' && note.type !== noteTypeFilter) return false;
    if (noteSearchQuery.trim()) {
      const q = noteSearchQuery.toLowerCase();
      const matchText = (note.note_text || '').toLowerCase().includes(q);
      const matchQuote = (note.highlighted_text || '').toLowerCase().includes(q);
      return matchText || matchQuote;
    }
    return true;
  });

  const noteCategories = [
    { id: 'all', label: 'All' },
    { id: 'quick', label: 'Quick' },
    { id: 'deep', label: 'Deep' },
    { id: 'question', label: 'Question' },
    { id: 'critique', label: 'Critique' },
    { id: 'insight', label: 'Insight' },
  ];

  return (
    <div className="app-root" ref={rootRef} data-theme={settings.theme || 'bright'}>
      <Toolbar
        paperTitle={currentPaper?.title || basename(currentFilePath)}
        currentPage={currentPage}
        numPages={numPages}
        onOpenPdf={openPdf}
        onOpenSettings={() => setSettingsOpen(true)}
        currentTheme={settings.theme || 'bright'}
        onToggleTheme={(theme) => updateSetting('theme', theme)}
        onCitePaper={() => currentPaper && setCitationOpen(true)}
        onToggleFigures={() => setFiguresOpen(v => !v)}
        onToggleTOC={() => setTocOpen(v => !v)}
        onOpenVocab={() => setVocabDrawerOpen(true)}
        onToggleNotes={() => setShowNotesPanel(v => !v)}
        notesCount={currentPaperNotes.length}
        showNotesPanel={showNotesPanel}
      />

      <div className="main-layout">
        {/* Left: PDF Viewer */}
        <div className={`pdf-section ${showNotesPanel && currentPaper ? 'with-notes' : ''}`}>
          <PDFViewerPanel
            filePath={currentFilePath}
            fileData={currentPdfData}
            highlights={highlights}
            showHighlights={showHighlights}
            notes={notes}
            onPaperMetadata={handlePaperMetadata}
            onProgressChange={async (pageNum, total) => {
              setCurrentPage(pageNum);
              setNumPages(total);
              if (!currentPaper?.id) return;
              try {
                await dbClient.papers.updateProgress({
                  id: currentPaper.id,
                  progress: pageNum / total,
                  workflowType: 'other',
                });
              } catch (e) {
                console.error('Progress update failed', e);
              }
            }}
            onSelection={onPdfSelection}
            figuresOpen={figuresOpen}
            onCloseFigures={() => setFiguresOpen(false)}
            onToggleFigures={() => setFiguresOpen(v => !v)}
            tocOpen={tocOpen}
            onCloseTOC={() => setTocOpen(false)}
            onToggleTOC={() => setTocOpen(v => !v)}
            onLoadSample={loadSampleStudy}
          />
        </div>

        {/* Right: Monograph Research Notes Panel */}
        {showNotesPanel && currentPaper && (
          <aside className="notes-section" aria-label="Research Notes">
            <div className="notes-panel-header">
              <div className="header-left">
                <span className="section-index-tag">[ 01 / NOTES ]</span>
                <span className="notes-count-badge">({currentPaperNotes.length})</span>
              </div>
              <div className="notes-actions">
                {currentPaperNotes.length > 0 && (
                  <button className="btn-export-notes" onClick={exportNotes} title="Export Notes as Markdown (.md)">
                    Export .md
                  </button>
                )}
                <button
                  className="btn-close-notes"
                  onClick={() => setShowNotesPanel(false)}
                  title="Close notes panel"
                  aria-label="Close notes panel"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Note Search & Category Filters */}
            <div className="notes-filter-bar">
              <div className="note-search-wrapper">
                <input
                  type="text"
                  placeholder="Filter notes..."
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  className="note-search-input"
                />
                {noteSearchQuery && (
                  <button className="clear-note-search" onClick={() => setNoteSearchQuery('')}>
                    ✕
                  </button>
                )}
              </div>

              <div className="note-category-tabs" role="tablist">
                {noteCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`cat-tab ${noteTypeFilter === cat.id ? 'active' : ''}`}
                    onClick={() => setNoteTypeFilter(cat.id)}
                    role="tab"
                    aria-selected={noteTypeFilter === cat.id}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Cards List */}
            <div className="notes-list">
              {filteredPaperNotes.length === 0 ? (
                <div className="notes-empty">
                  <div className="empty-icon">📝</div>
                  <h4 className="empty-title">
                    {noteSearchQuery || noteTypeFilter !== 'all' ? 'No matching notes' : 'No research notes yet'}
                  </h4>
                  <p className="empty-hint">
                    Select text in the manuscript to create a note, or press <strong>N</strong> (Quick), <strong>D</strong> (Deep), <strong>Q</strong> (Question), <strong>C</strong> (Critique), or <strong>I</strong> (Insight).
                  </p>
                </div>
              ) : (
                filteredPaperNotes.map((note) => (
                  <article
                    key={note.id}
                    className={`note-card ${note.type}`}
                    onClick={() => handleNoteClick(note)}
                    title="Click to jump to page in manuscript"
                  >
                    <header className="note-card-top">
                      <span className="note-page-tag">
                        PAGE {String(note.page).padStart(2, '0')}
                      </span>
                      <span className={`note-type-badge ${note.type}`}>
                        {note.type.toUpperCase()}
                      </span>
                      <button
                        className="note-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        ×
                      </button>
                    </header>

                    {note.highlighted_text && (
                      <blockquote className="note-card-quote">
                        "{note.highlighted_text.slice(0, 150)}{note.highlighted_text.length > 150 ? '...' : ''}"
                      </blockquote>
                    )}

                    <div className="note-card-body">{note.note_text}</div>
                  </article>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        dbPaths={dbPaths}
        backups={backups}
        onClose={() => setSettingsOpen(false)}
        onChange={updateSetting}
        onCreateBackup={createBackup}
        onRestoreBackup={async (path) => {
          if (window.confirm('Restore this backup? Current data will be replaced.')) {
            try {
              await dbClient.backups.restore(path);
              addToast('Restore complete', 'Please restart BioReader.', 'success');
            } catch (error) {
              addToast('Restore failed', error.message, 'error');
            }
          }
        }}
      />

      {quickNoteState.open && (
        <QuickNoteBubble
          open={quickNoteState.open}
          position={selection?.rect}
          noteType={quickNoteState.type}
          selectedText={selection?.text}
          detectedTerms={selectionTerms}
          onTermClick={lookupTerm}
          onSave={saveQuickNote}
          onCancel={() => setQuickNoteState(s => ({ ...s, open: false }))}
        />
      )}

      <CitationPopup
        open={citationOpen}
        paper={currentPaper}
        onClose={() => setCitationOpen(false)}
        onToast={addToast}
      />

      <VocabularyDrawer
        open={vocabDrawerOpen}
        onClose={() => setVocabDrawerOpen(false)}
        terms={vocabTerms}
      />

      {selectedTerm && (
        <TermDetailPopup
          term={selectedTerm}
          position={selection?.rect}
          onClose={() => setSelectedTerm(null)}
          onSaveToVocab={saveTermToVocab}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
