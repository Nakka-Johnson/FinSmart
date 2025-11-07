import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface ShellProps {
  children?: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <main className="main-content">{children || <Outlet />}</main>
    </div>
  );
}
