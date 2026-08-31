import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { queryClientInstance } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';
import { LoadingState } from '@/components/ui/loading-state';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import CalendarPage from '@/pages/CalendarPage';
import SearchPage from '@/pages/SearchPage';
import Login from '@/pages/Login';
import ChangePassword from '@/pages/ChangePassword';
import PageNotFound from '@/pages/PageNotFound';
import { InstallPWA } from '@/components/layout/InstallPWA';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

function AuthenticatedApp() {
  const { isLoadingAuth, isAuthenticated, authError, mustChangePassword } = useAuth();

  if (isLoadingAuth) {
    return <LoadingState label="Verificando acesso…" />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <Login />;
  }

  if (mustChangePassword) {
    return (
      <Routes>
        <Route path="/alterar-senha" element={<ChangePassword forced />} />
        <Route path="*" element={<Navigate to="/alterar-senha" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/alterar-senha" element={<ChangePassword />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthenticatedApp />
          </BrowserRouter>
          <Toaster />
          <InstallPWA />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
