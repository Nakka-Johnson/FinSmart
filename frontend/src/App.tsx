import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from '@/components/Shell';
import { Guard } from '@/components/Guard';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { Budgets } from '@/pages/Budgets';
import { Categories } from '@/pages/Categories';
import { useAuthStore } from '@/store/auth';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  return (
    <BrowserRouter>
      {isAuthenticated && <Header />}
      <Toast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Shell>
              <Guard>
                <Dashboard />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Shell>
              <Guard>
                <Dashboard />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/transactions"
          element={
            <Shell>
              <Guard>
                <Transactions />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/budgets"
          element={
            <Shell>
              <Guard>
                <Budgets />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/categories"
          element={
            <Shell>
              <Guard>
                <Categories />
              </Guard>
            </Shell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
