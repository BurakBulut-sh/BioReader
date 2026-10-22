import { useState, useEffect } from 'react';
import { OverlayDrawer } from '../shared/OverlayDrawer.jsx';

export function TOCDrawer({ open, onClose, pdfDocument, onScrollToPage }) {
    const [toc, setToc] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !pdfDocument || toc.length > 0) return;

        let cancelled = false;

        async function extractTOC() {
            setLoading(true);
            try {
                const numPages = Math.min(pdfDocument.numPages, 40); // extract headers from first 40 pages
                const foundHeadings = [];

                for (let i = 1; i <= numPages; i++) {
                    if (cancelled) break;
                    const page = await pdfDocument.getPage(i);
                    const content = await page.getTextContent();

                    let lastY = null;
                    let currentHeading = '';
                    let isCollecting = false;

                    for (const item of content.items) {
                        const fontS = item.transform?.[0]; // font size heuristic
                        const text = item.str.trim();
                        if (!text || text.length < 3) continue;

                        const isHeadingFont = fontS > 12; // heuristic

                        if (isHeadingFont) {
                            if (!isCollecting || (lastY !== null && Math.abs(item.transform[5] - lastY) > 5)) {
                                if (currentHeading) {
                                    foundHeadings.push({ id: foundHeadings.length, page: i, text: currentHeading });
                                    currentHeading = '';
                                }
                                isCollecting = true;
                            }
                            currentHeading += (currentHeading ? ' ' : '') + text;
                        } else {
                            if (isCollecting && currentHeading) {
                                foundHeadings.push({ id: foundHeadings.length, page: i, text: currentHeading });
                                currentHeading = '';
                                isCollecting = false;
                            }
                        }
                        lastY = item.transform[5];
                    }

                    if (isCollecting && currentHeading) {
                        foundHeadings.push({ id: foundHeadings.length, page: i, text: currentHeading });
                    }
                }

                if (!cancelled) setToc(foundHeadings);
            } catch (err) {
                console.error('Failed to build TOC', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        extractTOC();

        return () => { cancelled = true; };
    }, [open, pdfDocument, toc.length]);

    return (
        <OverlayDrawer open={open} onClose={onClose} title="Table of Contents (Beta)" side="left" width={320}>
            <div style={{ padding: '0 20px' }}>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                        Extracting document structure...
                    </p>
                ) : toc.length === 0 ? (
                    <div className="drawer-empty" style={{ padding: '40px 0' }}>
                        <div className="empty-state-icon" style={{ fontSize: '32px' }}>📑</div>
                        <p className="empty-state-heading" style={{ fontSize: '13px', fontWeight: 500 }}>No headings found</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingBottom: '32px' }}>
                        {toc.map(heading => (
                            <button key={heading.id} onClick={() => {
                                onScrollToPage(heading.page);
                                onClose();
                            }} style={{
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                lineHeight: 1.4,
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'baseline'
                            }} className="menu-item hover-bg">
                                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, minWidth: '32px' }}>
                                    p.{heading.page}
                                </span>
                                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {heading.text}
                                </span>
                            </button>
                        ))}

                        <div className="menu-divider" style={{ margin: '16px 0' }} />
                        <button
                            className="menu-item hover-bg"
                            onClick={() => { window.dispatchEvent(new CustomEvent('bio:open-figures')); onClose(); }}
                            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}
                        >
                            <span>🖼️</span>
                            <span>Browse All Figures</span>
                        </button>
                    </div>
                )}
            </div>
        </OverlayDrawer>
    );
}
