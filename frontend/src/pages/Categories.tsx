import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { categoryApi } from '@/api/endpoints';
import type { CategoryResponse } from '@/api/types';
import { Card } from '@/components/Card';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { HttpError } from '@/api/http';

export function Categories() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  });

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await categoryApi.list(token);
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddClick = () => {
    setFormData({ name: '', type: 'EXPENSE' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await categoryApi.create(formData, token);
      showToast('Category created', 'success');
      setShowModal(false);
      loadCategories();
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        showToast('Category already exists', 'error');
      } else {
        showToast('Failed to create category', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    if (!token) return;

    try {
      await categoryApi.delete(id, token);
      showToast('Category deleted', 'success');
      loadCategories();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const getCategoryColor = (type: string) => {
    return type === 'INCOME' ? '#10b981' : '#ef4444';
  };

  return (
    <div className="categories-page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1>Categories</h1>
        <button onClick={handleAddClick} className="btn btn-primary">
          Add Category
        </button>
      </div>

      <Card>
        {loading ? (
          <Loader size="medium" />
        ) : categories.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No categories found</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td>
                    <span
                      className="color-badge"
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: getCategoryColor(c.type),
                        marginRight: '8px',
                      }}
                    />
                    {c.name}
                  </td>
                  <td>
                    <span className={`badge badge-${c.type === 'INCOME' ? 'success' : 'error'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-small btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Category</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Groceries, Salary"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })
                  }
                  required
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
