import { type CSSProperties } from 'react';
import './Skeleton.css';
import { clsx } from '../utils/clsx';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  style?: CSSProperties;
}

export function Skeleton({
  className,
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  style,
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'ui-skeleton',
        `ui-skeleton--${variant}`,
        animation !== 'none' && `ui-skeleton--${animation}`,
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/* Preset skeleton components */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={clsx('ui-skeleton-text', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('ui-skeleton-card', className)}>
      <Skeleton variant="rectangular" height={160} />
      <div className="ui-skeleton-card__content">
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonButton({
  width = 100,
  height = 36,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      className={className}
    />
  );
}

export function SkeletonTableRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={clsx('ui-skeleton-table-row', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" />
      ))}
    </div>
  );
}

export function SkeletonChart({
  height = 200,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={clsx('ui-skeleton-chart', className)} style={{ height }}>
      <div className="ui-skeleton-chart__bars">
        {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="100%"
            height={`${h}%`}
          />
        ))}
      </div>
    </div>
  );
}
