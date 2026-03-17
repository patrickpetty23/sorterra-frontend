import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, AlertCircle, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { recipesApi } from '../api';
import { useOrg } from '../contexts/useOrg';
import { useToast } from '../contexts/useToast';
import RecipeModal from '../components/RecipeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import './Recipes.css';

const PRIORITY_STEP = 10;

/** Parse recipe rules (JSON array of strings) into a single display string. */
function getRulesPreview(rules) {
  if (!rules) return '';
  try {
    const arr = typeof rules === 'string' ? JSON.parse(rules) : rules;
    return Array.isArray(arr) ? arr.filter(Boolean).join(' · ') : String(rules);
  } catch {
    return typeof rules === 'string' ? rules : '';
  }
}

/** Sortable table row for drag-and-drop reordering. */
function SortableRecipeRow({ recipe, canDrag, onEdit, onDelete, onToggleActive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: recipe.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${!recipe.isActive ? 'row-inactive' : ''} ${isDragging ? 'recipe-row-dragging' : ''}`}
    >
      <td className="td-drag">
        {canDrag ? (
          <button
            type="button"
            className="drag-handle"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} />
          </button>
        ) : (
          <span className="drag-handle-placeholder" aria-hidden="true" />
        )}
      </td>
      <td>
        <div className="recipe-name-cell">
          <span className="recipe-name">{recipe.name}</span>
        </div>
      </td>
      <td className="td-instructions">
        <div className="recipe-instructions-cell" title={getRulesPreview(recipe.rules)}>
          {getRulesPreview(recipe.rules) || '—'}
        </div>
      </td>
      <td className="td-center">
        <button
          className={`toggle-btn${recipe.isActive ? ' toggle-active' : ''}`}
          onClick={() => onToggleActive(recipe)}
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
            onClick={() => onEdit(recipe)}
            aria-label="Edit recipe"
          >
            <Pencil size={16} />
          </button>
          <button
            className="row-action-btn row-action-danger"
            onClick={() => onDelete(recipe)}
            aria-label="Delete recipe"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Recipes() {
  const toast = useToast();
  const { organization } = useOrg();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const maxPriority = recipes.length ? Math.max(...recipes.map((r) => r.priority), 0) : -PRIORITY_STEP;
      const created = await recipesApi.create({
        ...formData,
        organizationId: organization?.id || null,
        priority: maxPriority + PRIORITY_STEP,
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

  const canDrag = true;

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex((r) => r.id === active.id);
    const newIndex = filtered.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    const updates = reordered.map((recipe, index) => ({
      id: recipe.id,
      priority: index * PRIORITY_STEP,
    }));

    setRecipes((prev) => {
      const byId = new Map(prev.map((r) => [r.id, r]));
      return reordered.map((r, i) => ({ ...byId.get(r.id), priority: i * PRIORITY_STEP }));
    });

    try {
      await recipesApi.updatePriorities(updates);
      toast.success('Order saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save order');
      fetchRecipes();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = useMemo(() => {
    const result = [...recipes];
    result.sort((a, b) => a.priority - b.priority);
    return result;
  }, [recipes]);

  if (loading) {
    return (
      <div className="recipes-page">
        <div className="recipes-toolbar">
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
      {/* Toolbar — button only, no card */}
      <div className="recipes-toolbar">
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
              icon={ClipboardList}
              title="No matching recipes"
              description="Try adjusting your filters."
            />
          )}
        </div>
      ) : (
        <div className="recipes-table-wrapper card">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="recipes-table">
              <thead>
                <tr>
                  <th className="th-drag" aria-label="Reorder" />
                  <th>Name</th>
                  <th className="th-instructions">Instructions for AI</th>
                  <th className="th-center">Active</th>
                  <th className="th-center">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={filtered.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {filtered.map((recipe) => (
                    <SortableRecipeRow
                      key={recipe.id}
                      recipe={recipe}
                      canDrag={canDrag}
                      onEdit={openEdit}
                      onDelete={setDeletingRecipe}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}

      {/* Summary */}
      <div className="recipes-summary">
        {filtered.length} recipe{recipes.length !== 1 ? 's' : ''}
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
