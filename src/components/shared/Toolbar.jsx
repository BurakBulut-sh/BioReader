import { useState, useRef, useEffect } from 'react';
import { APP_NAME } from '../../lib/constants.js';

export function Toolbar({
  paperTitle,
  isVisible = true,
  onOpenPdf,
  onOpenSettings,
  onOpenShortcuts,
  onToggleTheme,
  onCitePaper,
  onToggleFigures,
  onOpenVocab,
  onToggleNotes,
  _notesCount = 0,
  currentTheme,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className={`app-toolbar ${isVisible ? '' : 'hidden'}`} role="banner">
      <div className="toolbar-left">
        <button className="brand" onClick={onOpenPdf} aria-label="Open PDF" title="Open a PDF file">
          <span className="brand-logo">🧬</span>
          <span className="brand-name">{APP_NAME}</span>
        </button>
      </div>

      <div className="toolbar-center" title={paperTitle || 'No paper loaded'}>
        {paperTitle ? (
          <span className="paper-title-chip">{paperTitle}</span>
        ) : (
          <span className="paper-title-empty">Open a PDF to begin</span>
        )}
      </div>

      <div className="toolbar-right" ref={menuRef}>
        <button
          className={`toolbar-icon-btn overflow-btn ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          title="Menu"
        >
          ⋯
        </button>

        {menuOpen && (
          <div className="overflow-menu">
            <button className="menu-item" onClick={() => { onOpenPdf(); setMenuOpen(false); }}>
              <span className="menu-icon">📄</span>
              Open PDF…
            </button>
            <div className="menu-divider" />

            {/* Reading Mode sub-section */}
            <div className="menu-label">Reading Mode</div>
            {['bright', 'sepia', 'dark'].map((theme) => (
              <button
                key={theme}
                className={`menu-item ${currentTheme === theme ? 'active' : ''}`}
                onClick={() => { onToggleTheme?.(theme); setMenuOpen(false); }}
              >
                <span className="menu-icon">{theme === 'bright' ? '☀️' : theme === 'sepia' ? '📜' : '🌙'}</span>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
                {currentTheme === theme && <span className="menu-check">✓</span>}
              </button>
            ))}

            <div className="menu-divider" />
            <button className="menu-item" onClick={() => { onCitePaper?.(); setMenuOpen(false); }}>
              <span className="menu-icon">📎</span>
              Cite Paper
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>⌘⇧C</span>
            </button>
            <button className="menu-item" onClick={() => { onToggleNotes?.(); setMenuOpen(false); }}>
              <span className="menu-icon">📝</span>
              Toggle Notes Panel
            </button>
            <button className="menu-item" onClick={() => { onToggleFigures?.(); setMenuOpen(false); }}>
              <span className="menu-icon">🖼️</span>
              Figures Gallery
            </button>
            <button className="menu-item" onClick={() => { onOpenVocab?.(); setMenuOpen(false); }}>
              <span className="menu-icon">📚</span>
              Vocabulary Bank
            </button>
            <div className="menu-divider" />
            <button className="menu-item" onClick={() => { onOpenSettings(); setMenuOpen(false); }}>
              <span className="menu-icon">⚙️</span>
              Preferences…
            </button>
            <button className="menu-item" onClick={() => { onOpenShortcuts(); setMenuOpen(false); }}>
              <span className="menu-icon">⌨️</span>
              Keyboard Shortcuts
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
