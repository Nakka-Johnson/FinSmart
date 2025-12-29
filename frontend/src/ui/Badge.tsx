import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from '../utils/clsx';
import './Badge.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'ui-badge',
          `ui-badge--${variant}`,
          `ui-badge--${size}`,
          dot && 'ui-badge--dot',
          className
        )}
        {...props}
      >
        {dot && <span className="ui-badge__dot" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/* Confidence Badge - specifically for ML predictions */
export interface ConfidenceBadgeProps extends Omit<BadgeProps, 'variant'> {
  confidence: number; // 0-1
}

export function ConfidenceBadge({ confidence, ...props }: ConfidenceBadgeProps) {
  const variant = confidence >= 0.8 ? 'success' : confidence >= 0.5 ? 'warning' : 'danger';
  const percentage = Math.round(confidence * 100);

  return (
    <Badge variant={variant} {...props}>
      {percentage}%
    </Badge>
  );
}
