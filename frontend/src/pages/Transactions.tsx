import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { transactionApi, categoryApi, accountApi } from '@/api/endpoints';
import type {
  TransactionResponse,
  TransactionRequest,
  CategoryResponse,
  AccountResponse,
  ImportPreviewResponse,
  ImportSuccessResponse,
  BulkActionResponse,
} from '@/api/types';
import { Card } from '@/components/Card';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/utils/format';
import { MerchantChip } from '@/components/MerchantChip';
import { CategoryPill } from '@/components/CategoryPill';
import { WhyDrawer } from '@/components/WhyDrawer';

interface Filters {
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  direction?: 'IN' | 'OUT' | 'ALL';
}

interface WhyDrawerState {
  open: boolean;
  transactionId: number;
  type: 'category' | 'anomaly';
  currentValue: string;
  confidence?: number;
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [formData, setFormData] = useState<TransactionRequest>({
    accountId: '',
    categoryId: '',
    amount: 0,
    direction: 'OUT',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRecategoriseModal, setShowRecategoriseModal] = useState(false);
  const [recategoriseTargetId, setRecategoriseTargetId] = useState('');

  // CSV Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importAccountId, setImportAccountId] = useState<string>('');
  const [importPreviewMode, setImportPreviewMode] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [applySuggestions, setApplySuggestions] = useState(true);

  // Why drawer state
  const [whyDrawer, setWhyDrawer] = useState<WhyDrawerState>({
    open: false,
    transactionId: 0,
    type: 'category',
    currentValue: '',
  });

  const openWhyDrawer = (transaction: TransactionResponse) => {
    const categoryName = categories.find(c => c.id === transaction.categoryId)?.name || 'Unknown';
    setWhyDrawer({
      open: true,
      transactionId: parseInt(transaction.id),
      type: 'category',
      currentValue: categoryName,
      confidence: transaction.categoryConfidence,
    });
  };

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

  // CSV Import handlers
  const handleImportClick = () => {
    setImportFile(null);
    setImportAccountId(accounts[0]?.id || '');
    setImportPreviewMode(true);
    setPreviewData(null);
    setApplySuggestions(true);
    setShowImportModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setPreviewData(null);
    }
  };

