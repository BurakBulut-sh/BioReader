import { THEMES } from '../../lib/constants.js';

export function ThemeMenu({ open, value, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div className="popover-backdrop" onClick={onClose}>
      <div className="theme-menu" onClick={(event) => event.stopPropagation()}>
        <h3>Theme</h3>
        <div className="theme-options">
          {Object.values(THEMES).map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${value === theme.id ? 'active' : ''}`}
              onClick={() => onSelect(theme.id)}
            >
              <span className="swatch" style={{ backgroundColor: theme.background }} />
              <span>{theme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
