import { useState, useMemo } from 'react';
import { OverlayDrawer } from '../shared/OverlayDrawer.jsx';

export function VocabularyDrawer({ open, onClose, terms = [] }) {
  const [filter, setFilter] = useState('All');

  const filteredTerms = useMemo(() => {
    if (filter === 'All') return terms;
    return terms.filter(t => t.status === filter);
  }, [terms, filter]);

  return (
    <OverlayDrawer open={open} onClose={onClose} title="Glossary & Vocabulary Bank" side="right">
      <div className="drawer-filters">
        <span className="filter-label">FILTER:</span>
        <div className="filter-tab-group" role="tablist">
          {['All', 'New', 'Reviewing', 'Learned'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              role="tab"
              aria-selected={filter === f}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="drawer-content">
        {filteredTerms.length === 0 ? (
          <div className="drawer-empty">
            <div className="empty-state-icon">📚</div>
            <h4 className="empty-state-heading">No Glossary Entries</h4>
            <p className="empty-state-subtext">
              Terms you inspect and save from scientific manuscripts will appear here for review.
            </p>
          </div>
        ) : (
          <div className="vocab-list">
            {filteredTerms.map(term => (
              <article key={term.id || term.name} className="vocab-card monograph-card">
                <header className="vocab-header">
                  <h4 className="vocab-name">{term.name}</h4>
                  <span className={`status-badge ${term.status?.toLowerCase() || 'new'}`}>
                    {term.status || 'New'}
                  </span>
                </header>
                <p className="vocab-definition">{term.definition}</p>
                {term.workflow && (
                  <footer className="vocab-meta">
                    <span className="vocab-workflow-tag">{term.workflow.toUpperCase()}</span>
                  </footer>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </OverlayDrawer>
  );
}
