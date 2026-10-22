import { useState, useCallback } from 'react';
import { formatCitation, CITATION_FORMATS } from '../../lib/citationGenerator.js';

export function CitationPopup({ open, paper, onClose, onToast }) {
  const [selectedFormat, setSelectedFormat] = useState('apa');
  const [copied, setCopied] = useState(false);

  const citation = paper ? formatCitation(paper, selectedFormat) : '';

  const handleCopy = useCallback(() => {
    if (!citation) return;
    navigator.clipboard
      .writeText(citation)
      .then(() => {
        setCopied(true);
        onToast?.('Citation copied', `${selectedFormat.toUpperCase()} format copied to clipboard.`, 'success');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        onToast?.('Copy failed', 'Could not access clipboard.', 'error');
      });
  }, [citation, selectedFormat, onToast]);

  if (!open || !paper) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Cite Manuscript">
      <div className="citation-modal monograph-card" onClick={(e) => e.stopPropagation()}>
        <header className="citation-header">
          <div>
            <span className="modal-category-tag">[ CITATION EXPORT ]</span>
            <h3 className="citation-title">Cite this manuscript</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </header>

        <div className="citation-formats-bar" role="tablist">
          {CITATION_FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              className={`citation-format-chip ${selectedFormat === fmt.key ? 'active' : ''}`}
              onClick={() => setSelectedFormat(fmt.key)}
              role="tab"
              aria-selected={selectedFormat === fmt.key}
            >
              <span>{fmt.label}</span>
              {selectedFormat === fmt.key && <span className="format-check">✓</span>}
            </button>
          ))}
        </div>

        <div className="citation-preview-card">
          <pre className="citation-pre">{citation}</pre>
        </div>

        <footer className="citation-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleCopy}>
            <span>{copied ? '✓ Copied to Clipboard' : `Copy ${selectedFormat.toUpperCase()} Citation`}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
