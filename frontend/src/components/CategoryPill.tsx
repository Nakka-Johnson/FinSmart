import type { ReactNode } from 'react';
import { ConfidenceBadge } from '../ui/Badge';
import './CategoryPill.css';
import { clsx } from '../utils/clsx';

const categoryIcons: Record<string, ReactNode> = {
  Groceries: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 11H3a1 1 0 0 1-1-1V5l4-4 4 4v5a1 1 0 0 1-1 1z" />
    </svg>
  ),
  Dining: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 1v10M8 1v4c0 1-1 2-2 2M8 7v4" strokeLinecap="round" />
    </svg>
  ),
  Transport: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="10" height="6" rx="1" />
      <circle cx="3" cy="10" r="1" />
      <circle cx="9" cy="10" r="1" />
    </svg>
  ),
  Shopping: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 1L3 4H9L8 1M3 4l-.5 7h7L9 4H3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Entertainment: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="5" />
      <path d="M5 4v4l3-2-3-2z" fill="currentColor" stroke="none" />
    </svg>
  ),
  'Bills & Utilities': (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 1v2M6 9v2M3 6H1M11 6H9M3.5 3.5l1 1M7.5 7.5l1 1M3.5 8.5l1-1M7.5 4.5l1-1" strokeLinecap="round" />
    </svg>
  ),
  Health: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2v8M2 6h8" strokeLinecap="round" />
    </svg>
  ),
  Travel: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 1l5 5-5 5-5-5 5-5z" />
    </svg>
  ),
  Other: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="2" cy="6" r="1" fill="currentColor" />
      <circle cx="10" cy="6" r="1" fill="currentColor" />
    </svg>
  ),
};

const categoryColors: Record<string, string> = {
  Groceries: 'emerald',
  Dining: 'amber',
  Transport: 'blue',
  Shopping: 'violet',
  Entertainment: 'rose',
  'Bills & Utilities': 'slate',
  Health: 'emerald',
  Travel: 'blue',
  Other: 'slate',
};

interface CategoryPillProps {
  category: string;
  confidence?: number;
  onClick?: () => void;
  showConfidence?: boolean;
  className?: string;
}

export function CategoryPill({
  category,
  confidence,
  onClick,
  showConfidence = true,
  className,
}: CategoryPillProps) {
  const icon = categoryIcons[category] || categoryIcons.Other;
  const colorScheme = categoryColors[category] || 'slate';

  return (
    <button
      type="button"
      className={clsx(
        'category-pill',
        `category-pill--${colorScheme}`,
        onClick && 'category-pill--clickable',
        className
      )}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="category-pill__icon">{icon}</span>
      <span className="category-pill__label">{category}</span>
      {showConfidence && confidence !== undefined && (
        <ConfidenceBadge confidence={confidence} size="sm" />
      )}
      {onClick && (
        <span className="category-pill__why" title="Why this category?">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="5" cy="5" r="4" />
            <path d="M5 7V5M5 3h.01" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
