import { useEffect, useRef, useState } from 'react';

export function ReaderModePanel({
    pageText,
    pageNumber,
    _termIndex,
    _workflow,
    settings,
    onTermClick,
    isLoading
}) {
    const containerRef = useRef(null);
    const [processedHTML, setProcessedHTML] = useState('');

    useEffect(() => {
        if (!pageText) {
            setProcessedHTML('');
            return;
        }
        // Render the page content as-is without automatic term annotation
        setProcessedHTML(pageText);
    }, [pageText]);

    const handleClick = (e) => {
        const target = e.target.closest('[data-term]');
        if (target?.dataset?.term) {
            onTermClick?.(target.dataset.term);
        }
    };

    return (
        <div
            className="reader-mode-container"
            ref={containerRef}
            onClick={handleClick}
            style={{
                maxWidth: settings.readerModeWidth || '800px',
                margin: '0 auto',
                padding: '40px 20px',
                fontSize: settings.readerModeFontSize || '18px',
                lineHeight: '1.6',
                color: 'var(--text)',
                transition: 'all 0.3s ease'
            }}
        >
            {isLoading ? (
                <div className="skeleton-text">
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '90%' }}></div>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                </div>
            ) : (
                <div
                    className="reader-content"
                    dangerouslySetInnerHTML={{ __html: processedHTML }}
                />
            )}

            <div className="reader-footer">
                Page {pageNumber}
            </div>

            <style>{`
            .reader-content h3 {
                font-size: 1.4em;
                margin-top: 1.5em;
                margin-bottom: 0.8em;
                color: var(--accent);
                font-weight: 600;
            }
            .reader-content p {
                margin-bottom: 1.2em;
                text-align: justify;
            }
            .reader-footer {
                margin-top: 60px;
                text-align: center;
                color: var(--text-secondary);
                font-size: 0.8em;
                border-top: 1px solid var(--border);
                padding-top: 20px;
            }
            .text-term {
                border-bottom: 2px solid var(--accent);
                cursor: pointer;
                background: rgba(46, 134, 171, 0.1);
                transition: background 0.2s;
            }
            .text-term:hover {
                background: rgba(46, 134, 171, 0.25);
            }
        `}</style>
        </div>
    );
}
