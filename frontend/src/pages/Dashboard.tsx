import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/Card';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth';
import { transactionApi, insightApi, reportApi } from '@/api/endpoints';
import { formatCurrency, currencyGBP, formatDate } from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { InsightResponse, MonthlyInsight } from '@/api/types';

interface HealthStatus {
  backend: 'UP' | 'DOWN' | 'CHECKING';
  ai: 'UP' | 'DOWN' | 'CHECKING';
}

interface QuickStats {
  totalDebit: number;
  totalCredit: number;
  loading: boolean;
}

export function Dashboard() {
  const [health, setHealth] = useState<HealthStatus>({ backend: 'CHECKING', ai: 'CHECKING' });
  const [stats, setStats] = useState<QuickStats>({ totalDebit: 0, totalCredit: 0, loading: true });
  const [chartData, setChartData] = useState<{ month: string; amount: number }[]>([]);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Monthly insights state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthlyInsight, setMonthlyInsight] = useState<MonthlyInsight | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const { showToast } = useToast();
  const { token } = useAuthStore();

  const checkHealth = useCallback(async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      const response = await fetch(`${apiBase}/api/health`);
      setHealth(prev => ({ ...prev, backend: response.ok ? 'UP' : 'DOWN' }));
    } catch {
      setHealth(prev => ({ ...prev, backend: 'DOWN' }));
    }

    try {
      const aiUrl = import.meta.env.VITE_AI_URL || 'http://127.0.0.1:8001';
      const response = await fetch(`${aiUrl}/health`);
      setHealth(prev => ({ ...prev, ai: response.ok ? 'UP' : 'DOWN' }));
    } catch {
      setHealth(prev => ({ ...prev, ai: 'DOWN' }));
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const response = await transactionApi.list({ token, startDate, size: 1000 });

      const totalDebit = response.content
        .filter(t => t.direction === 'OUT')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCredit = response.content
        .filter(t => t.direction === 'IN')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({ totalDebit, totalCredit, loading: false });
    } catch {
      showToast('Failed to load stats', 'error');
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [token, showToast]);

  const loadChartData = useCallback(async () => {
    if (!token) return;
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      const response = await transactionApi.list({ token, startDate, size: 1000 });

      const monthlyData = response.content.reduce(
        (acc, t) => {
          const month = t.transactionDate.substring(0, 7);
          if (!acc[month]) acc[month] = 0;
          if (t.direction === 'OUT') acc[month] += t.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      const chartData = Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setChartData(chartData);
    } catch {
      showToast('Failed to load chart data', 'error');
    }
  }, [token, showToast]);

  useEffect(() => {
    checkHealth();
    loadStats();
    loadChartData();
  }, [checkHealth, loadStats, loadChartData]);

  // Load monthly insights
  const loadMonthlyInsights = useCallback(async () => {
    if (!token) return;
    setMonthlyLoading(true);
    try {
      const result = await insightApi.monthly({ month: selectedMonth, year: selectedYear }, token);
      setMonthlyInsight(result);
    } catch {
      showToast('Failed to load monthly insights', 'error');
    } finally {
      setMonthlyLoading(false);
    }
  }, [token, selectedMonth, selectedYear, showToast]);

  useEffect(() => {
    loadMonthlyInsights();
  }, [loadMonthlyInsights]);

  const handleDownloadPDF = async () => {
    if (!token) return;
    setPdfDownloading(true);
    try {
      await reportApi.pdf({ month: selectedMonth, year: selectedYear }, token);
      showToast('PDF downloaded successfully', 'success');
    } catch {
      showToast('Failed to download PDF', 'error');
    } finally {
      setPdfDownloading(false);
    }
  };

  const runSampleInsight = async () => {
    if (!token) return;
    setInsightLoading(true);
    try {
      const result = await insightApi.analyze(
        {
          transactions: [
            { date: '2025-01-15', amount: 150.0, category: 'Groceries' },
            { date: '2025-01-16', amount: 75.5, category: 'Transportation' },
            { date: '2025-01-01', amount: 1200.0, category: 'Housing' },
          ],
        },
        token
      );
      setInsight(result);
      showToast('Insight generated successfully', 'success');
    } catch {
      showToast('Failed to generate insight', 'error');
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="dashboard-health">
        <div className={`status-chip status-${health.backend.toLowerCase()}`}>
          Backend: {health.backend}
        </div>
        <div className={`status-chip status-${health.ai.toLowerCase()}`}>
          AI Service: {health.ai}
        </div>
      </div>

      <div className="dashboard-stats">
        {stats.loading ? (
          <Loader size="medium" />
        ) : (
          <>
            <Card title="30-Day Spending" className="stat-card">
              <div className="stat-value">{formatCurrency(stats.totalDebit)}</div>
            </Card>
            <Card title="30-Day Income" className="stat-card">
              <div className="stat-value">{formatCurrency(stats.totalCredit)}</div>
            </Card>
            <Card title="Net" className="stat-card">
              <div className="stat-value">
                {formatCurrency(stats.totalCredit - stats.totalDebit)}
              </div>
            </Card>
          </>
        )}
      </div>

      <Card title="Monthly Spending Trend">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>No data available</p>
        )}
      </Card>

      <Card title="AI Insights">
        <button
          onClick={runSampleInsight}
          disabled={insightLoading || health.ai !== 'UP'}
          className="btn btn-primary"
        >
          {insightLoading ? 'Generating...' : 'Run Sample Insight'}
        </button>
        {insight && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f3f4f6',
              borderRadius: '8px',
            }}
          >
            <strong>Summary:</strong> {insight.summary}
          </div>
        )}
      </Card>

      <Card title="Monthly Insights">
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="month-select" style={{ fontWeight: 500 }}>
              Month:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '0.875rem',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="year-select" style={{ fontWeight: 500 }}>
              Year:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '0.875rem',
              }}
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadMonthlyInsights}
            disabled={monthlyLoading}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            {monthlyLoading ? 'Loading...' : 'Refresh Insights'}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={pdfDownloading || !monthlyInsight}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            {pdfDownloading ? 'Downloading...' : 'Download Monthly Report (PDF)'}
          </button>
        </div>

        {monthlyLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading insights...
          </div>
        ) : monthlyInsight ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary */}
            <div
              style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontWeight: 500, color: '#374151' }}>Total Debit: </span>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>
                    {currencyGBP(monthlyInsight.totalDebit)}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: '#374151' }}>Total Credit: </span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    {currencyGBP(monthlyInsight.totalCredit)}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: '#374151' }}>Biggest Category: </span>
                  <span style={{ fontWeight: 600 }}>{monthlyInsight.biggestCategory}</span>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            {monthlyInsight.topCategories.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#111827',
                  }}
                >
                  Top 5 Categories
                </h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                        Category
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyInsight.topCategories.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>{cat.category}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>
                          {currencyGBP(cat.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Anomalies */}
            {monthlyInsight.anomalies.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#111827',
                  }}
                >
                  Detected Anomalies
                </h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                        Date
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                        Category
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        Amount
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        Z-Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyInsight.anomalies.map((anomaly, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          background: anomaly.score > 2.5 ? '#fef2f2' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>{formatDate(anomaly.date)}</td>
                        <td style={{ padding: '0.75rem' }}>{anomaly.category || 'N/A'}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>
                          {currencyGBP(anomaly.amount)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem',
                            textAlign: 'right',
                            fontWeight: 500,
                            color: anomaly.score > 2.5 ? '#dc2626' : '#374151',
                          }}
                        >
                          {anomaly.score.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Forecast */}
            {monthlyInsight.forecast.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#111827',
                  }}
                >
                  Next Month Forecast
                </h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                        Category
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        Forecast
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyInsight.forecast.map((fc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>{fc.category}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>
                          {currencyGBP(fc.nextMonthForecast)}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                          {fc.method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {monthlyInsight.topCategories.length === 0 &&
              monthlyInsight.anomalies.length === 0 &&
              monthlyInsight.forecast.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No insights available for this month
                </div>
              )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Select a month and click "Refresh Insights" to view data
          </div>
        )}
      </Card>
    </div>
  );
}
