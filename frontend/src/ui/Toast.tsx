import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';
import { clsx } from '../utils/clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M6 10l3 3 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2L19 18H1L10 2Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M10 8v4M10 14v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M10 9v5M10 6v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function Toast({ id, type, title, description, duration = 5000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleDismiss]);

  return (
    <div
      className={clsx(
        'ui-toast',
        `ui-toast--${type}`,
        isVisible && !isLeaving && 'ui-toast--visible',
        isLeaving && 'ui-toast--leaving'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="ui-toast__icon">{icons[type]}</div>
      <div className="ui-toast__content">
        <div className="ui-toast__title">{title}</div>
        {description && <div className="ui-toast__description">{description}</div>}
      </div>
      <button
        type="button"
        className="ui-toast__close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({
  toasts,
  onDismiss,
  position = 'bottom-right',
}: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={clsx('ui-toast-container', `ui-toast-container--${position}`)}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}

// Toast hook for simple usage
let toastId = 0;

type ToastStore = {
  toasts: ToastData[];
  listeners: Set<() => void>;
  add: (toast: Omit<ToastData, 'id'>) => string;
  dismiss: (id: string) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ToastData[];
};

const toastStore: ToastStore = {
  toasts: [],
  listeners: new Set(),
  add(toast) {
    const id = `toast-${++toastId}`;
    this.toasts = [...this.toasts, { ...toast, id }];
    this.listeners.forEach((l) => l());
    return id;
  },
  dismiss(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.listeners.forEach((l) => l());
  },
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  getSnapshot() {
    return this.toasts;
  },
};

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const update = () => setToasts(toastStore.getSnapshot());
    return toastStore.subscribe(update);
  }, []);

  return {
    toasts,
    add: toastStore.add.bind(toastStore),
    dismiss: toastStore.dismiss.bind(toastStore),
    success: (title: string, description?: string) =>
      toastStore.add({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      toastStore.add({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      toastStore.add({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      toastStore.add({ type: 'info', title, description }),
  };
}

// Export toast methods for imperative usage
export const toast = {
  success: (title: string, description?: string) =>
    toastStore.add({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    toastStore.add({ type: 'error', title, description }),
  warning: (title: string, description?: string) =>
    toastStore.add({ type: 'warning', title, description }),
  info: (title: string, description?: string) =>
    toastStore.add({ type: 'info', title, description }),
  dismiss: (id: string) => toastStore.dismiss(id),
};
