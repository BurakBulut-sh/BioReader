import { useEffect, useMemo, useRef, useState } from 'react';
import { PanelHeader } from '../shared/PanelHeader.jsx';
import { exportPaperToMarkdown, exportPaperToBibtex, exportNotesToAnki, downloadExport } from '../../lib/exporters.js';
import { TopicSynthesisModal } from '../TopicManager/TopicSynthesisModal.jsx';
import { TopicSelectorModal } from './TopicSelectorModal.jsx';
import { Tabs, NoteCard, EmptyState } from '../shared/PremiumComponents.jsx';

function KebabMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="kebab-container" ref={menuRef}>
      <button className="kebab-trigger" ref={triggerRef} onClick={handleToggle} aria-label="More actions">
        ⋮
      </button>
      {open && (
        <div className="kebab-menu" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px', background: 'white', border: '1px solid var(--gray-200)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', position: 'fixed', right: 'auto', left: menuPos.left, top: menuPos.top, transform: 'translateX(-100%)', zIndex: 9999, minWidth: '140px' }}>
          {actions.map((action, i) => (
            <button
              key={i}
              className={action.type === 'danger' ? 'btn-danger' : 'btn-ghost'}
              style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '13px' }}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setOpen(false);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function VirtualNotes({ notes, renderItem }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 160; // Increased for premium cards
  const visibleRows = 8;

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const end = Math.min(notes.length, start + visibleRows + 6);
  const paddingTop = start * rowHeight;
  const paddingBottom = Math.max(0, (notes.length - end) * rowHeight);

  return (
    <div
      className="notes-virtual-container"
      ref={containerRef}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ paddingTop, paddingBottom }}>
        {notes.slice(start, end).map((note, idx) => renderItem(note, start + idx))}
      </div>
    </div>
  );
}

function TopicCards({ topics, notesByTopic, onOpenSynthesis }) {
  if (topics.length === 0) {
    return (
      <EmptyState
        title="No Topics Found"
        description="Create your first topic to organize your research notes into thematic synthesis."
        icon="📁"
      />
    );
  }

  return (
    <div className="topic-cards">
      {topics.map((topic) => (
        <article key={topic.id} className="topic-card" onClick={() => onOpenSynthesis(topic)}>
          <header>
            <h3>{topic.name}</h3>
            <span className="topic-color" style={{ backgroundColor: topic.color }} />
          </header>
          <p>{topic.description || 'No description yet.'}</p>
          <footer>
            <small>{notesByTopic.get(topic.id)?.length || 0} notes</small>
            <small>{new Date(topic.updated_at).toLocaleDateString()}</small>
          </footer>
        </article>
      ))}
    </div>
  );
}

export function NotesPanel({
  collapsed,
  onToggle,
  currentPaper,
  notes,
  topics,
  noteTopics,
  papers,
  onDeleteNote,
  onCreateTopic,
  onAssignNoteTopic,
  onEditNote,
  onUpdateNote,
  onNoteClick,
}) {
  const [tab, setTab] = useState('paper');
  const [topicName, setTopicName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [assigningNote, setAssigningNote] = useState(null);

  // New Filter & Sort States
  const [filterType, setFilterType] = useState('all');
  const [sortType, setSortType] = useState('newest');

  const paperById = useMemo(() => new Map(papers.map((paper) => [paper.id, paper])), [papers]);

  // Derived Stats
  const totalNotes = notes.length;
  const currentPaperNotes = currentPaper ? notes.filter(n => n.paper_id === currentPaper.id).length : 0;

  const _topicsByNoteId = useMemo(() => {
    const topicLookup = new Map(topics.map((topic) => [topic.id, topic.name]));
    const map = new Map();

    for (const item of noteTopics) {
      if (!map.has(item.note_id)) map.set(item.note_id, []);
      const tName = topicLookup.get(item.topic_id);
      if (tName) {
        map.get(item.note_id).push(tName);
      }
    }

    return map;
  }, [noteTopics, topics]);

  const notesByTopic = useMemo(() => {
    const map = new Map(topics.map((topic) => [topic.id, []]));
    const topicIdsByNote = new Map();

    for (const item of noteTopics) {
      if (!topicIdsByNote.has(item.note_id)) topicIdsByNote.set(item.note_id, []);
      topicIdsByNote.get(item.note_id).push(item.topic_id);
    }

    for (const note of notes) {
      const topicIds = topicIdsByNote.get(note.id) || [];
      for (const topicId of topicIds) {
        if (map.has(topicId)) {
          map.get(topicId).push(note);
        }
      }
    }

    return map;
  }, [noteTopics, topics, notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;

    // 1. Basic Tab Filtering
    if (tab === 'paper') {
      result = currentPaper ? result.filter((note) => note.paper_id === currentPaper.id) : [];
    } else if (tab === 'questions') {
      result = result.filter((note) => note.type === 'question');
    }

    // 2. Advanced Filtering
    const now = new Date();
    if (filterType === 'today') {
      result = result.filter(n => new Date(n.created_at || Date.now()).toDateString() === now.toDateString());
    } else if (filterType === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(n => new Date(n.created_at || Date.now()) > oneWeekAgo);
    } else if (filterType === 'questions') {
      result = result.filter(n => n.type === 'question');
    } else if (filterType === 'long') {
      result = result.filter(n => (n.note_text || '').split(' ').length > 50);
    }

    // 3. Sorting
    result = [...result].sort((a, b) => {
      if (sortType === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else if (sortType === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      } else if (sortType === 'page') {
        return (a.page || 0) - (b.page || 0);
      } else if (sortType === 'length') {
        return (b.note_text || '').length - (a.note_text || '').length;
      }
      return 0;
    });

    return result;
  }, [tab, notes, currentPaper, filterType, sortType]);

  const exportPaperNotes = () => {
    if (!currentPaper) return;
    const exported = exportPaperToMarkdown({
      paper: currentPaper,
      notes: notes.filter((note) => note.paper_id === currentPaper.id),
    });
    downloadExport(exported);
  };

  const exportBibtex = () => {
    if (!currentPaper) return;
    const exported = exportPaperToBibtex({ paper: currentPaper });
    downloadExport(exported);
  };

  const copyNoteToClipboard = (note) => {
    const paper = paperById.get(note.paper_id);
    const text = `Quote: "${note.highlighted_text || ''}"\nNote: ${note.note_text}\nSource: ${paper?.title || 'Unknown Paper'}, Page ${note.page}`;
    navigator.clipboard.writeText(text);
    // Need a toast here ideally, but simple for now
    console.log('Note copied');
  };

  return (
    <div className="panel notes-panel">
      <PanelHeader
        title={`Notes (${tab === 'paper' ? currentPaperNotes : totalNotes})`}
        subtitle={tab === 'paper' ? 'This Paper' : 'All Notes'}
        collapsed={collapsed}
        onToggle={onToggle}
        actions={
          <div className="panel-inline-actions" style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', minWidth: 'auto' }} onClick={exportPaperNotes} disabled={!currentPaper} title="Export Markdown">
              MD
            </button>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', minWidth: 'auto' }} onClick={exportBibtex} disabled={!currentPaper} title="Export BibTeX">
              BIB
            </button>
          </div>
        }
      />

      {!collapsed ? (
        <div className="notes-content" style={{ padding: '16px' }}>
          <Tabs
            tabs={[
              { id: 'paper', label: 'Paper' },
              { id: 'topics', label: 'Topics' },
              { id: 'questions', label: 'Questions' }
            ]}
            activeTab={tab}
            onTabChange={(id) => {
              console.log('Tab change requested:', id);
              setTab(id);
            }}
          />

          {tab !== 'topics' && (
            <div className="notes-filters" style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ fontSize: '0.85em', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                <option value="all">All Notes</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="questions">Questions Only</option>
                <option value="long">Long Notes</option>
              </select>

              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                style={{ fontSize: '0.85em', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="page">By Page</option>
                <option value="length">By Length</option>
              </select>
            </div>
          )}

          {tab === 'topics' ? (
            <>
              <div className="create-topic-row">
                <input
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  placeholder="Create topic"
                />
                <button
                  className="button-primary"
                  onClick={() => {
                    if (!topicName.trim()) return;
                    onCreateTopic(topicName.trim());
                    setTopicName('');
                  }}
                >
                  Add Topic
                </button>
              </div>
              <TopicCards
                topics={topics}
                notesByTopic={notesByTopic}
                onOpenSynthesis={setSelectedTopic}
              />
            </>
          ) : filteredNotes.length === 0 ? (
            <EmptyState
              title={tab === 'paper' ? 'No notes found' : 'No research questions yet'}
              description={tab === 'paper' ? 'Create a note or adjust filters.' : 'Use the "Question" note type to track future areas of research.'}
              icon={tab === 'paper' ? '📝' : '❓'}
            />
          ) : (
            <VirtualNotes
              notes={filteredNotes}
              renderItem={(note, index) => {
                const paper = paperById.get(note.paper_id);
                const actions = [
                  { label: 'Edit', onClick: () => onEditNote(note) },
                  { label: 'Copy Full', onClick: () => copyNoteToClipboard(note) },
                  { label: 'Add to topic', onClick: () => setAssigningNote(note) },
                  {
                    label: 'Export Markdown', onClick: () => {
                      const exported = exportPaperToMarkdown({ paper, notes: [note] });
                      downloadExport(exported);
                    }
                  },
                  {
                    label: 'Export Anki', onClick: () => {
                      const exported = exportNotesToAnki({ paper, notes: [note] });
                      downloadExport(exported);
                    }
                  },
                  { label: 'Delete', onClick: () => onDeleteNote(note.id), type: 'danger' },
                ];

                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    type={note.type}
                    paperTitle={note.paper_citation || paper?.title}
                    onUpdate={onUpdateNote}
                    onClick={() => onNoteClick?.(note)}
                    actions={<KebabMenu actions={actions} />}
                  />
                );
              }}
            />
          )}
        </div>
      ) : null}

      <TopicSynthesisModal
        open={Boolean(selectedTopic)}
        topic={selectedTopic}
        notes={selectedTopic ? notesByTopic.get(selectedTopic.id) || [] : []}
        papers={paperById}
        onClose={() => setSelectedTopic(null)}
      />

      <TopicSelectorModal
        open={Boolean(assigningNote)}
        topics={topics}
        onSelect={(topicId) => {
          if (assigningNote) {
            onAssignNoteTopic(assigningNote.id, topicId);
          }
        }}
        onClose={() => setAssigningNote(null)}
      />
    </div>
  );
}
