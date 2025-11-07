import { useToast } from '@/hooks/useToast';

export function Toast() {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${toast.type}`}>
        <span className="toast-message">{toast.message}</span>
        <button onClick={hideToast} className="toast-close" aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}
