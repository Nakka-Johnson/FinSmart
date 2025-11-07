import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface GuardProps {
  children: React.ReactNode;
}

export function Guard({ children }: GuardProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
