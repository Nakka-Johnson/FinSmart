import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PremiumShell } from '@/components/PremiumShell';
import { Guard } from '@/components/Guard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { DashboardV2 } from '@/pages/DashboardV2';
import { Transactions } from '@/pages/Transactions';
import { Budgets } from '@/pages/Budgets';
import { Categories } from '@/pages/Categories';
import { InsightsPage } from '@/pages/InsightsPage';
import { CSVImportPage } from '@/pages/CSVImportPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import { set401Handler } from '@/api/http';
import { initializeTheme } from '@/hooks/useTheme';

// Initialize theme on load to prevent flash
initializeTheme();

function AppContent() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const showToast = useToastStore(state => state.showToast);

  useEffect(() => {
    // Set up global 401 handler
    set401Handler(() => {
      clearAuth();
      showToast('Session expired. Please log in again.', 'error');
      navigate('/login', { replace: true });
    });
  }, [navigate, clearAuth, showToast]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Guard>
            <PremiumShell>
              <DashboardV2 />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Guard>
            <PremiumShell>
              <DashboardV2 />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/transactions"
        element={
          <Guard>
            <PremiumShell>
              <Transactions />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/budgets"
        element={
          <Guard>
            <PremiumShell>
              <Budgets />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/categories"
        element={
          <Guard>
            <PremiumShell>
              <Categories />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/insights"
        element={
          <Guard>
            <PremiumShell>
              <InsightsPage />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/import"
        element={
          <Guard>
            <PremiumShell>
              <CSVImportPage />
            </PremiumShell>
          </Guard>
        }
      />
      <Route
        path="/onboarding"
        element={
          <Guard>
            <OnboardingPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
