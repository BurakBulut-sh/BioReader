import { motion } from 'framer-motion';

export function TermDetailPopup({ term, position, onAddNote, onSaveToVocab, onClose }) {
    return (
        <motion.div
            className="term-detail-popup"
            style={{
                left: position?.x || '50%',
                top: position?.y || '50%',
                transform: 'translateX(-50%) translateY(-100%)',
                position: 'fixed'
            }}
            initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
            onClick={(e) => e.stopPropagation()}
        >
            <header className="popup-header">
                <div className="term-info">
                    <span className="term-indicator">📖</span>
                    <h3 className="term-name">{term.name}</h3>
                </div>
                <button type="button" className="close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
            </header>

            <div className="popup-body">
                <p className="term-definition">{term.definition}</p>
                {term.example && <p className="term-example"><em>e.g., {term.example}</em></p>}
            </div>

            <footer className="popup-actions">
                <button type="button" className="popup-btn primary" onClick={(e) => { e.stopPropagation(); onSaveToVocab(term); }}>
                    🔖 Save to Vocabulary
                </button>
                <button type="button" className="popup-btn secondary" onClick={(e) => { e.stopPropagation(); onAddNote(term.name); }}>
                    📝 Note
                </button>
            </footer>
        </motion.div>
    );
}
