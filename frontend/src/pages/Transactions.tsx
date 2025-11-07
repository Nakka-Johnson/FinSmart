import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { transactionApi, categoryApi, accountApi } from '@/api/endpoints';
import type {
  TransactionResponse,
  TransactionRequest,
  CategoryResponse,
  AccountResponse,
} from '@/api/types';
import { Card } from '@/components/Card';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/utils/format';

interface Filters {
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  direction?: 'IN' | 'OUT' | 'ALL';
}

export function Transactions() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [formData, setFormData] = useState<TransactionRequest>({
    accountId: '',
    categoryId: '',
    amount: 0,
    direction: 'OUT',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: {
        token: string;
        page: number;
        size: number;
        accountId?: string;
        categoryId?: string;
        startDate?: string;
        endDate?: string;
      } = { token, page, size: 20 };
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await transactionApi.list(params);
      setTransactions(response.content);
      setTotalPages(response.totalPages);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, page, filters, showToast]);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      const data = await categoryApi.list(token);
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    }
  }, [token, showToast]);

  const loadAccounts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await accountApi.list(token);
      setAccounts(data);
    } catch {
      showToast('Failed to load accounts', 'error');
    }
  }, [token, showToast]);

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadAccounts();
  }, [loadTransactions, loadCategories, loadAccounts]);

  const handleAddClick = () => {
    setEditingTransaction(null);
    setFormData({
      accountId: accounts[0]?.id || '',
      categoryId: categories[0]?.id || '',
      amount: 0,
      direction: 'OUT',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleEditClick = (transaction: TransactionResponse) => {
    setEditingTransaction(transaction);
    setFormData({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      direction: transaction.direction,
      description: transaction.description || '',
      transactionDate: transaction.transactionDate,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingTransaction) {
        await transactionApi.update(editingTransaction.id, formData, token);
        showToast('Transaction updated', 'success');
      } else {
        await transactionApi.create(formData, token);
        showToast('Transaction added', 'success');
      }
      setShowModal(false);
      loadTransactions();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    if (!token) return;

    try {
      await transactionApi.delete(id, token);
      showToast('Transaction deleted', 'success');
      loadTransactions();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setPage(0);
  };

  return (
    <div className="transactions-page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1>Transactions</h1>
        <button onClick={handleAddClick} className="btn btn-primary">
          Add Transaction
        </button>
      </div>

      <Card>
        <div className="filter-bar">
          <select
            value={filters.accountId || ''}
            onChange={e => handleFilterChange('accountId', e.target.value)}
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={filters.categoryId || ''}
            onChange={e => handleFilterChange('categoryId', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.direction || 'ALL'}
            onChange={e => handleFilterChange('direction', e.target.value)}
          >
            <option value="ALL">All Directions</option>
            <option value="IN">Income</option>
            <option value="OUT">Expense</option>
          </select>

          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate || ''}
            onChange={e => handleFilterChange('startDate', e.target.value)}
          />

          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate || ''}
            onChange={e => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        {loading ? (
          <Loader size="medium" />
        ) : transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No transactions found
          </p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Direction</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>{formatDate(t.transactionDate)}</td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td>
                      <span className={`badge badge-${t.direction === 'IN' ? 'success' : 'error'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td>{categories.find(c => c.id === t.categoryId)?.name || '-'}</td>
                    <td>{t.description || '-'}</td>
                    <td>
                      <button onClick={() => handleEditClick(t)} className="btn btn-small">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
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

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn btn-secondary btn-small"
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn btn-secondary btn-small"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.accountId}
                  onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                  required
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
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
                <label>Direction</label>
                <select
                  value={formData.direction}
                  onChange={e =>
                    setFormData({ ...formData, direction: e.target.value as 'IN' | 'OUT' })
                  }
                  required
                >
                  <option value="IN">Income</option>
                  <option value="OUT">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={e => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
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
                  {editingTransaction ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
