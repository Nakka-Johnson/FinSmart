import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface GuardProps {
  children: React.ReactNode;
}

export function Guard({ children }: GuardProps) {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  console.log('[Guard] Checking auth:', { hasToken: !!token, hasUser: !!user });

  if (!token || !user) {
    console.log('[Guard] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[Guard] Authenticated, rendering children');
  return <>{children}</>;
}
