import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import './RecipeModal.css';

const STORAGE_KEY = 'sorterra_sp_pending';

const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID;
const MS_REDIRECT_URI = import.meta.env.VITE_MS_REDIRECT_URI;
const AUTHORITY = 'https://login.microsoftonline.com/common';

const EMPTY_FORM = {
  siteUrl: '',
  sourceFolder: '',
};

export default function ConnectionModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [configError, setConfigError] = useState(null);
  const trapRef = useFocusTrap();

  useEffect(() => {
    if (!MS_CLIENT_ID || !MS_REDIRECT_URI) {
      setConfigError('Microsoft OAuth is not configured. Set VITE_MS_CLIENT_ID and VITE_MS_REDIRECT_URI in your environment.');
    }
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.siteUrl.trim()) {
      errs.siteUrl = 'Site URL is required';
    } else {
      try {
        new URL(form.siteUrl);
      } catch {
        errs.siteUrl = 'Please enter a valid URL';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuthenticate = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const state = crypto.randomUUID();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      siteUrl: form.siteUrl.trim(),
      sourceFolder: form.sourceFolder.trim() || null,
      state,
    }));

    const authUrl =
      `${AUTHORITY}/adminconsent` +
      `?client_id=${encodeURIComponent(MS_CLIENT_ID)}` +
      `&state=${encodeURIComponent(state)}` +
      `&redirect_uri=${encodeURIComponent(MS_REDIRECT_URI)}`;

    window.location.href = authUrl;
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="connection-modal-title">
      <div className="modal-container" ref={trapRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="connection-modal-title">Connect SharePoint</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleAuthenticate}>
          {configError && (
            <div className="modal-error" role="alert">{configError}</div>
          )}

          <div className="form-group">
            <label htmlFor="conn-site-url">SharePoint Site URL *</label>
            <input
              id="conn-site-url"
              type="text"
              value={form.siteUrl}
              onChange={(e) => handleChange('siteUrl', e.target.value)}
              placeholder="https://yourorg.sharepoint.com/sites/documents"
              className={errors.siteUrl ? 'input-error' : ''}
              aria-required="true"
              aria-invalid={!!errors.siteUrl}
              aria-describedby={errors.siteUrl ? 'conn-url-error' : undefined}
            />
            {errors.siteUrl && <span id="conn-url-error" className="field-error" role="alert">{errors.siteUrl}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="conn-source">Source Folder</label>
            <input
              id="conn-source"
              type="text"
              value={form.sourceFolder}
              onChange={(e) => handleChange('sourceFolder', e.target.value)}
              placeholder="e.g., /Shared Documents/Inbox"
            />
            <span className="field-hint">Leave blank to monitor the entire site.</span>
          </div>

          <div className="form-note">
            Clicking the button below will redirect you to Microsoft to grant admin consent
            for Sorterra to access your SharePoint. You will be returned here automatically.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!configError}
              className="btn"
              style={{ backgroundColor: '#0078D4', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ExternalLink size={16} />
              Authenticate with Microsoft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
