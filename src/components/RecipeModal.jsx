import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import './RecipeModal.css';

const EMPTY_FORM = {
  name: '',
  isActive: true,
  rules: '',
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
      const rulesRaw = recipe.rules;
      const rulesText =
        typeof rulesRaw === 'string'
          ? (() => {
              try {
                const arr = JSON.parse(rulesRaw);
                return Array.isArray(arr) ? arr.join('\n') : String(rulesRaw);
              } catch {
                return String(rulesRaw);
              }
            })()
          : '';
      setForm({
        name: recipe.name || '',
        isActive: recipe.isActive ?? true,
        rules: rulesText,
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

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const rulesJson = form.rules
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: form.name,
      isActive: form.isActive,
      rules: JSON.stringify(rulesJson),
    };

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(payload);
    } catch (err) {
      setSaveError(err.message || 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
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

          {/* Instructions for AI */}
          <div className="form-group">
            <label htmlFor="recipe-rules">Instructions for the AI</label>
            <textarea
              id="recipe-rules"
              value={form.rules}
              onChange={(e) => handleChange('rules', e.target.value)}
              rows={4}
              className="rules-textarea"
              placeholder={'e.g., If it\'s an invoice, move to /Finance\nIf it mentions Alpha, move to /Projects'}
            />
            <span className="form-hint">One instruction per line. The AI will use these to decide where to sort files.</span>
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
