import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import { HttpError } from '@/api/http';
import '../styles/Auth.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { setAuth } = useAuthStore();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const showToast = useToastStore(state => state.showToast);

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      console.log('[Login] Already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      console.log('[Login] Starting login for:', email);
      const authResponse = await authApi.login({ email, password });
      console.log('[Login] Auth response received:', { token: authResponse.token?.slice(0, 20) + '...' });
      const user = await authApi.me(authResponse.token);
      console.log('[Login] User fetched:', user);
      setAuth(authResponse.token, user, rememberMe);
      console.log('[Login] Auth set, navigating to /dashboard');
      showToast('Login successful!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('[Login] Error:', error);
      if (error instanceof HttpError) {
        showToast(error.message, 'error');
      } else {
        showToast('Login failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">FinSmart</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-large"
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
