import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from '../utils/clsx';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'ui-button',
          `ui-button--${variant}`,
          `ui-button--${size}`,
          fullWidth && 'ui-button--full',
          loading && 'ui-button--loading',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="ui-button__spinner" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          </span>
        )}
        {icon && iconPosition === 'left' && !loading && (
          <span className="ui-button__icon">{icon}</span>
        )}
        <span className="ui-button__text">{children}</span>
        {icon && iconPosition === 'right' && !loading && (
          <span className="ui-button__icon">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
