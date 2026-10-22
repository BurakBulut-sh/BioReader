import { useState } from 'react';
import { motion } from 'framer-motion';

export function TopicSelectorModal({ open, topics, onSelect, onClose }) {
  const [query, setQuery] = useState('');

  const filtered = topics.filter((topic) =>
    topic.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal palette-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <header className="modal-header">
          <h2>Add to Topic</h2>
          <button className="btn-ghost" style={{ padding: 0, width: '32px', height: '32px', minWidth: 'auto' }} onClick={onClose}>✕</button>
        </header>

        <div className="palette-input-row">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics..."
          />
        </div>

        <div className="palette-results">
          {filtered.map((topic) => (
            <button
              key={topic.id}
              className="palette-result"
              onClick={() => {
                onSelect(topic.id);
                onClose();
              }}
            >
              <div className="result-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="topic-color" style={{ backgroundColor: topic.color }} />
                  <strong>{topic.name}</strong>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="empty-inline">No topics match your search.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
