import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const trapRef = useFocusTrap();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="confirm-overlay" onClick={onCancel} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <div className="confirm-dialog" ref={trapRef} onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon confirm-icon-${variant}`} aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <h3 id="confirm-title" className="confirm-title">{title}</h3>
        {message && <p id="confirm-message" className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn confirm-btn confirm-btn-${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
