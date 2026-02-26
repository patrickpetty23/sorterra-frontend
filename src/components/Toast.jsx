import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import './Toast.css';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ message, type = 'info', onDismiss }) {
  const Icon = icons[type];

  return (
    <div className={`toast toast-${type}`} role="status">
      <Icon size={18} className="toast-icon" aria-hidden="true" />
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
