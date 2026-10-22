import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function QuickNoteBubble({ open, position, noteType, selectedText, onSave, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue('');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  return (
    <motion.div
      className="quick-note-bubble"
      style={{ left: position?.x || 120, top: position?.y || 120 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--gray-100)' }}>
        <strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>{noteType}</strong>
        <button type="button" className="btn-ghost" style={{ padding: 0, width: '24px', height: '24px', minWidth: 'auto' }} onClick={(e) => { e.stopPropagation(); onCancel(); }} aria-label="Close quick note">
          ✕
        </button>
      </header>

      <blockquote style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--gray-600)', padding: '12px', background: 'var(--gray-25)', borderLeft: '3px solid var(--primary-400)', margin: 0 }}>
        {selectedText ? `“${selectedText.slice(0, 100)}${selectedText.length > 100 ? '...' : ''}”` : ''}
      </blockquote>

      <textarea
        ref={inputRef}
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Write a note... markdown supported"
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderTop: '1px solid var(--gray-100)',
          borderBottom: '1px solid var(--gray-100)',
          fontSize: '14px',
          resize: 'none',
          outline: 'none'
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSave(value);
          }
        }}
      />

      <footer style={{ display: 'flex', gap: '8px', padding: '8px 12px', background: 'var(--gray-25)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        <button type="button" className="button-secondary" style={{ flex: 1, padding: '6px', fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); onCancel(); }}>
          Cancel
        </button>
        <button type="button" className="button-primary" style={{ flex: 1, padding: '6px', fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); onSave(value); }}>Save</button>
      </footer>
    </motion.div>
  );
}
