import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge, Button } from '../../ui';
import { getRecentAnomalies, type AnomalyScore } from '../../api/ai';
import { useAuthStore } from '../../store/auth';
import './AnomalyInbox.css';

interface AnomalyWithDetails extends AnomalyScore {
  description?: string;
  amount?: number;
  date?: string;
}

export function AnomalyInbox() {
  const [anomalies, setAnomalies] = useState<AnomalyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRecentAnomalies(5, token || undefined);
      setAnomalies(result);
    } catch {
      setError('Unable to load anomalies');
      // Use mock data for demo
      setAnomalies([
        {
          transactionId: 1,
          score: 0.92,
          isAnomaly: true,
          reason: 'Unusual amount',
          description: 'AMAZON MARKETPLACE',
          amount: -589.99,
          date: '2024-01-15',
        },
        {
          transactionId: 2,
          score: 0.85,
          isAnomaly: true,
          reason: 'New merchant',
          description: 'CRYPTO EXCHANGE LTD',
          amount: -1250.00,
          date: '2024-01-14',
        },
        {
          transactionId: 3,
          score: 0.78,
          isAnomaly: true,
          reason: 'Unusual time',
          description: 'LATE NIGHT FOOD CO',
          amount: -45.60,
          date: '2024-01-14',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(Math.abs(value));
  };

  const getScoreVariant = (score: number) => {
    if (score >= 0.9) return 'danger';
    if (score >= 0.7) return 'warning';
    return 'default';
  };

  const handleViewAll = () => {
    navigate('/transactions?filter=anomalies');
  };

  if (loading) {
    return (
      <Card className="anomaly-inbox">
        <CardHeader>
          <CardTitle>Anomaly Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="anomaly-inbox__skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="anomaly-inbox__skeleton-item">
                <Skeleton variant="circular" width={32} height={32} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={14} />
                </div>
                <Skeleton width={60} height={24} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="anomaly-inbox">
      <CardHeader>
        <CardTitle>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 6v4M10 14h.01" strokeLinecap="round" />
            <path d="M8.57 3.31L2.23 14.34a1.5 1.5 0 0 0 1.29 2.25h12.96a1.5 1.5 0 0 0 1.29-2.25L11.43 3.31a1.5 1.5 0 0 0-2.86 0z" />
          </svg>
          Anomaly Inbox
          {anomalies.length > 0 && (
            <Badge variant="danger" size="sm">
              {anomalies.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="anomaly-inbox__content">
        {anomalies.length === 0 ? (
          <div className="anomaly-inbox__empty">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="20" cy="20" r="15" />
              <path d="M15 20l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>No anomalies detected</p>
            <span>Your recent transactions look normal</span>
          </div>
        ) : (
          <>
            <ul className="anomaly-inbox__list">
              {anomalies.map((anomaly) => (
                <li key={anomaly.transactionId} className="anomaly-inbox__item">
                  <div className="anomaly-inbox__item-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 5v3M8 11h.01" strokeLinecap="round" />
                      <path d="M6.86 2.65L1.78 11.47a1.2 1.2 0 0 0 1.03 1.8h10.38a1.2 1.2 0 0 0 1.03-1.8L9.14 2.65a1.2 1.2 0 0 0-2.28 0z" />
                    </svg>
                  </div>
                  <div className="anomaly-inbox__item-content">
                    <span className="anomaly-inbox__item-merchant">
                      {anomaly.description || `Transaction #${anomaly.transactionId}`}
                    </span>
                    <span className="anomaly-inbox__item-reason">{anomaly.reason}</span>
                  </div>
                  <div className="anomaly-inbox__item-meta">
                    {anomaly.amount && (
                      <span className="anomaly-inbox__item-amount">
                        {formatCurrency(anomaly.amount)}
                      </span>
                    )}
                    <Badge variant={getScoreVariant(anomaly.score)} size="sm">
                      {Math.round(anomaly.score * 100)}%
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="anomaly-inbox__footer">
              <Button variant="ghost" size="sm" onClick={handleViewAll}>
                View all anomalies
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </div>
          </>
        )}

        {error && <div className="anomaly-inbox__demo-badge">Demo Data</div>}
      </CardContent>
    </Card>
  );
}
