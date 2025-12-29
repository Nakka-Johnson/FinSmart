import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Badge,
} from '../ui';
import { CashRunwayWidget, NarrativeCard, AnomalyInbox } from '../components/widgets';
import { useAuthStore } from '../store/auth';
import { transactionApi } from '../api/endpoints';
import type { InsightResponse } from '../api/types';
import './DashboardV2.css';

interface QuickStats {
  totalDebit: number;
  totalCredit: number;
  transactionCount: number;
  loading: boolean;
}

interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

const CATEGORY_COLORS = [
  'var(--color-blue-500)',
  'var(--color-emerald-500)',
  'var(--color-amber-500)',
  'var(--color-violet-500)',
  'var(--color-rose-500)',
  'var(--color-slate-500)',
];

export function DashboardV2() {
  const [stats, setStats] = useState<QuickStats>({
    totalDebit: 0,
    totalCredit: 0,
    transactionCount: 0,
    loading: true,
  });
  const [spendByCategory, setSpendByCategory] = useState<CategorySpend[]>([]);
  const [chartData, setChartData] = useState<{ month: string; spending: number; income: number }[]>(
    []
  );
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const { token } = useAuthStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const response = await transactionApi.list({ token, startDate, size: 1000 });

      const totalDebit = response.content
        .filter((t) => t.direction === 'OUT')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCredit = response.content
        .filter((t) => t.direction === 'IN')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate spending by category
      const categoryTotals: Record<string, number> = {};
      response.content
        .filter((t) => t.direction === 'OUT')
        .forEach((t) => {
          const cat = t.categoryId ? `Category-${t.categoryId}` : 'Other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

      const categories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / totalDebit) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      setSpendByCategory(categories);
      setStats({
        totalDebit,
        totalCredit,
        transactionCount: response.content.length,
        loading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, [token]);

  const loadChartData = useCallback(async () => {
    if (!token) return;
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      const response = await transactionApi.list({ token, startDate, size: 1000 });

      const monthlyData: Record<string, { spending: number; income: number }> = {};
      response.content.forEach((t) => {
        const month = t.transactionDate.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { spending: 0, income: 0 };
        if (t.direction === 'OUT') monthlyData[month].spending += t.amount;
        else monthlyData[month].income += t.amount;
      });

      const data = Object.entries(monthlyData)
        .map(([month, values]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
          spending: values.spending,
          income: values.income,
        }))
        .slice(-6);

      setChartData(data);
    } catch {
      // Use demo data
      setChartData([
        { month: 'Aug', spending: 2450, income: 3200 },
        { month: 'Sep', spending: 2100, income: 3200 },
        { month: 'Oct', spending: 2800, income: 3500 },
        { month: 'Nov', spending: 2300, income: 3200 },
        { month: 'Dec', spending: 3100, income: 3800 },
        { month: 'Jan', spending: 2200, income: 3200 },
      ]);
    }
  }, [token]);

  // Insight loading is handled by NarrativeCard widget
  // We keep the insight state for potential manual summarization

  useEffect(() => {
    // Skip insight loading - handled by widgets
    setInsight(null);
  }, []);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, [loadStats, loadChartData]);

  const netFlow = stats.totalCredit - stats.totalDebit;
  const savingsRate = stats.totalCredit > 0 ? (netFlow / stats.totalCredit) * 100 : 0;

  return (
    <div className="dashboard-v2">
      <div className="dashboard-v2__header">
        <div>
          <h1 className="dashboard-v2__title">Dashboard</h1>
          <p className="dashboard-v2__subtitle">Your financial overview at a glance</p>
        </div>
        <div className="dashboard-v2__period">
          <Badge variant="default" size="md">
            Last 30 days
          </Badge>
        </div>
      </div>

      {/* Hero Widgets Row */}
      <div className="dashboard-v2__hero-grid">
        <CashRunwayWidget />
        <NarrativeCard />
        <AnomalyInbox />
      </div>

      {/* Quick Stats */}
      <div className="dashboard-v2__stats-grid">
        <Card>
          <CardContent className="dashboard-v2__stat-card">
            {stats.loading ? (
              <Skeleton width={120} height={32} />
            ) : (
              <>
                <span className="dashboard-v2__stat-label">Total Spending</span>
                <span className="dashboard-v2__stat-value dashboard-v2__stat-value--negative">
                  {formatCurrency(stats.totalDebit)}
                </span>
                <span className="dashboard-v2__stat-meta">
                  {stats.transactionCount} transactions
                </span>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="dashboard-v2__stat-card">
            {stats.loading ? (
              <Skeleton width={120} height={32} />
            ) : (
              <>
                <span className="dashboard-v2__stat-label">Total Income</span>
                <span className="dashboard-v2__stat-value dashboard-v2__stat-value--positive">
                  {formatCurrency(stats.totalCredit)}
                </span>
                <span className="dashboard-v2__stat-meta">This month</span>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="dashboard-v2__stat-card">
            {stats.loading ? (
              <Skeleton width={120} height={32} />
            ) : (
              <>
                <span className="dashboard-v2__stat-label">Net Flow</span>
                <span
                  className={`dashboard-v2__stat-value ${netFlow >= 0 ? 'dashboard-v2__stat-value--positive' : 'dashboard-v2__stat-value--negative'}`}
                >
                  {netFlow >= 0 ? '+' : ''}
                  {formatCurrency(netFlow)}
                </span>
                <span className="dashboard-v2__stat-meta">
                  {savingsRate > 0 ? `${savingsRate.toFixed(0)}% savings rate` : 'Deficit'}
                </span>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="dashboard-v2__charts-grid">
        {/* Spending Trend */}
        <Card className="dashboard-v2__chart-card">
          <CardHeader>
            <CardTitle>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 15l4-4 4 3 8-10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cash Flow Trend
            </CardTitle>
            <CardDescription>Income vs spending over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="dashboard-v2__chart">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-positive)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-positive)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `£${(val / 1000).toFixed(0)}k`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                    }}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="var(--color-positive)"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    name="Spending"
                    stroke="var(--color-danger)"
                    strokeWidth={2}
                    fill="url(#spendingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="dashboard-v2__chart-card">
          <CardHeader>
            <CardTitle>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="10" cy="10" r="8" />
                <path d="M10 2a8 8 0 0 1 8 8" />
              </svg>
              Spending by Category
            </CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {spendByCategory.length === 0 ? (
              <div className="dashboard-v2__chart-empty">
                <p>No spending data available</p>
              </div>
            ) : (
              <div className="dashboard-v2__category-chart">
                <div className="dashboard-v2__category-bars">
                  {spendByCategory.map((cat, index) => (
                    <div key={cat.category} className="dashboard-v2__category-row">
                      <div className="dashboard-v2__category-info">
                        <span className="dashboard-v2__category-name">{cat.category}</span>
                        <span className="dashboard-v2__category-amount">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                      <div className="dashboard-v2__category-bar-bg">
                        <div
                          className="dashboard-v2__category-bar"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      {insight && (
        <Card className="dashboard-v2__insight-card">
          <CardHeader>
            <CardTitle>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10 2a8 8 0 1 0 8 8" strokeLinecap="round" />
                <path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="15" cy="5" r="3" fill="var(--color-primary)" stroke="none" />
              </svg>
              AI Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dashboard-v2__insight-text">{insight.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
