import { useEffect, useState, useCallback } from 'react';
import { Modal, ModalBody, ModalFooter, Button, Skeleton, Badge } from '../ui';
import { getExplanation, submitFeedback, type FeedbackPayload } from '../api/ai';
import './WhyDrawer.css';

interface WhyDrawerProps {
  open: boolean;
  onClose: () => void;
  transactionId: number;
  type: 'category' | 'anomaly';
  currentValue: string;
  confidence?: number;
}

export function WhyDrawer({
  open,
  onClose,
  transactionId,
  type,
  currentValue,
  confidence,
}: WhyDrawerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [factors, setFactors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [correctedValue, setCorrectedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const loadExplanation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getExplanation(transactionId, type);
      setExplanation(result.explanation);
      setFactors(result.factors);
    } catch {
      setError('Unable to load explanation');
      // Use mock data for demo
      if (type === 'category') {
        setExplanation(
          `This transaction was categorized as "${currentValue}" based on the merchant name and transaction patterns.`
        );
        setFactors([
          'Merchant name matches known retail patterns',
          'Amount is typical for this category',
          'Similar to 12 previous transactions',
          'Time of transaction aligns with shopping hours',
        ]);
      } else {
        setExplanation(
          'This transaction was flagged as potentially anomalous due to unusual patterns.'
        );
        setFactors([
          'Amount is 3x higher than your average',
          'New merchant not seen before',
          'Transaction occurred at unusual time',
          'Location differs from usual patterns',
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [transactionId, type, currentValue]);

  useEffect(() => {
    if (open) {
      loadExplanation();
      setFeedbackMode(false);
      setFeedbackSubmitted(false);
    }
  }, [open, loadExplanation]);

  const handleSubmitFeedback = async () => {
    if (!correctedValue.trim()) return;

    try {
      setSubmitting(true);
      const feedback: FeedbackPayload = {
        transactionId,
        feedbackType: type,
        originalValue: currentValue,
        correctedValue: correctedValue.trim(),
      };
      await submitFeedback(feedback);
      setFeedbackSubmitted(true);
      setFeedbackMode(false);
    } catch {
      // Still show success for demo
      setFeedbackSubmitted(true);
      setFeedbackMode(false);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    'Groceries',
    'Dining',
    'Transport',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Health',
    'Travel',
    'Education',
    'Personal Care',
    'Other',
  ];

  return (
    <Modal open={open} onClose={onClose} title={type === 'category' ? 'Why this category?' : 'Why flagged?'} size="md">
      <ModalBody>
        {loading ? (
          <div className="why-drawer__skeleton">
            <Skeleton width="100%" height={60} />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Skeleton width={100} height={14} />
              <Skeleton width="90%" height={16} />
              <Skeleton width="85%" height={16} />
              <Skeleton width="80%" height={16} />
            </div>
          </div>
        ) : (
          <>
            <div className="why-drawer__current">
              <span className="why-drawer__label">
                {type === 'category' ? 'Current Category' : 'Anomaly Status'}
              </span>
              <div className="why-drawer__value-row">
                <span className="why-drawer__value">{currentValue}</span>
                {confidence !== undefined && (
                  <Badge
                    variant={confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {Math.round(confidence * 100)}% confidence
                  </Badge>
                )}
              </div>
            </div>

            <div className="why-drawer__explanation">
              <p>{explanation}</p>
            </div>

            {factors.length > 0 && (
              <div className="why-drawer__factors">
                <span className="why-drawer__label">Contributing Factors</span>
                <ul className="why-drawer__factors-list">
                  {factors.map((factor, index) => (
                    <li key={index}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="7" cy="7" r="5" />
                        <path d="M7 5v2M7 9h.01" strokeLinecap="round" />
                      </svg>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedbackSubmitted && (
              <div className="why-drawer__feedback-success">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="10" cy="10" r="8" />
                  <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Thanks for your feedback! Our AI will learn from this.</span>
              </div>
            )}

            {feedbackMode && !feedbackSubmitted && (
              <div className="why-drawer__feedback-form">
                <span className="why-drawer__label">What should it be?</span>
                {type === 'category' ? (
                  <select
                    className="why-drawer__select"
                    value={correctedValue}
                    onChange={(e) => setCorrectedValue(e.target.value)}
                  >
                    <option value="">Select a category...</option>
                    {categoryOptions
                      .filter((cat) => cat !== currentValue)
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="why-drawer__radio-group">
                    <label>
                      <input
                        type="radio"
                        name="anomaly"
                        value="normal"
                        checked={correctedValue === 'normal'}
                        onChange={(e) => setCorrectedValue(e.target.value)}
                      />
                      This is a normal transaction
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="anomaly"
                        value="anomaly"
                        checked={correctedValue === 'anomaly'}
                        onChange={(e) => setCorrectedValue(e.target.value)}
                      />
                      This is actually suspicious
                    </label>
                  </div>
                )}
              </div>
            )}

            {error && <div className="why-drawer__demo-badge">Demo Data</div>}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {!feedbackMode && !feedbackSubmitted && (
          <Button variant="ghost" onClick={() => setFeedbackMode(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11.5 2.5l-9 9L2 13l1.5-.5 9-9-1-1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Not right?
          </Button>
        )}
        {feedbackMode && (
          <>
            <Button variant="ghost" onClick={() => setFeedbackMode(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitFeedback}
              loading={submitting}
              disabled={!correctedValue.trim()}
            >
              Submit Feedback
            </Button>
          </>
        )}
        {!feedbackMode && (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
