import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { recipesApi } from '../api';
import { sortApi } from '../api/sort';
import { useToast } from '../contexts/ToastContext';
import useFocusTrap from '../hooks/useFocusTrap';
import './RecipeModal.css';

export default function SortModal({ connection, onClose, onSortComplete }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [folderPath, setFolderPath] = useState(connection.sourceFolder || '');
  const [sorting, setSorting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const trapRef = useFocusTrap();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function fetchRecipes() {
      try {
        const data = await recipesApi.getAll({ isActive: true });
        if (!cancelled) {
          setRecipes(data);
          if (data.length > 0) setSelectedRecipeId(data[0].id);
        }
      } catch {
        if (!cancelled) setError('Failed to load recipes');
      } finally {
        if (!cancelled) setRecipesLoading(false);
      }
    }
    fetchRecipes();
    return () => { cancelled = true; };
  }, []);

  const handleSort = async (e) => {
    e.preventDefault();
    if (!selectedRecipeId || !folderPath.trim()) return;

    setSorting(true);
    setError(null);
    setResult(null);
    try {
      const data = await sortApi.triggerSort(connection.id, selectedRecipeId, folderPath.trim());
      setResult(data);
      toast.success(`Sorted ${data.filesSorted}/${data.filesFound} files`);
      if (onSortComplete) onSortComplete();
    } catch (err) {
      const msg = err.data?.error || err.message || 'Failed to sort files';
      setError(msg);
      toast.error(msg);
    } finally {
      setSorting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="sort-modal-title">
      <div className="modal-container" ref={trapRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="sort-modal-title">Sort Files</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSort}>
          {/* Connection (read-only) */}
          <div className="form-group">
            <label>Connection</label>
            <input type="text" value={connection.siteUrl} disabled />
          </div>

          {/* Recipe dropdown */}
          <div className="form-group">
            <label htmlFor="sort-recipe">Recipe *</label>
            {recipesLoading ? (
              <input type="text" value="Loading recipes..." disabled />
            ) : recipes.length === 0 ? (
              <input type="text" value="No active recipes found" disabled />
            ) : (
              <select
                id="sort-recipe"
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                disabled={sorting}
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}{r.description ? ` — ${r.description}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Folder path */}
          <div className="form-group">
            <label htmlFor="sort-folder">Folder Path *</label>
            <input
              id="sort-folder"
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="/sites/SiteName/Shared Documents/FolderName/"
              disabled={sorting}
              aria-required="true"
            />
          </div>

          {/* Sorting state */}
          {sorting && (
            <div className="form-note" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader size={16} className="spin" />
              Sorting files... this may take a minute.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="modal-error" role="alert">
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ marginLeft: '0.5rem' }}>{error}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="sort-results">
              <div className="sort-summary" style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '0.5rem', color: '#166534', fontSize: '0.875rem', fontWeight: 500
              }}>
                <CheckCircle size={16} />
                Sorted {result.filesSorted}/{result.filesFound} files
              </div>

              {result.results && result.results.length > 0 && (
                <div className="sort-file-list" style={{
                  marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem'
                }}>
                  {result.results.map((file, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', background: '#F9FAFB',
                      borderRadius: '0.375rem', fontSize: '0.8125rem'
                    }}>
                      {file.status === 'success' ? (
                        <CheckCircle size={14} style={{ color: '#16A34A', flexShrink: 0, marginTop: 2 }} />
                      ) : (
                        <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{file.file}</div>
                        {file.result && <div style={{ color: '#6B7280', marginTop: 2 }}>{file.result}</div>}
                        {file.message && <div style={{ color: '#DC2626', marginTop: 2 }}>{file.message}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={sorting}>
              {result ? 'Close' : 'Cancel'}
            </button>
            {result ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { onClose(); navigate('/files'); }}
              >
                View Files
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sorting || !selectedRecipeId || !folderPath.trim() || recipesLoading || recipes.length === 0}
              >
                {sorting ? 'Sorting...' : 'Sort Now'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
