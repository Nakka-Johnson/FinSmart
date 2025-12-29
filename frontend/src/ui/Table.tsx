import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import './Table.css';
import { clsx } from '../utils/clsx';

export interface TableProps extends ComponentPropsWithoutRef<'table'> {
  children: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export function Table({
  children,
  striped = false,
  hoverable = true,
  compact = false,
  className,
  ...props
}: TableProps) {
  return (
    <div className="ui-table-container">
      <table
        className={clsx(
          'ui-table',
          striped && 'ui-table--striped',
          hoverable && 'ui-table--hoverable',
          compact && 'ui-table--compact',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export interface TableHeaderProps extends ComponentPropsWithoutRef<'thead'> {
  children: ReactNode;
}

export function TableHeader({ children, className, ...props }: TableHeaderProps) {
  return (
    <thead className={clsx('ui-table__header', className)} {...props}>
      {children}
    </thead>
  );
}

export interface TableBodyProps extends ComponentPropsWithoutRef<'tbody'> {
  children: ReactNode;
}

export function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <tbody className={clsx('ui-table__body', className)} {...props}>
      {children}
    </tbody>
  );
}

export interface TableRowProps extends ComponentPropsWithoutRef<'tr'> {
  children: ReactNode;
  selected?: boolean;
}

export function TableRow({ children, selected, className, ...props }: TableRowProps) {
  return (
    <tr
      className={clsx('ui-table__row', selected && 'ui-table__row--selected', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export interface TableHeadProps extends ComponentPropsWithoutRef<'th'> {
  children?: ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
}

export function TableHead({
  children,
  sortable,
  sortDirection,
  onSort,
  align = 'left',
  className,
  ...props
}: TableHeadProps) {
  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && sortable && onSort) {
      e.preventDefault();
      onSort();
    }
  };

  return (
    <th
      className={clsx(
        'ui-table__head',
        `ui-table__head--${align}`,
        sortable && 'ui-table__head--sortable',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={sortable ? 0 : undefined}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : undefined
      }
      {...props}
    >
      <span className="ui-table__head-content">
        {children}
        {sortable && (
          <span className="ui-table__sort-icon" aria-hidden="true">
            {sortDirection === 'asc' ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 3L10 8H2L6 3Z" />
              </svg>
            ) : sortDirection === 'desc' ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9L2 4H10L6 9Z" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.3">
                <path d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10Z" />
              </svg>
            )}
          </span>
        )}
      </span>
    </th>
  );
}

export interface TableCellProps extends ComponentPropsWithoutRef<'td'> {
  children?: ReactNode;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
}

export function TableCell({
  children,
  align = 'left',
  numeric,
  className,
  ...props
}: TableCellProps) {
  return (
    <td
      className={clsx(
        'ui-table__cell',
        `ui-table__cell--${align}`,
        numeric && 'ui-table__cell--numeric',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/* Empty state component */
export interface TableEmptyProps {
  children?: ReactNode;
  icon?: ReactNode;
  title?: string;
  description?: string;
  colSpan?: number;
}

export function TableEmpty({
  children,
  icon,
  title = 'No data',
  description,
  colSpan = 100,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="ui-table__empty">
        <div className="ui-table__empty-content">
          {icon && <div className="ui-table__empty-icon">{icon}</div>}
          <div className="ui-table__empty-title">{title}</div>
          {description && <div className="ui-table__empty-description">{description}</div>}
          {children}
        </div>
      </td>
    </tr>
  );
}