  const handleImportPreview = async () => {
    if (!token || !importFile) return;

    setImportLoading(true);
    try {
      const response = await transactionApi.importCsv({
        file: importFile,
        accountId: importAccountId || undefined,
        preview: true,
        token,
      });
      setPreviewData(response);
      showToast('Preview loaded successfully', 'success');
    } catch (error) {
      showToast((error as Error).message || 'Preview failed', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportExecute = async () => {
    if (!token || !importFile) return;

    setImportLoading(true);
    try {
      const response: ImportSuccessResponse = await transactionApi.importCsv({
        file: importFile,
        accountId: importAccountId || undefined,
        preview: false,
        token,
      });
      showToast(`Successfully imported ${response.insertedCount} transactions`, 'success');
      setShowImportModal(false);
      setImportFile(null);
      setPreviewData(null);
      loadTransactions();
    } catch (error) {
      showToast((error as Error).message || 'Import failed', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Bulk action handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!token || selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} transaction(s)?`)) return;

    setLoading(true);
    try {
      const response = (await transactionApi.bulkAction(
        {
          action: 'DELETE',
          ids: Array.from(selectedIds),
        },
        token
      )) as BulkActionResponse;
      showToast(response.message, 'success');
      setSelectedIds(new Set());
      loadTransactions();
    } catch {
      showToast('Bulk delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRecategorise = async () => {
    if (!token || selectedIds.size === 0 || !recategoriseTargetId) return;

    setLoading(true);
    try {
      const response = (await transactionApi.bulkAction(
        {
          action: 'RECATEGORISE',
          ids: Array.from(selectedIds),
          categoryId: recategoriseTargetId,
        },
        token
      )) as BulkActionResponse;
      showToast(response.message, 'success');
      setSelectedIds(new Set());
      setShowRecategoriseModal(false);
      loadTransactions();
    } catch {
      showToast('Bulk recategorise failed', 'error');
    } finally {
      setLoading(false);
    }
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleImportClick} className="btn btn-secondary">
            Import CSV
          </button>
          <button onClick={handleAddClick} className="btn btn-primary">
            Add Transaction
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: '#f0f7ff',
            border: '1px solid #0066cc',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500 }}>{selectedIds.size} transaction(s) selected</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setRecategoriseTargetId(categories[0]?.id || '');
                setShowRecategoriseModal(true);
              }}
              className="btn btn-secondary btn-small"
            >
              Recategorise
            </button>
            <button onClick={handleBulkDelete} className="btn btn-danger btn-small">
              Delete Selected
            </button>
          </div>
        </div>
      )}

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
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={transactions.length > 0 && selectedIds.size === transactions.length}
                      onChange={handleSelectAll}
                      aria-label="Select all transactions"
                    />
                  </th>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Other';
                  return (
                    <tr key={t.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(t.id)}
                          onChange={e => handleSelectOne(t.id, e.target.checked)}
                          aria-label={`Select transaction ${t.description}`}
                        />
                      </td>
                      <td>{formatDate(t.transactionDate)}</td>
                      <td>
                        <MerchantChip
                          original={t.description || 'Unknown'}
                          normalised={t.normalizedMerchant}
                          confidence={t.merchantConfidence}
                          showOriginal={!!t.normalizedMerchant && t.normalizedMerchant !== t.description}
                        />
                      </td>
                      <td className={t.direction === 'IN' ? 'amount-positive' : 'amount-negative'}>
                        {t.direction === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td>
                        <CategoryPill
                          category={categoryName}
                          confidence={t.categoryConfidence}
                          onClick={() => openWhyDrawer(t)}
                          showConfidence={t.categoryConfidence !== undefined}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditClick(t)} className="btn btn-small" aria-label="Edit transaction">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="btn btn-small btn-danger"
                            aria-label="Delete transaction"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: previewData ? '1200px' : '600px' }}
          >
            <div className="modal-header">
              <h2>Import CSV</h2>
              <button onClick={() => setShowImportModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <div className="modal-body">
              {!previewData ? (
                <>
                  <div className="form-group">
                    <label>CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '100%',
                      }}
                    />
                    <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                      CSV columns: date, amount, direction, description, merchant, category
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Default Account (optional)</label>
                    <select
                      value={importAccountId}
                      onChange={e => setImportAccountId(e.target.value)}
                    >
                      <option value="">Use accountId from CSV</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={importPreviewMode}
                        onChange={e => setImportPreviewMode(e.target.checked)}
                      />
                      Preview with AI Categorization
                    </label>
                  </div>

                  {importLoading && <Loader size="medium" />}
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: previewData.invalidRows > 0 ? '#fff3cd' : '#d1f0d1',
                      padding: '1rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong>Preview Summary:</strong> {previewData.totalRows} rows total,{' '}
                    {previewData.validRows} valid, {previewData.invalidRows} invalid
                  </div>

                  {previewData.errors.length > 0 && (
                    <div
                      style={{
                        background: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        maxHeight: '150px',
                        overflow: 'auto',
                      }}
                    >
                      <strong>Errors:</strong>
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                        {previewData.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.rowNumber}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {previewData.rows.length > 0 && (
                    <>
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={applySuggestions}
                            onChange={e => setApplySuggestions(e.target.checked)}
                          />
                          Apply AI category suggestions when importing
                        </label>
                      </div>

                      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Direction</th>
                              <th>Merchant</th>
                              <th>Description</th>
                              <th>Original Cat.</th>
                              <th>Suggested Cat.</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.rows.map(row => (
                              <tr key={row.rowNumber}>
                                <td>{row.rowNumber}</td>
                                <td>{formatDate(row.postedAt)}</td>
                                <td>{formatCurrency(row.amount)}</td>
                                <td>
                                  <span
                                    className={`badge badge-${row.direction === 'CREDIT' ? 'success' : 'error'}`}
                                  >
                                    {row.direction}
                                  </span>
                                </td>
                                <td>{row.merchant || '-'}</td>
                                <td>{row.description || '-'}</td>
                                <td>{row.originalCategory || '-'}</td>
                                <td>
                                  {row.suggestedCategory ? (
                                    <strong style={{ color: '#0066cc' }}>
                                      {row.suggestedCategory}
                                    </strong>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>
                                  <small style={{ color: '#666' }}>
                                    {row.categorizationReason || '-'}
                                  </small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {importLoading && <Loader size="medium" />}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewData(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              {!previewData ? (
                <button
                  onClick={handleImportPreview}
                  className="btn btn-primary"
                  disabled={!importFile || importLoading}
                >
                  {importPreviewMode ? 'Preview' : 'Import Now'}
                </button>
              ) : (
                <button
                  onClick={handleImportExecute}
                  className="btn btn-primary"
                  disabled={previewData.validRows === 0 || importLoading}
                >
                  Import {previewData.validRows} Transaction(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recategorise Modal */}
      {showRecategoriseModal && (
        <div className="modal-overlay" onClick={() => setShowRecategoriseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recategorise Transactions</h2>
              <button onClick={() => setShowRecategoriseModal(false)} className="btn btn-small">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Recategorise <strong>{selectedIds.size}</strong> selected transaction(s) to:
              </p>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={recategoriseTargetId}
                  onChange={e => setRecategoriseTargetId(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowRecategoriseModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleBulkRecategorise} className="btn btn-primary">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Why Drawer for category explanation */}
      <WhyDrawer
        open={whyDrawer.open}
        onClose={() => setWhyDrawer(prev => ({ ...prev, open: false }))}
        transactionId={whyDrawer.transactionId}
        type={whyDrawer.type}
        currentValue={whyDrawer.currentValue}
        confidence={whyDrawer.confidence}
      />
    </div>
  );
}
