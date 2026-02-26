import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import './RecipeModal.css';

const TEMPLATE_VARS = ['[Year]', '[Month]', '[Date]', '[Vendor]', '[Type]', '[Client]'];

const EMPTY_FORM = {
  name: '',
  description: '',
  fileTypePattern: '',
  destinationPathTemplate: '',
  isActive: true,
  priority: 0,
  rules: '{}',
};

export default function RecipeModal({ recipe, onSave, onClose }) {
  const isEdit = !!recipe;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const trapRef = useFocusTrap();

  useEffect(() => {
    if (recipe) {
      setForm({
        name: recipe.name || '',
        description: recipe.description || '',
        fileTypePattern: recipe.fileTypePattern || '',
        destinationPathTemplate: recipe.destinationPathTemplate || '',
        isActive: recipe.isActive ?? true,
        priority: recipe.priority ?? 0,
        rules: typeof recipe.rules === 'string' ? recipe.rules : JSON.stringify(recipe.rules || {}, null, 2),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [recipe]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const pathPreview = useMemo(() => {
    if (!form.destinationPathTemplate) return null;
    const now = new Date();
    const subs = {
      '[Year]': String(now.getFullYear()),
      '[Month]': String(now.getMonth() + 1).padStart(2, '0'),
      '[Date]': now.toISOString().slice(0, 10),
      '[Vendor]': 'Acme Corp',
      '[Type]': form.fileTypePattern || 'Document',
      '[Client]': 'CenCore',
    };
    let preview = form.destinationPathTemplate;
    for (const [key, val] of Object.entries(subs)) {
      preview = preview.replaceAll(key, val);
    }
    return preview;
  }, [form.destinationPathTemplate, form.fileTypePattern]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.rules.trim()) {
      try {
        JSON.parse(form.rules);
      } catch {
        errs.rules = 'Invalid JSON';
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
      await onSave({
        ...form,
        priority: Number(form.priority) || 0,
      });
    } catch (err) {
      setSaveError(err.message || 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable) => {
    handleChange('destinationPathTemplate', form.destinationPathTemplate + variable);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="recipe-modal-title">
      <div className="modal-container" ref={trapRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="recipe-modal-title">{isEdit ? 'Edit Recipe' : 'New Recipe'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {saveError && (
            <div className="modal-error" role="alert">{saveError}</div>
          )}
          {/* Name */}
          <div className="form-group">
            <label htmlFor="recipe-name">Name *</label>
            <input
              id="recipe-name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Sort Invoices by Month"
              className={errors.name ? 'input-error' : ''}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'recipe-name-error' : undefined}
            />
            {errors.name && <span id="recipe-name-error" className="field-error" role="alert">{errors.name}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="recipe-desc">Description</label>
            <textarea
              id="recipe-desc"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What does this recipe do?"
              rows={2}
            />
          </div>

          {/* File Type Pattern & Priority — side by side */}
          <div className="form-row">
            <div className="form-group form-group-flex">
              <label htmlFor="recipe-filetype">File Type Pattern</label>
              <input
                id="recipe-filetype"
                type="text"
                value={form.fileTypePattern}
                onChange={(e) => handleChange('fileTypePattern', e.target.value)}
                placeholder="e.g., Invoice, Contract"
              />
            </div>
            <div className="form-group form-group-small">
              <label htmlFor="recipe-priority">Priority</label>
              <input
                id="recipe-priority"
                type="number"
                min="0"
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              />
            </div>
          </div>

          {/* Destination Path Template */}
          <div className="form-group">
            <label htmlFor="recipe-dest">Destination Path Template</label>
            <input
              id="recipe-dest"
              type="text"
              value={form.destinationPathTemplate}
              onChange={(e) => handleChange('destinationPathTemplate', e.target.value)}
              placeholder="e.g., /Finance/Invoices/[Year]/[Month]/"
            />
            <div className="template-vars">
              {TEMPLATE_VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="template-var-btn"
                  onClick={() => insertVariable(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            {pathPreview && (
              <div className="path-preview">
                <span className="path-preview-label">Preview:</span>
                <code>{pathPreview}</code>
              </div>
            )}
          </div>

          {/* Active Toggle */}
          <div className="form-group form-group-inline">
            <label htmlFor="recipe-active">Active</label>
            <button
              id="recipe-active"
              type="button"
              className={`toggle-btn${form.isActive ? ' toggle-active' : ''}`}
              onClick={() => handleChange('isActive', !form.isActive)}
            >
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
            </button>
          </div>

          {/* Rules JSON */}
          <div className="form-group">
            <label htmlFor="recipe-rules">Rules (JSON)</label>
            <textarea
              id="recipe-rules"
              value={form.rules}
              onChange={(e) => handleChange('rules', e.target.value)}
              rows={4}
              className={`rules-textarea${errors.rules ? ' input-error' : ''}`}
              spellCheck="false"
            />
            {errors.rules && <span className="field-error">{errors.rules}</span>}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
