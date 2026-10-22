import { useState, useMemo } from 'react';
import { OverlayDrawer } from '../shared/OverlayDrawer.jsx';

export function VocabularyDrawer({ open, onClose, terms = [] }) {
    const [filter, setFilter] = useState('All');

    const filteredTerms = useMemo(() => {
        if (filter === 'All') return terms;
        return terms.filter(t => t.status === filter);
    }, [terms, filter]);

    return (
        <OverlayDrawer open={open} onClose={onClose} title="Vocabulary Bank" side="right">
            <div className="drawer-filters">
                {['All', 'New', 'Reviewing', 'Learned'].map(f => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="drawer-content">
                {filteredTerms.length === 0 ? (
                    <div className="drawer-empty">
                        <div className="empty-state-icon">📚</div>
                        <p className="empty-state-heading">No vocabulary terms yet</p>
                        <p className="empty-state-subtext">Terms you look up will appear here.</p>
                    </div>
                ) : (
                    <div className="vocab-list">
                        {filteredTerms.map(term => (
                            <div key={term.id} className="premium-vocab-card">
                                <div className="vocab-header">
                                    <h4 className="vocab-name">{term.name}</h4>
                                    <span className={`status-badge ${term.status?.toLowerCase() || 'new'}`}>
                                        {term.status || 'New'}
                                    </span>
                                </div>
                                <p className="vocab-definition">{term.definition}</p>
                                <div className="vocab-meta">
                                    {term.workflow && <span className="vocab-workflow">{term.workflow}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </OverlayDrawer>
    );
}
