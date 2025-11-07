import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { budgetApi, categoryApi } from '@/api/endpoints';
import type { BudgetResponse, BudgetSummary, CategoryResponse } from '@/api/types';
import { Card } from '@/components/Card';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/format';

export function Budgets() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [summary, setSummary] = useState<BudgetSummary[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetResponse | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
  });

  const loadBudgets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await budgetApi.list(month, year, token);
      setBudgets(data);
    } catch {
      showToast('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, month, year, showToast]);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const data = await budgetApi.summary(month, year, token);
      setSummary(data);
    } catch {
      showToast('Failed to load summary', 'error');
    }
  }, [token, month, year, showToast]);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      const data = await categoryApi.list(token);
      setCategories(data.filter(c => c.type === 'EXPENSE'));
    } catch {
      showToast('Failed to load categories', 'error');
    }
  }, [token, showToast]);

  useEffect(() => {
    loadBudgets();
    loadSummary();
    loadCategories();
  }, [loadBudgets, loadSummary, loadCategories]);

  const handleAddClick = () => {
    setEditingBudget(null);
    setFormData({
      categoryId: categories[0]?.id || '',
      amount: 0,
    });
    setShowModal(true);
  };

  const handleEditClick = (budget: BudgetResponse) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingBudget) {
        await budgetApi.update(editingBudget.id, { ...formData, month, year }, token);
        showToast('Budget updated', 'success');
      } else {
        await budgetApi.create({ ...formData, month, year }, token);
        showToast('Budget created', 'success');
      }
      setShowModal(false);
      loadBudgets();
      loadSummary();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    if (!token) return;

    try {
      await budgetApi.delete(id, token);
      showToast('Budget deleted', 'success');
      loadBudgets();
      loadSummary();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return '#ef4444'; // red
    if (percentage >= 80) return '#f59e0b'; // yellow
    return '#3b82f6'; // blue
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  return (
    <div className="budgets-page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1>Budgets</h1>
        <button onClick={handleAddClick} className="btn btn-primary">
          Add Budget
        </button>
      </div>

      <Card>
        <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            <option value={1}>January</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>

          <input
            type="number"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            min="2000"
            max="2100"
            style={{ width: '120px' }}
          />
        </div>

        {loading ? (
          <Loader size="medium" />
        ) : (
          <>
            {summary.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Summary</h3>
                <div className="budget-summary-grid">
                  {summary.map(s => {
                    const percentage = getProgressPercentage(s.spent, s.limit);
                    const color = getProgressColor(s.spent, s.limit);
                    return (
                      <div key={s.categoryId} className="budget-summary-card">
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>{s.categoryName}</strong>
                        </div>
                        <div
                          style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}
                        >
                          {formatCurrency(s.spent)} / {formatCurrency(s.limit)}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        {s.spent > s.limit && (
                          <div
                            style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}
                          >
                            Over budget by {formatCurrency(s.spent - s.limit)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h3>Manage Budgets</h3>
            {budgets.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                No budgets for this period
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(b => (
                    <tr key={b.id}>
                      <td>
                        {b.categoryName || categories.find(c => c.id === b.categoryId)?.name || '-'}
                      </td>
                      <td>{formatCurrency(b.amount)}</td>
                      <td>
                        <button onClick={() => handleEditClick(b)} className="btn btn-small">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="btn btn-small btn-danger"
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {new Date(year, month - 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
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
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
