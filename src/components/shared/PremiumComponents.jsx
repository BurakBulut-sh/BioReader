import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Tab Component using global.css classes
 */
export function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="premium-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`premium-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

/**
 * Premium Note Card - Refined list style
 */
export function NoteCard({ note, index, type = 'default', paperTitle, onClick, actions, onUpdate }) {
    // Use note.type if provided, fallback to type prop
    const noteType = note.type || type;
    const borderClass = `premium-note-card ${noteType !== 'default' ? noteType : ''}`;

    // Inline editing state
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(note.note_text);
    // Debounce timer ref
    const saveTimeoutRef = React.useRef(null);

    // Sync external changes if not currently editing
    React.useEffect(() => {
        if (!isEditing) {
            setEditValue(note.note_text);
        }
    }, [note.note_text, isEditing]);

    const handleInput = (e) => {
        const newValue = e.target.innerText;
        setEditValue(newValue);

        // Auto-save logic (debounce 1s)
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            if (newValue !== note.note_text) {
                onUpdate?.({ ...note, note_text: newValue });
            }
        }, 1000);
    };

    const handleBlur = () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (editValue !== note.note_text) {
            onUpdate?.({ ...note, note_text: editValue });
        }
        setIsEditing(false);
    };

    return (
        <motion.div
            className={borderClass}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
        >
            <header className="note-card-header">
                <div className="note-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {paperTitle && <span style={{ fontWeight: 600 }}>📄 {paperTitle}</span>}
                    {note.page && (
                        <span style={{
                            background: 'var(--primary-100)',
                            color: 'var(--primary-700)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                        }}>
                            page {note.page}
                        </span>
                    )}
                </div>
                <div className="note-card-actions">
                    {actions}
                </div>
            </header>

            <div
                className="note-card-content"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleBlur}
                onFocus={() => setIsEditing(true)}
                style={{ outline: 'none', cursor: 'text' }}
            >
                {note.note_text}
            </div>

            {note.highlighted_text && (
                <blockquote className="note-card-quote">
                    "{note.highlighted_text}"
                </blockquote>
            )}

            <footer className="note-card-footer" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="note-card-tags" style={{ display: 'flex', gap: '6px' }}>
                    {(note.tags || []).map(tag => (
                        <span key={tag} style={{ fontSize: '11px', background: '#F2F4F7', padding: '2px 8px', borderRadius: '4px', color: '#475467' }}>
                            #{tag}
                        </span>
                    ))}
                </div>
                <span style={{ fontSize: '11px', color: '#98A2B3' }}>
                    {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ''}
                    {isEditing ? ' • Editing...' : ''}
                </span>
            </footer>
        </motion.div>
    );
}

/**
 * Premium Empty State
 */
export function EmptyState({ title, description, icon, action }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon-wrap animate-float">
                <div className="empty-state-icon">
                    {icon || '🔍'}
                </div>
            </div>
            <h2 style={{ fontSize: '18px', marginBottom: '8px', color: '#101828' }}>{title}</h2>
            <p style={{ fontSize: '14px', color: '#667085', maxWidth: '300px', margin: '0 auto 20px' }}>{description}</p>
            {action && (
                <button
                    className="btn-primary"
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
