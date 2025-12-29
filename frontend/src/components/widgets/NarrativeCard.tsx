import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '../../ui';
import { getNarrativeInsight, type NarrativeInsight } from '../../api/ai';
import { useAuthStore } from '../../store/auth';
import './NarrativeCard.css';

export function NarrativeCard() {
  const [data, setData] = useState<NarrativeInsight | null>(null);
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
      const result = await getNarrativeInsight(token || undefined);
      setData(result);
    } catch {
      setError('Unable to load insights');
      // Use mock data for demo
      setData({
        summary: "Your spending this month is 12% lower than last month. You're on track to save £340 by month end.",
        highlights: [
          'Groceries spending down 18% – great job!',
          'Dining out increased by £85 compared to usual',
          'Subscription costs remain stable at £127/month',
        ],
        topCategory: 'Housing',
        topCategorySpend: 1250,
        trend: 'down',
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'down':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 4v8M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8h10" strokeLinecap="round" />
          </svg>
        );
    }
  };

  const getTrendVariant = (trend: 'up' | 'down' | 'stable') => {
    // For spending, down is good, up is concerning
    switch (trend) {
      case 'down':
        return 'success';
      case 'up':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card className="narrative-card">
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="narrative-card__skeleton">
            <Skeleton width="90%" height={20} />
            <Skeleton width="70%" height={20} />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Skeleton width="100%" height={16} />
              <Skeleton width="85%" height={16} />
              <Skeleton width="90%" height={16} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="narrative-card">
      <CardHeader>
        <CardTitle>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2a8 8 0 1 0 8 8" strokeLinecap="round" />
            <path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="15" cy="5" r="3" fill="var(--color-primary)" stroke="none" />
          </svg>
          AI Insights
        </CardTitle>
        {data?.trend && (
          <Badge variant={getTrendVariant(data.trend)} size="sm">
            {getTrendIcon(data.trend)}
            Spending {data.trend}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="narrative-card__summary">{data?.summary}</p>

        {data?.highlights && data.highlights.length > 0 && (
          <ul className="narrative-card__highlights">
            {data.highlights.map((highlight, index) => (
              <li key={index} className="narrative-card__highlight">
                <span className="narrative-card__highlight-bullet" />
                {highlight}
              </li>
            ))}
          </ul>
        )}

        {data?.topCategory && (
          <div className="narrative-card__top-category">
            <span className="narrative-card__top-category-label">Top spending category</span>
            <div className="narrative-card__top-category-value">
              <span>{data.topCategory}</span>
              <span className="narrative-card__top-category-amount">
                {formatCurrency(data.topCategorySpend)}
              </span>
            </div>
          </div>
        )}

        {error && <div className="narrative-card__demo-badge">Demo Data</div>}
      </CardContent>
    </Card>
  );
}
