import { useState, useMemo } from 'react';
import { OverlayDrawer } from '../shared/OverlayDrawer.jsx';

const FILTER_TABS = [
    { key: 'all', label: 'All' },
    { key: 'question', label: 'Questions' },
    { key: 'insight', label: 'Important' },
    { key: 'critique', label: 'Critique' },
];

export function NotesDrawer({ open, onClose, notes = [], onDeleteNote, onExport, onNoteClick }) {
    const [activeFilter, setActiveFilter] = useState('all');

    const filteredNotes = useMemo(() => {
        if (activeFilter === 'all') return notes;
        return notes.filter((n) => n.type === activeFilter);
    }, [notes, activeFilter]);

    return (
        <OverlayDrawer
            open={open}
            onClose={onClose}
            title="Notes"
            side="right"
            width={380}
            headerActions={
                notes.length > 0 && (
                    <button
                        className="btn-ghost"
                        title="Export to Markdown"
                        onClick={onExport}
                        style={{ fontSize: '13px', color: 'var(--accent)' }}
                    >
                        Export
                    </button>
                )
            }
        >
            {/* Filter tabs */}
            <div className="drawer-filter-tabs">
                {FILTER_TABS.map((tab) => {
                    const count = tab.key === 'all'
                        ? notes.length
                        : notes.filter((n) => n.type === tab.key).length;
                    return (
                        <button
                            key={tab.key}
                            className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(tab.key)}
                        >
                            {tab.label}
                            <span className="filter-tab-count">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Notes list */}
            <div className="drawer-notes-list">
                {filteredNotes.length === 0 ? (
                    <div className="drawer-empty">
                        <div className="empty-state-icon" style={{ fontSize: '32px' }}>✏️</div>
                        <p className="empty-state-heading" style={{ fontSize: '13px', fontWeight: 500 }}>No notes yet</p>
                        <p className="empty-state-sub" style={{ fontSize: '12px' }}>Select text and press N</p>
                    </div>
                ) : (
                    filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            className={`premium-note-card ${note.type || ''}`}
                            onClick={() => onNoteClick?.(note)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onNoteClick?.(note);
                                }
                            }}
                        >
                            <div className="note-card-header">
                                <span className="note-card-meta">
                                    {note.page ? `Page ${note.page}` : ''}
                                    {note.page && note.created_at ? ' · ' : ''}
                                    {note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                </span>
                                <button
                                    className="note-delete-btn"
                                    onClick={(e) => { e.stopPropagation(); onDeleteNote?.(note.id); }}
                                    aria-label="Delete note"
                                >
                                    ×
                                </button>
                            </div>

                            {note.highlighted_text ? (
                                <blockquote className="note-card-quote">
                                    "{note.highlighted_text.slice(0, 120)}{note.highlighted_text.length > 120 ? '...' : ''}"
                                </blockquote>
                            ) : null}

                            <p className="note-card-text">{note.note_text}</p>
                        </div>
                    ))
                )}
            </div>
        </OverlayDrawer>
    );
}
