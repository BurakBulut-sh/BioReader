import { formatShortcut } from '../../lib/shortcuts.js';

const GROUPS = [
  {
    name: 'Notes & Review',
    items: [
      ['Quick note', 'quickNote'],
      ['Deep note', 'deepNote'],
      ['Question note', 'questionNote'],
      ['Critique note', 'critiqueNote'],
      ['Key insight', 'insightNote'],
      ['Undo action', 'undo'],
    ],
  },
  {
    name: 'Dictionary',
    items: [
      ['Lookup selection', 'dictionaryLookup'],
      ['Search in PDF', 'searchPdf'],
    ],
  },
  {
    name: 'Navigation',
    items: [
      ['Toggle Contents', 'panelLeft'],
      ['Toggle Notes', 'panelRight'],
      ['Dictionary Hub', 'globalDictionary'],
    ],
  },
  {
    name: 'Viewer',
    items: [
      ['Toggle highlights', 'toggleHighlights'],
      ['Show shortcuts', 'shortcutsOverlay'],
      ['Fullscreen', 'F11'],
      ['Close modal', 'Escape'],
    ],
  },
];

function KeyCaps({ shortcut }) {
  return (
    <span className="keycaps">
      {shortcut
        .split('+')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (
          <kbd key={part}>{part}</kbd>
        ))}
    </span>
  );
}

export function ShortcutsOverlay({ open, shortcuts, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="modal shortcuts-modal">
        <header className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close shortcuts">
            ✕
          </button>
        </header>

        <div className="shortcuts-grid">
          {GROUPS.map((group) => (
            <section key={group.name}>
              <h3>{group.name}</h3>
              <ul>
                {group.items.map(([label, key]) => {
                  const shortcut = key === 'F11' || key === 'Escape' ? key : formatShortcut(shortcuts[key]);
                  return (
                    <li key={label}>
                      <span>{label}</span>
                      <KeyCaps shortcut={shortcut} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
