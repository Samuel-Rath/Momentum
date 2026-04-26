import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import AppShell from './components/layout/AppShell';

// Analytics is the heaviest page (recharts) and is rarely the user's first
// stop — load it on demand so the dashboard's first paint doesn't wait on
// chart code that may never be needed.
const Analytics = lazy(() => import('./pages/Analytics'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3">
      <div className="w-3.5 h-3.5 rounded-full border border-accent border-t-transparent animate-spin" />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate">
        Loading
      </span>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate">
          <div className="w-3.5 h-3.5 rounded-full border border-accent border-t-transparent animate-spin" />
          Loading
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="habits" element={<Habits />} />
            <Route
              path="analytics"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Analytics />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
