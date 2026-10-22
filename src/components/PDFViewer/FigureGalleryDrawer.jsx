import { useState, useEffect } from 'react';
import { OverlayDrawer } from '../shared/OverlayDrawer.jsx';

export function FigureGalleryDrawer({ open, onClose, pdfDocument }) {
    const [figures, setFigures] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !pdfDocument || figures.length > 0) return;

        let cancelled = false;

        async function extractFigures() {
            setLoading(true);
            try {
                const numPages = pdfDocument.numPages;
                const foundFigures = [];

                // Simple heuristic: look for lines starting with "Fig." or "Figure "
                for (let i = 1; i <= Math.min(numPages, 30); i++) {
                    if (cancelled) break;
                    const page = await pdfDocument.getPage(i);
                    const content = await page.getTextContent();

                    let currentCaption = '';
                    let isCollectingCaption = false;

                    for (const item of content.items) {
                        const text = item.str.trim();
                        if (!text) continue;

                        const isFigStart = /^(?:Fig\.|Figure)\s*\d+/i.test(text);

                        if (isFigStart) {
                            if (currentCaption) {
                                foundFigures.push({ id: foundFigures.length, page: i, caption: currentCaption.trim() });
                            }
                            isCollectingCaption = true;
                            currentCaption = text;
                        } else if (isCollectingCaption) {
                            // Assume captions aren't ridiculously long, say stop if gap is too large or another section starts
                            // Here we just arbitrarily collect up to ~250 chars as a heuristic
                            if (currentCaption.length < 250) {
                                currentCaption += ' ' + text;
                            } else {
                                foundFigures.push({ id: foundFigures.length, page: i, caption: currentCaption.trim() });
                                isCollectingCaption = false;
                                currentCaption = '';
                            }
                        }
                    }

                    if (isCollectingCaption && currentCaption) {
                        foundFigures.push({ id: foundFigures.length, page: i, caption: currentCaption.trim() });
                    }
                }

                if (!cancelled) {
                    setFigures(foundFigures);
                }
            } catch (err) {
                console.error('Failed to extract figures', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        extractFigures();

        return () => { cancelled = true; };
    }, [open, pdfDocument, figures.length]);

    return (
        <OverlayDrawer open={open} onClose={onClose} title="Figures (Beta)" side="right" width={380}>
            <div style={{ padding: '20px' }}>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                        Scanning document for figures...
                    </p>
                ) : figures.length === 0 ? (
                    <div className="drawer-empty">
                        <div className="empty-state-icon" style={{ fontSize: '32px' }}>📊</div>
                        <p className="empty-state-heading" style={{ fontSize: '13px', fontWeight: 500 }}>No figures detected</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {figures.map(fig => (
                            <div key={fig.id} style={{
                                background: 'var(--panel)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div style={{
                                    height: '180px',
                                    background: 'var(--gray-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '24px'
                                }}>
                                    🖼️ Placeholder
                                </div>
                                <div style={{ padding: '12px 16px', background: 'var(--panel)' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--accent)',
                                        marginBottom: '4px'
                                    }}>
                                        Page {fig.page}
                                    </p>
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        lineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {fig.caption}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </OverlayDrawer>
    );
}
