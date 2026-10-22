export function PanelHeader({ title, subtitle, collapsed, onToggle, actions = null }) {
  return (
    <header className="panel-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="panel-header-actions">
        {actions}
        <button
          className={`icon-button ${collapsed ? 'collapsed' : ''}`}
          onClick={onToggle}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          title={collapsed ? `Expand ${title}` : `Collapse ${title}`}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </header>
  );
}
