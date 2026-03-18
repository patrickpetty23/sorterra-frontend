import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { sharePointAuthApi } from '../api';
import useFocusTrap from '../hooks/useFocusTrap';
import './RecipeModal.css';

const EMPTY_FORM = {
  siteUrl: '',
  sourceFolder: '',
};

export default function ConnectionModal({ onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const trapRef = useFocusTrap();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveError(null);
    try {
      const created = await onSave({
        siteUrl: form.siteUrl.trim(),
        sourceFolder: form.sourceFolder.trim() || null,
      });
      if (!created) return; // onSave returned early (e.g., org not loaded)
      // Initiate admin consent flow — redirect to Microsoft
      const { consentUrl } = await sharePointAuthApi.getConsentUrl(created.id);
      window.location.href = consentUrl;
    } catch (err) {
      setSaveError(err.message || 'Failed to add connection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="connection-modal-title">
      <div className="modal-container" ref={trapRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="connection-modal-title">Add SharePoint Connection</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {saveError && (
            <div className="modal-error" role="alert">{saveError}</div>
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
            You will be redirected to Microsoft to authorize Sorterra for your organization.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Connecting...' : 'Save & Connect to Microsoft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
