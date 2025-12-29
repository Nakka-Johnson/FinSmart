/**
 * Insights v2 Dashboard - Sprint-1
 * 
 * Displays merchant insights and anomaly detection results
 * from the backend AI service.
 */

import { useState, useEffect } from 'react';
import './InsightsPage.css';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuthStore } from '../store/auth';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface MerchantInsight {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  avgAmount: number;
  category: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  monthlyData?: Array<{
    month: string;
    amount: number;
  }>;
}

interface Anomaly {
  id: number;
  transactionId: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  reason: string;
  status: 'new' | 'snoozed' | 'confirmed' | 'ignored';
  severity: 'high' | 'medium' | 'low';
}

type TabType = 'merchants' | 'anomalies';

// ============================================================================
// Main Component
// ============================================================================

export function InsightsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('merchants');
  const [merchants, setMerchants] = useState<MerchantInsight[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  // Load data on mount
  useEffect(() => {
    if (token) loadInsights();
  }, [token]);

  async function loadInsights() {
    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Load both merchants and anomalies in parallel
      const [merchantsRes, anomaliesRes] = await Promise.all([
        fetch(`${apiBase}/api/insights/merchants`, { headers }),
        fetch(`${apiBase}/api/insights/anomalies`, { headers }),
      ]);

      if (!merchantsRes.ok || !anomaliesRes.ok) {
        throw new Error('Failed to load insights');
      }

      const merchantsData = await merchantsRes.json();
      const anomaliesData = await anomaliesRes.json();

      setMerchants(merchantsData);
      setAnomalies(anomaliesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <FeatureGate feature="insightsV2">
      <div className="insights-page">
        <header className="page-header">
          <h1>Insights Dashboard</h1>
          <p className="subtitle">AI-powered spending analysis</p>
        </header>

        {/* Tab Navigation */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'merchants' ? 'active' : ''}`}
            onClick={() => setActiveTab('merchants')}
          >
            Merchant Insights
          </button>
          <button
            className={`tab ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            Anomalies
            {anomalies.filter((a) => a.status === 'new').length > 0 && (
              <span className="badge">
                {anomalies.filter((a) => a.status === 'new').length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {loading && (
            <div className="loading">
              <div className="spinner" />
              <p>Loading insights...</p>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <p>⚠️ {error}</p>
              <button onClick={loadInsights}>Retry</button>
            </div>
          )}

          {!loading && !error && activeTab === 'merchants' && (
            <MerchantsTab merchants={merchants} />
          )}

          {!loading && !error && activeTab === 'anomalies' && (
            <AnomaliesTab
              anomalies={anomalies}
              onAction={(id, action) => handleAnomalyAction(id, action)}
            />
          )}
        </div>
      </div>
    </FeatureGate>
  );

  async function handleAnomalyAction(id: number, action: 'snooze' | 'confirm' | 'ignore') {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
      const res = await fetch(`${apiBase}/api/insights/anomalies/${id}/${action}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} anomaly`);
      }

      // Reload anomalies
      await loadInsights();
    } catch (err) {
      console.error(`Error ${action}ing anomaly:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

// ============================================================================
// Merchants Tab
// ============================================================================

interface MerchantsTabProps {
  merchants: MerchantInsight[];
}

function MerchantsTab({ merchants }: MerchantsTabProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantInsight | null>(null);

  // Sort by total spent (descending)
  const sortedMerchants = [...merchants].sort((a, b) => b.totalSpent - a.totalSpent);

  // Top 10 for chart
  const top10 = sortedMerchants.slice(0, 10);

  return (
    <div className="merchants-tab">
      {/* Top Merchants Chart */}
      <section className="chart-section">
        <h2>Top Merchants by Spending</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top10}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="merchant" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
            <Bar dataKey="totalSpent" fill="#4F46E5" name="Total Spent" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Merchants List */}
      <section className="merchants-list">
        <h2>All Merchants</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Category</th>
                <th>Total Spent</th>
                <th>Transactions</th>
                <th>Avg Amount</th>
                <th>Trend</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMerchants.map((merchant, idx) => (
                <tr key={idx}>
                  <td className="merchant-name">{merchant.merchant}</td>
                  <td>
                    <span className="category-badge">{merchant.category}</span>
                  </td>
                  <td className="amount">${merchant.totalSpent.toFixed(2)}</td>
                  <td>{merchant.transactionCount}</td>
                  <td className="amount">${merchant.avgAmount.toFixed(2)}</td>
                  <td>
                    <span className={`trend trend-${merchant.trend}`}>
                      {merchant.trend === 'increasing' && '📈'}
                      {merchant.trend === 'stable' && '➡️'}
                      {merchant.trend === 'decreasing' && '📉'}
                      {' '}
                      {merchant.trend}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => setSelectedMerchant(merchant)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Merchant Detail Modal */}
      {selectedMerchant && (
        <MerchantDetailModal
          merchant={selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Anomalies Tab
// ============================================================================

interface AnomaliesTabProps {
  anomalies: Anomaly[];
  onAction: (id: number, action: 'snooze' | 'confirm' | 'ignore') => void;
}

function AnomaliesTab({ anomalies, onAction }: AnomaliesTabProps) {
  const [filter, setFilter] = useState<'all' | 'new' | 'snoozed'>('new');

  const filteredAnomalies = anomalies.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'new') return a.status === 'new';
    if (filter === 'snoozed') return a.status === 'snoozed';
    return true;
  });

  const newCount = anomalies.filter((a) => a.status === 'new').length;
  const snoozedCount = anomalies.filter((a) => a.status === 'snoozed').length;

  return (
    <div className="anomalies-tab">
      {/* Summary */}
      <div className="anomaly-summary">
        <div className="summary-card">
          <h3>{newCount}</h3>
          <p>New Anomalies</p>
        </div>
        <div className="summary-card">
          <h3>{snoozedCount}</h3>
          <p>Snoozed</p>
        </div>
        <div className="summary-card">
          <h3>{anomalies.length}</h3>
          <p>Total Detected</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={filter === 'new' ? 'active' : ''}
          onClick={() => setFilter('new')}
        >
          New ({newCount})
        </button>
        <button
          className={filter === 'snoozed' ? 'active' : ''}
          onClick={() => setFilter('snoozed')}
        >
          Snoozed ({snoozedCount})
        </button>
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({anomalies.length})
        </button>
      </div>

      {/* Anomalies List */}
      <div className="anomalies-list">
        {filteredAnomalies.length === 0 && (
          <div className="empty-state">
            <p>✨ No {filter !== 'all' ? filter : ''} anomalies found</p>
          </div>
        )}

        {filteredAnomalies.map((anomaly) => (
          <AnomalyCard
            key={anomaly.id}
            anomaly={anomaly}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Anomaly Card
// ============================================================================

interface AnomalyCardProps {
  anomaly: Anomaly;
  onAction: (id: number, action: 'snooze' | 'confirm' | 'ignore') => void;
}

function AnomalyCard({ anomaly, onAction }: AnomalyCardProps) {
  const severityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  return (
    <div className={`anomaly-card severity-${anomaly.severity} status-${anomaly.status}`}>
      <div className="anomaly-header">
        <div className="anomaly-title">
          <h3>{anomaly.merchant}</h3>
          <span
            className="severity-badge"
            style={{ backgroundColor: severityColors[anomaly.severity] }}
          >
            {anomaly.severity}
          </span>
        </div>
        <div className="anomaly-amount">${anomaly.amount.toFixed(2)}</div>
      </div>

      <div className="anomaly-details">
        <div className="detail-row">
          <span className="label">Category:</span>
          <span className="value">{anomaly.category}</span>
        </div>
        <div className="detail-row">
          <span className="label">Date:</span>
          <span className="value">{new Date(anomaly.date).toLocaleDateString()}</span>
        </div>
        <div className="detail-row">
          <span className="label">Reason:</span>
          <span className="value reason">{anomaly.reason}</span>
        </div>
      </div>

      {anomaly.status === 'new' && (
        <div className="anomaly-actions">
          <button
            className="btn-action btn-snooze"
            onClick={() => onAction(anomaly.id, 'snooze')}
            title="Snooze for later review"
          >
            😴 Snooze
          </button>
          <button
            className="btn-action btn-confirm"
            onClick={() => onAction(anomaly.id, 'confirm')}
            title="This is unusual and correct"
          >
            ✓ Confirm
          </button>
          <button
            className="btn-action btn-ignore"
            onClick={() => onAction(anomaly.id, 'ignore')}
            title="Ignore this pattern in future"
          >
            🚫 Ignore
          </button>
        </div>
      )}

      {anomaly.status === 'snoozed' && (
        <div className="anomaly-status-badge">
          <span>😴 Snoozed</span>
        </div>
      )}

      {anomaly.status === 'confirmed' && (
        <div className="anomaly-status-badge confirmed">
          <span>✓ Confirmed</span>
        </div>
      )}

      {anomaly.status === 'ignored' && (
        <div className="anomaly-status-badge ignored">
          <span>🚫 Ignored</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Merchant Detail Modal
// ============================================================================

interface MerchantDetailModalProps {
  merchant: MerchantInsight;
  onClose: () => void;
}

function MerchantDetailModal({ merchant, onClose }: MerchantDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{merchant.merchant}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="merchant-stats">
            <div className="stat">
              <label>Total Spent</label>
              <span className="value">${merchant.totalSpent.toFixed(2)}</span>
            </div>
            <div className="stat">
              <label>Transactions</label>
              <span className="value">{merchant.transactionCount}</span>
            </div>
            <div className="stat">
              <label>Average Amount</label>
              <span className="value">${merchant.avgAmount.toFixed(2)}</span>
            </div>
            <div className="stat">
              <label>Category</label>
              <span className="value">{merchant.category}</span>
            </div>
          </div>

          {merchant.monthlyData && merchant.monthlyData.length > 0 && (
            <div className="monthly-trend">
              <h3>6-Month Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={merchant.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
