import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel, compact }) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={compact ? 32 : 40} />
        </div>
      )}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && actionLabel && (
        <button className="btn btn-primary" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
