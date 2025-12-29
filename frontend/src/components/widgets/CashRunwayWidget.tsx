import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '../../ui';
import { getCashRunway, type CashRunwayData } from '../../api/ai';
import { useAuthStore } from '../../store/auth';
import './CashRunwayWidget.css';

export function CashRunwayWidget() {
  const [data, setData] = useState<CashRunwayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCashRunway(token || undefined);
      setData(result);
    } catch {
      setError('Unable to load cash runway');
      // Use mock data for demo
      setData({
        currentBalance: 24580,
        daysUntilLow: 45,
        lowThreshold: 5000,
        runway: [
          { date: '2024-01-15', predictedBalance: 24580, lowerBound: 23000, upperBound: 26000 },
          { date: '2024-01-22', predictedBalance: 22100, lowerBound: 20500, upperBound: 23700 },
          { date: '2024-01-29', predictedBalance: 19800, lowerBound: 17800, upperBound: 21800 },
          { date: '2024-02-05', predictedBalance: 17200, lowerBound: 15000, upperBound: 19400 },
          { date: '2024-02-12', predictedBalance: 15100, lowerBound: 12800, upperBound: 17400 },
          { date: '2024-02-19', predictedBalance: 12800, lowerBound: 10200, upperBound: 15400 },
          { date: '2024-02-26', predictedBalance: 10500, lowerBound: 7800, upperBound: 13200 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRunwayStatus = () => {
    if (!data) return { status: 'unknown', color: 'var(--color-text-tertiary)' };
    if (data.daysUntilLow > 60) return { status: 'healthy', color: 'var(--color-positive)' };
    if (data.daysUntilLow > 30) return { status: 'moderate', color: 'var(--color-warning)' };
    return { status: 'low', color: 'var(--color-danger)' };
  };

  if (loading) {
    return (
      <Card className="cash-runway-widget">
        <CardHeader>
          <CardTitle>Cash Runway</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="cash-runway-widget__skeleton">
            <Skeleton width={120} height={32} />
            <Skeleton width={180} height={16} />
            <Skeleton variant="rectangular" height={160} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { color } = getRunwayStatus();

  return (
    <Card className="cash-runway-widget">
      <CardHeader>
        <CardTitle>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 15l4-4 4 3 8-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cash Runway
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="cash-runway-widget__header">
          <div className="cash-runway-widget__balance">
            <span className="cash-runway-widget__label">Current Balance</span>
            <span className="cash-runway-widget__value">{formatCurrency(data?.currentBalance || 0)}</span>
          </div>
          <div className="cash-runway-widget__days" style={{ '--status-color': color } as React.CSSProperties}>
            <span className="cash-runway-widget__days-value">{data?.daysUntilLow || 0}</span>
            <span className="cash-runway-widget__days-label">days until {formatCurrency(data?.lowThreshold || 0)}</span>
          </div>
        </div>

        <div className="cash-runway-widget__chart">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data?.runway || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="boundsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-text-tertiary)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="var(--color-text-tertiary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
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
                formatter={(value: number) => [formatCurrency(value), 'Predicted']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="url(#boundsGradient)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="predictedBalance"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#cashGradient)"
                fillOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {error && <div className="cash-runway-widget__demo-badge">Demo Data</div>}
      </CardContent>
    </Card>
  );
}
