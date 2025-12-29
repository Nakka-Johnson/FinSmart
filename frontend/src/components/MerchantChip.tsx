import './MerchantChip.css';
import { clsx } from '../utils/clsx';

interface MerchantChipProps {
  original: string;
  normalised?: string;
  confidence?: number;
  showOriginal?: boolean;
  className?: string;
}

export function MerchantChip({
  original,
  normalised,
  confidence,
  showOriginal = false,
  className,
}: MerchantChipProps) {
  const displayName = normalised || original;
  const hasNormalised = normalised && normalised !== original;

  return (
    <div className={clsx('merchant-chip', className)}>
      <div className="merchant-chip__icon">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="10" height="7" rx="1" />
          <path d="M4 4V3a3 3 0 0 1 6 0v1" />
        </svg>
      </div>
      <div className="merchant-chip__content">
        <span className="merchant-chip__name">{displayName}</span>
        {showOriginal && hasNormalised && (
          <span className="merchant-chip__original">{original}</span>
        )}
      </div>
      {hasNormalised && confidence !== undefined && (
        <div
          className={clsx(
            'merchant-chip__ai-badge',
            confidence >= 0.9 && 'merchant-chip__ai-badge--high',
            confidence >= 0.7 && confidence < 0.9 && 'merchant-chip__ai-badge--medium',
            confidence < 0.7 && 'merchant-chip__ai-badge--low'
          )}
          title={`AI normalised with ${Math.round(confidence * 100)}% confidence`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88L5 0Z" />
          </svg>
        </div>
      )}
    </div>
  );
}
