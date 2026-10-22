import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const NOTE_TYPES = [
  { id: 'quick', label: 'Quick', icon: '⚡' },
  { id: 'deep', label: 'Deep', icon: '🔬' },
  { id: 'question', label: 'Question', icon: '❓' },
  { id: 'critique', label: 'Critique', icon: '⚖️' },
  { id: 'insight', label: 'Insight', icon: '💡' },
];

export function QuickNoteBubble({
  open,
  position,
  noteType = 'quick',
  selectedText,
  detectedTerms = [],
  onTermClick,
  onSave,
  onCancel,
}) {
  const [value, setValue] = useState('');
  const [activeType, setActiveType] = useState(noteType);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setActiveType(noteType || 'quick');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open, noteType]);

  return (
    <motion.div
      className="quick-note-bubble monograph-card"
      style={{
        left: position?.x || 120,
        top: position?.y || 120,
      }}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="quick-note-header">
        <div className="type-selector-pills" role="radiogroup" aria-label="Note Type">
          {NOTE_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`type-pill ${activeType === t.id ? 'active' : ''} ${t.id}`}
              onClick={() => setActiveType(t.id)}
              title={`${t.label} Note`}
            >
              <span className="pill-icon">{t.icon}</span>
              <span className="pill-label">{t.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-close-bubble"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          aria-label="Close note popup"
          title="Cancel"
        >
          ✕
        </button>
      </header>

      {/* Selected Text Excerpt */}
      {selectedText && (
        <blockquote className="quick-note-quote">
          "{selectedText.slice(0, 140)}{selectedText.length > 140 ? '...' : ''}"
        </blockquote>
      )}

      {/* Detected Term Quick Lookup Chips */}
      {detectedTerms.length > 0 && (
        <div className="detected-terms-bar">
          <span className="terms-label">TERMS:</span>
          <div className="terms-scroll">
            {detectedTerms.slice(0, 5).map((term) => (
              <button
                key={term.canonical || term.name}
                type="button"
                className="term-quick-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  onTermClick?.(term.canonical || term.name);
                }}
                title={`Look up "${term.canonical || term.name}" in glossary`}
              >
                📖 {term.canonical || term.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note Textarea */}
      <textarea
        ref={inputRef}
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`Annotate this excerpt (${activeType}). Press Enter to save, Shift+Enter for newline...`}
        className="quick-note-textarea"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSave(value, activeType);
          }
        }}
      />

      <footer className="quick-note-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onSave(value, activeType);
          }}
        >
          Save Note <kbd className="kbd-shortcut-btn">↵</kbd>
        </button>
      </footer>
    </motion.div>
  );
}
