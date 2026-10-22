import { useMemo, useState } from 'react';
import { HIGHLIGHT_COLORS } from '../../lib/constants.js';

const SECTION_ORDER = ['Appearance', 'Dictionary', 'Notes', 'PDF Viewer', 'Data Management'];

export function SettingsModal({
  open,
  settings,
  dbPaths,
  onClose,
  onChange,
  onCreateBackup,
  onRestoreBackup,
  backups,
}) {
  const [activeSection, setActiveSection] = useState('Appearance');

  const sectionIndex = useMemo(
    () => SECTION_ORDER.findIndex((section) => section === activeSection),
    [activeSection]
  );

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="modal settings-modal">
        <header className="modal-header">
          <h2>Preferences</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </header>

        <div className="settings-layout">
          <aside className="settings-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRight: '1px solid var(--gray-200)', minWidth: '180px' }}>
            {SECTION_ORDER.map((section) => (
              <button
                key={section}
                className={`btn-ghost ${section === activeSection ? 'active' : ''}`}
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  background: section === activeSection ? 'var(--primary-50)' : 'transparent',
                  color: section === activeSection ? 'var(--primary-700)' : 'var(--gray-600)',
                  fontWeight: section === activeSection ? 600 : 500
                }}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </button>
            ))}
          </aside>

          <div className="settings-content">
            {sectionIndex === 0 ? (
              <section>
                <h3>Appearance</h3>
                <label>
                  Theme
                  <select
                    value={settings.theme || 'bright'}
                    onChange={(event) => onChange('theme', event.target.value)}
                  >
                    <option value="bright">Bright (Default)</option>
                    <option value="sepia">Sepia (Warm)</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <label>
                  Font size
                  <select
                    value={settings.fontSize || 'medium'}
                    onChange={(event) => onChange('fontSize', event.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </label>
              </section>
            ) : null}

            {sectionIndex === 1 ? (
              <section>
                <h3>Dictionary</h3>
                <label>
                  Explanation depth
                  <select
                    value={settings.dictionaryDepth}
                    onChange={(event) => onChange('dictionaryDepth', event.target.value)}
                  >
                    <option value="basic">Basic</option>
                    <option value="detailed">Detailed</option>
                    <option value="expert">Expert</option>
                  </select>
                </label>
                <label>
                  Auto-detection sensitivity ({Math.round(settings.dictionarySensitivity * 100)}%)
                  <input
                    type="range"
                    min={0.4}
                    max={1}
                    step={0.05}
                    value={settings.dictionarySensitivity}
                    onChange={(event) => onChange('dictionarySensitivity', Number(event.target.value))}
                  />
                </label>
              </section>
            ) : null}

            {sectionIndex === 2 ? (
              <section>
                <h3>Notes</h3>
                <label>
                  Default note type
                  <select
                    value={settings.defaultNoteType}
                    onChange={(event) => onChange('defaultNoteType', event.target.value)}
                  >
                    <option value="quick">Quick</option>
                    <option value="deep">Deep</option>
                    <option value="question">Question</option>
                    <option value="critique">Critique</option>
                    <option value="insight">Insight</option>
                  </select>
                </label>
                <label>
                  Auto-save interval (seconds)
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={Math.floor(settings.noteAutosaveInterval / 1000)}
                    onChange={(event) =>
                      onChange('noteAutosaveInterval', Math.max(5000, Number(event.target.value) * 1000))
                    }
                  />
                </label>
                <div>
                  <h4>Highlight palette</h4>
                  <div className="highlight-palette-list">
                    {HIGHLIGHT_COLORS.map((item) => (
                      <span key={item.id} className="color-chip" style={{ backgroundColor: item.color }}>
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {sectionIndex === 3 ? (
              <section>
                <h3>PDF Viewer</h3>
                <label>
                  Default zoom
                  <select
                    value={settings.pdfDefaultZoom}
                    onChange={(event) => onChange('pdfDefaultZoom', event.target.value)}
                  >
                    <option value="fit-width">Fit width</option>
                    <option value="fit-page">Fit page</option>
                    <option value="100">100%</option>
                    <option value="125">125%</option>
                  </select>
                </label>
                <label>
                  Scroll mode
                  <select
                    value={settings.pdfScrollMode}
                    onChange={(event) => onChange('pdfScrollMode', event.target.value)}
                  >
                    <option value="continuous">Continuous</option>
                    <option value="paged">Page by page</option>
                  </select>
                </label>
                <label>
                  Annotation opacity ({settings.highlightOpacity})
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={settings.highlightOpacity}
                    onChange={(event) => onChange('highlightOpacity', Number(event.target.value))}
                  />
                </label>
              </section>
            ) : null}

            {sectionIndex === 4 ? (
              <section className="data-mgmt-section">
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Data Management</h3>
                <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-200)', marginBottom: '24px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Database path: {dbPaths.dbPath || 'Loading...'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Backup directory: {dbPaths.backupDir || 'Loading...'}</p>
                </div>
                <div className="settings-actions" style={{ marginBottom: '24px' }}>
                  <button className="button-primary" onClick={onCreateBackup} style={{ width: '100%' }}>Create Backup Now</button>
                </div>
                <div className="backup-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {backups.map((backup) => (
                    <div key={backup.path} className="backup-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--gray-200)', borderRadius: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', display: 'block' }}>{backup.name}</strong>
                        <small style={{ color: 'var(--gray-500)' }}>{new Date(backup.modifiedAt).toLocaleString()}</small>
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => onRestoreBackup?.(backup.path)}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
