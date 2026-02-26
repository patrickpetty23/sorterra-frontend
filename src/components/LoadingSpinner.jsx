import './LoadingSpinner.css';

export default function LoadingSpinner({ size = 'md', fullPage = false, message }) {
  return (
    <div className={`loading-spinner-container${fullPage ? ' full-page' : ''}`} role="status" aria-label={message || 'Loading'}>
      <div className={`loading-spinner spinner-${size}`} aria-hidden="true" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
