import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, ClipboardList, AlertCircle } from 'lucide-react';
import { recipesApi } from '../api';
import { useOrg } from '../contexts/OrgContext';
import { useToast } from '../contexts/ToastContext';
import RecipeModal from '../components/RecipeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import './Recipes.css';

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'name', label: 'Name' },
  { value: 'createdat', label: 'Date Created' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Recipes' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function Recipes() {
  const toast = useToast();
  const { organization } = useOrg();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deletingRecipe, setDeletingRecipe] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    setLoading(true);
    setError(null);
    try {
      const data = await recipesApi.getAll();
      setRecipes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleActive = async (recipe) => {
    try {
      const updated = await recipesApi.update(recipe.id, { isActive: !recipe.isActive });
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? updated : r)));
      toast.success(`${recipe.name} ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update recipe');
    }
  };

  const openCreate = () => {
    setEditingRecipe(null);
    setModalOpen(true);
  };

  const openEdit = (recipe) => {
    setEditingRecipe(recipe);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecipe(null);
  };

  const handleSave = async (formData) => {
    if (editingRecipe) {
      const updated = await recipesApi.update(editingRecipe.id, formData);
      setRecipes((prev) => prev.map((r) => (r.id === editingRecipe.id ? updated : r)));
      toast.success(`"${updated.name}" updated`);
    } else {
      const created = await recipesApi.create({
        ...formData,
        organizationId: organization?.id || null,
      });
      setRecipes((prev) => [...prev, created]);
      toast.success(`"${created.name}" created`);
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!deletingRecipe) return;
    setDeleteLoading(true);
    try {
      await recipesApi.delete(deletingRecipe.id);
      setRecipes((prev) => prev.filter((r) => r.id !== deletingRecipe.id));
      toast.success(`"${deletingRecipe.name}" deleted`);
      setDeletingRecipe(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete recipe');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...recipes];

    // Filter by status
    if (filterStatus === 'active') result = result.filter((r) => r.isActive);
    else if (filterStatus === 'inactive') result = result.filter((r) => !r.isActive);

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.description || '').toLowerCase().includes(term) ||
          (r.fileTypePattern || '').toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdat':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'priority':
        default:
          return a.priority - b.priority;
      }
    });

    return result;
  }, [recipes, filterStatus, sortBy, searchTerm]);

  if (loading) {
    return (
      <div className="recipes-page">
        <div className="recipes-toolbar card">
          <div className="skeleton skeleton-toolbar" />
        </div>
        <div className="recipes-table-wrapper card">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="recipe-row-skeleton">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipes-page">
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Failed to load recipes"
            description={error}
            action={fetchRecipes}
            actionLabel="Retry"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="recipes-page">
      {/* Toolbar */}
      <div className="recipes-toolbar card">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="toolbar-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort order"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary toolbar-add-btn" onClick={openCreate}>
          <Plus size={18} />
          <span>New Recipe</span>
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          {recipes.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No recipes yet"
              description="Sorting recipes define how your files get organized. Create one to get started."
              action={openCreate}
              actionLabel="Create Recipe"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching recipes"
              description="Try adjusting your filters or search term."
            />
          )}
        </div>
      ) : (
        <div className="recipes-table-wrapper card">
          <table className="recipes-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="col-pattern">File Type</th>
                <th className="col-path">Destination</th>
                <th className="th-center">Priority</th>
                <th className="th-center">Files</th>
                <th className="th-center">Active</th>
                <th className="th-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((recipe) => (
                <tr key={recipe.id} className={!recipe.isActive ? 'row-inactive' : ''}>
                  <td>
                    <div className="recipe-name-cell">
                      <span className="recipe-name">{recipe.name}</span>
                      {recipe.description && (
                        <span className="recipe-desc">{recipe.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-pattern">
                    {recipe.fileTypePattern ? (
                      <span className="recipe-badge">{recipe.fileTypePattern}</span>
                    ) : (
                      <span className="recipe-muted">Any</span>
                    )}
                  </td>
                  <td className="col-path">
                    {recipe.destinationPathTemplate ? (
                      <code className="recipe-path">{recipe.destinationPathTemplate}</code>
                    ) : (
                      <span className="recipe-muted">—</span>
                    )}
                  </td>
                  <td className="td-center">
                    <span className="recipe-priority">{recipe.priority}</span>
                  </td>
                  <td className="td-center">
                    <span className="recipe-files-count">{recipe.filesProcessedCount}</span>
                  </td>
                  <td className="td-center">
                    <button
                      className={`toggle-btn${recipe.isActive ? ' toggle-active' : ''}`}
                      onClick={() => handleToggleActive(recipe)}
                      role="switch"
                      aria-checked={recipe.isActive}
                      aria-label={`${recipe.name} active`}
                    >
                      <div className="toggle-track">
                        <div className="toggle-thumb" />
                      </div>
                    </button>
                  </td>
                  <td className="td-center">
                    <div className="row-actions">
                      <button
                        className="row-action-btn"
                        onClick={() => openEdit(recipe)}
                        aria-label="Edit recipe"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="row-action-btn row-action-danger"
                        onClick={() => setDeletingRecipe(recipe)}
                        aria-label="Delete recipe"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="recipes-summary">
        {filtered.length} of {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        {filterStatus !== 'all' && ` (${filterStatus})`}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <RecipeModal
          recipe={editingRecipe}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete Confirmation */}
      {deletingRecipe && (
        <ConfirmDialog
          title="Delete Recipe"
          message={`Are you sure you want to delete "${deletingRecipe.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecipe(null)}
        />
      )}
    </div>
  );
}

export default Recipes;
