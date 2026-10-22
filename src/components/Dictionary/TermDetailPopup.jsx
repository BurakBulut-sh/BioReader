import { motion } from 'framer-motion';

export function TermDetailPopup({ term, position, onAddNote, onSaveToVocab, onClose }) {
  if (!term) return null;

  return (
    <motion.div
      className="term-detail-popup monograph-card"
      style={{
        left: position?.x || '50%',
        top: position?.y || '50%',
        position: 'fixed',
      }}
      initial={{ opacity: 0, scale: 0.96, y: 10, x: '-50%' }}
      animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, scale: 0.96, y: 10, x: '-50%' }}
      transition={{ duration: 0.18 }}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="popup-header">
        <div className="term-info">
          <span className="term-indicator" aria-hidden="true">📖</span>
          <div>
            <span className="term-badge">GLOSSARY TERM</span>
            <h3 className="term-name">{term.name}</h3>
          </div>
        </div>
        <button
          type="button"
          className="close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close glossary popup"
        >
          ✕
        </button>
      </header>

      <div className="popup-body">
        <p className="term-definition">{term.definition}</p>
        {term.example && (
          <div className="term-example-box">
            <span className="example-label">CONTEXT:</span>
            <p className="term-example">"{term.example}"</p>
          </div>
        )}
      </div>

      <footer className="popup-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onSaveToVocab(term);
          }}
        >
          <span>🔖 Save to Glossary</span>
        </button>
        {onAddNote && (
          <button
            type="button"
            className="btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onAddNote(term.name);
            }}
          >
            <span>📝 Add Note</span>
          </button>
        )}
      </footer>
    </motion.div>
  );
}
