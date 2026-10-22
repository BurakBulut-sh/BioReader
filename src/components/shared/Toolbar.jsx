import { useState, useRef, useEffect } from 'react';
import { APP_NAME } from '../../lib/constants.js';

export function Toolbar({
  paperTitle,
  currentPage = 1,
  numPages = 0,
  isVisible = true,
  onOpenPdf,
  onOpenSettings,
  onOpenShortcuts,
  onToggleTheme,
  onCitePaper,
  onToggleFigures,
  onToggleTOC,
  onOpenVocab,
  onToggleNotes,
  notesCount = 0,
  currentTheme = 'bright',
  showNotesPanel = true,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  const themes = [
    { id: 'bright', label: 'Paper', icon: '☀️' },
    { id: 'sepia', label: 'Sepia', icon: '📜' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
  ];

  return (
    <header className={`app-toolbar ${isVisible ? '' : 'hidden'}`} role="banner">
      {/* Left: Brand Identity & Open Document CTA */}
      <div className="toolbar-left">
        <button className="brand" onClick={onOpenPdf} aria-label="Open PDF" title="Open PDF (⌘O)">
          <span className="brand-logo" aria-hidden="true">🧬</span>
          <span className="brand-name">{APP_NAME}</span>
          <span className="brand-tag">WORKSTATION</span>
        </button>

        <span className="toolbar-divider" aria-hidden="true" />

        <button
          className="toolbar-btn primary-action"
          onClick={onOpenPdf}
          title="Open PDF Document (⌘O)"
        >
          <span className="btn-icon">📄</span>
          <span>Open PDF</span>
          <kbd className="kbd-shortcut">⌘O</kbd>
        </button>
      </div>

      {/* Center: Monograph Active Document & Coordinate Progress */}
      <div className="toolbar-center">
        {paperTitle ? (
          <div className="paper-meta-cluster" title={paperTitle}>
            <span className="paper-title-chip">{paperTitle}</span>
            {numPages > 0 && (
              <span className="paper-page-badge">
                P. [{String(currentPage).padStart(2, '0')} / {String(numPages).padStart(2, '0')}]
              </span>
            )}
          </div>
        ) : (
          <span className="paper-title-empty">
            [ NO DOCUMENT LOADED · DROP PDF OR PRESS ⌘O ]
          </span>
        )}
      </div>

      {/* Right: Reading Theme & Scholarly Toolset */}
      <div className="toolbar-right" ref={menuRef}>
        {/* Reading Mode Segmented Control */}
        <div className="theme-segmented-control" role="group" aria-label="Reading Mode">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-segment-btn ${currentTheme === t.id ? 'active' : ''}`}
              onClick={() => onToggleTheme?.(t.id)}
              title={`${t.label} Mode`}
              aria-pressed={currentTheme === t.id}
            >
              <span className="segment-icon">{t.icon}</span>
              <span className="segment-label">{t.label}</span>
            </button>
          ))}
        </div>

        <span className="toolbar-divider" aria-hidden="true" />

        {/* Outline & TOC Drawer */}
        {onToggleTOC && (
          <button
            className="toolbar-btn secondary"
            onClick={onToggleTOC}
            title="Table of Contents (Outline)"
          >
            <span className="btn-icon">📑</span>
            <span className="btn-text">Outline</span>
          </button>
        )}

        {/* Figures Gallery */}
        <button
          className="toolbar-btn secondary"
          onClick={onToggleFigures}
          title="Extracted Figures and Plates Gallery"
        >
          <span className="btn-icon">🖼️</span>
          <span className="btn-text">Figures</span>
        </button>

        {/* Vocabulary Library */}
        <button
          className="toolbar-btn secondary"
          onClick={onOpenVocab}
          title="Biomedical Vocabulary Library"
        >
          <span className="btn-icon">📚</span>
          <span className="btn-text">Glossary</span>
        </button>

        {/* Cite Paper */}
        <button
          className="toolbar-btn secondary"
          onClick={onCitePaper}
          disabled={!paperTitle}
          title="Export Paper Citation (⌘⇧C)"
        >
          <span className="btn-icon">📎</span>
          <span className="btn-text">Cite</span>
        </button>

        <span className="toolbar-divider" aria-hidden="true" />

        {/* Notes Panel Toggle */}
        <button
          className={`toolbar-btn notes-toggle-btn ${showNotesPanel ? 'active' : ''}`}
          onClick={onToggleNotes}
          title="Toggle Research Notes Panel"
        >
          <span className="btn-icon">📝</span>
          <span className="btn-text">Notes</span>
          <span className="notes-pill">{notesCount}</span>
        </button>

        {/* Settings & Overflow */}
        <button
          className={`toolbar-icon-btn ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More Settings"
          title="Preferences & Shortcuts"
        >
          ⚙️
        </button>

        {menuOpen && (
          <div className="overflow-menu">
            <div className="menu-label">WORKSPACE CONTROLS</div>
            <button
              className="menu-item"
              onClick={() => {
                onOpenPdf();
                setMenuOpen(false);
              }}
            >
              <span className="menu-icon">📄</span>
              Open PDF…
              <kbd className="kbd-shortcut-menu">⌘O</kbd>
            </button>
            <button
              className="menu-item"
              onClick={() => {
                onCitePaper?.();
                setMenuOpen(false);
              }}
              disabled={!paperTitle}
            >
              <span className="menu-icon">📎</span>
              Cite Paper
              <kbd className="kbd-shortcut-menu">⌘⇧C</kbd>
            </button>
            <div className="menu-divider" />
            <button
              className="menu-item"
              onClick={() => {
                onOpenSettings();
                setMenuOpen(false);
              }}
            >
              <span className="menu-icon">⚙️</span>
              Preferences…
            </button>
            <button
              className="menu-item"
              onClick={() => {
                onOpenShortcuts?.();
                setMenuOpen(false);
              }}
            >
              <span className="menu-icon">⌨️</span>
              Keyboard Shortcuts
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
