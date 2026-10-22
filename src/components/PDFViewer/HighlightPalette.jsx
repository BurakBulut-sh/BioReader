import { motion } from 'framer-motion';
import { HIGHLIGHT_COLORS } from '../../lib/constants.js';

export function HighlightPalette({ _open, position, detectedTerms, onSelectColor, onAddNote, onCopyWithCitation, onTermClick, onClose }) {
  return (
    <motion.div
      className="highlight-palette"
      style={{
        left: position?.x || 120,
        top: (position?.y || 120) - 10,
        transform: 'translateX(-50%) translateY(-100%)',
        width: detectedTerms?.length > 0 ? '280px' : '300px'
      }}
      initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
      animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--gray-100)' }}>
        <strong style={{ fontSize: '13px', color: 'var(--gray-900)' }}>Annotate</strong>
        <button type="button" className="btn-ghost" style={{ padding: 0, width: '24px', height: '24px', minWidth: 'auto' }} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close highlight palette">
          ✕
        </button>
      </header>

      <div className="palette-actions" style={{ padding: '12px', display: 'flex', gap: '8px' }}>
        <button type="button" className="button-primary" style={{ flex: 1, fontSize: '13px', padding: '6px' }} onClick={(e) => { e.stopPropagation(); onAddNote(); }}>
          📝 Add Note
        </button>
        <button type="button" className="button-secondary" style={{ flex: 1, fontSize: '13px', padding: '6px' }} onClick={(e) => { e.stopPropagation(); onCopyWithCitation(); }} title="Copy with Citation">
          📋 Citation
        </button>
      </div>

      <div className="highlight-label-row" style={{ fontSize: '11px', color: 'var(--gray-500)', padding: '0 12px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Highlight</div>
      <div className="highlight-options" style={{ display: 'flex', gap: '8px', padding: '0 12px 12px' }}>
        {HIGHLIGHT_COLORS.map((item) => (
          <button
            key={item.id}
            style={{
              backgroundColor: item.color,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 0 1px var(--gray-200)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            title={item.label}
            aria-label={item.label}
            onClick={(e) => { e.stopPropagation(); onSelectColor(item.color); }}
          />
        ))}
      </div>

      {detectedTerms?.length > 0 && (
        <>
          <div style={{ fontSize: '11px', color: 'var(--gray-500)', padding: '6px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--gray-100)' }}>
            Dictionary ({detectedTerms.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 12px 12px', maxHeight: '100px', overflowY: 'auto' }}>
            {detectedTerms.slice(0, 10).map((term) => (
              <button
                key={term.canonical}
                className="btn-ghost"
                style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                  border: '1px solid var(--primary-100)',
                  cursor: 'pointer',
                  minWidth: 'auto'
                }}
                onClick={(e) => { e.stopPropagation(); onTermClick?.(term.canonical); }}
              >
                {term.canonical}
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
