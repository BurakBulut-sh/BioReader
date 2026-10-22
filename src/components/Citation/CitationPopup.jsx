import { useState, useCallback } from 'react';
import { formatCitation, CITATION_FORMATS } from '../../lib/citationGenerator.js';

export function CitationPopup({ open, paper, onClose, onToast }) {
    const [selectedFormat, setSelectedFormat] = useState('apa');

    const citation = paper ? formatCitation(paper, selectedFormat) : '';

    const handleCopy = useCallback(() => {
        if (!citation) return;
        navigator.clipboard.writeText(citation).then(() => {
            onToast?.('Citation copied', `${selectedFormat.toUpperCase()} citation copied to clipboard.`, 'success');
            onClose?.();
        }).catch(() => {
            onToast?.('Copy failed', 'Could not copy to clipboard.', 'error');
        });
    }, [citation, selectedFormat, onClose, onToast]);

    if (!open || !paper) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="citation-popup" onClick={(e) => e.stopPropagation()}>
                <div className="citation-header">
                    <h3>Cite this paper</h3>
                    <button className="drawer-close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="citation-formats">
                    {CITATION_FORMATS.map((fmt) => (
                        <button
                            key={fmt.key}
                            className={`menu-item ${selectedFormat === fmt.key ? 'active' : ''}`}
                            onClick={() => setSelectedFormat(fmt.key)}
                        >
                            <span style={{ flex: 1, textAlign: 'left' }}>{fmt.label}</span>
                            {selectedFormat === fmt.key && <span className="menu-check">✓</span>}
                        </button>
                    ))}
                </div>

                <div className="citation-preview">
                    <pre>{citation}</pre>
                </div>

                <div className="citation-actions">
                    <button className="button-primary" onClick={handleCopy} style={{ width: '100%' }}>
                        Copy {CITATION_FORMATS.find((f) => f.key === selectedFormat)?.label} Citation
                    </button>
                </div>
            </div>
        </div>
    );
}
