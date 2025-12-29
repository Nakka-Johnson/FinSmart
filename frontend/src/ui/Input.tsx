import type { InputHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import { clsx } from '../utils/clsx';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id: providedId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div
        className={clsx(
          'ui-input-wrapper',
          fullWidth && 'ui-input-wrapper--full',
          className
        )}
      >
        {label && (
          <label htmlFor={id} className="ui-input__label">
            {label}
          </label>
        )}
        <div
          className={clsx(
            'ui-input__container',
            `ui-input__container--${size}`,
            error && 'ui-input__container--error',
            disabled && 'ui-input__container--disabled'
          )}
        >
          {leftIcon && (
            <span className="ui-input__icon ui-input__icon--left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={clsx(
              'ui-input',
              Boolean(leftIcon) && 'ui-input--with-left-icon',
              Boolean(rightIcon) && 'ui-input--with-right-icon'
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span className="ui-input__icon ui-input__icon--right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span id={errorId} className="ui-input__error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={hintId} className="ui-input__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
