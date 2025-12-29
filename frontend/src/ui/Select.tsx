import type { SelectHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import { clsx } from '../utils/clsx';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      options,
      placeholder,
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
          'ui-select-wrapper',
          fullWidth && 'ui-select-wrapper--full',
          className
        )}
      >
        {label && (
          <label htmlFor={id} className="ui-select__label">
            {label}
          </label>
        )}
        <div
          className={clsx(
            'ui-select__container',
            `ui-select__container--${size}`,
            error && 'ui-select__container--error',
            disabled && 'ui-select__container--disabled'
          )}
        >
          <select
            ref={ref}
            id={id}
            className="ui-select"
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <span className="ui-select__chevron" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        {error && (
          <span id={errorId} className="ui-select__error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={hintId} className="ui-select__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
