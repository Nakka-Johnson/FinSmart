import { useEffect, useRef, type ReactNode } from 'react';
import './Modal.css';
import { clsx } from '../utils/clsx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = 'md',
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, closeOnEscape]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnOverlayClick && e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={clsx('ui-modal', `ui-modal--${size}`, className)}
      onClick={handleOverlayClick}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div className="ui-modal__content">
        {(title || showCloseButton) && (
          <div className="ui-modal__header">
            {title && (
              <h2 id="modal-title" className="ui-modal__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="ui-modal__close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            )}
          </div>
        )}
        {description && (
          <p id="modal-description" className="ui-modal__description">
            {description}
          </p>
        )}
        <div className="ui-modal__body">{children}</div>
      </div>
    </dialog>
  );
}

/* Modal subcomponents for flexible composition */
export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return <div className={clsx('ui-modal__header', className)}>{children}</div>;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={clsx('ui-modal__body', className)}>{children}</div>;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={clsx('ui-modal__footer', className)}>{children}</div>;
}
