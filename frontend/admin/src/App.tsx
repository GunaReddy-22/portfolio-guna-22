import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, RequireAuth } from './lib/auth';
import { AdminLayout } from './layouts/AdminLayout';

// Features
import { Login } from './features/auth/Login';
import { Overview } from './features/dashboard/Overview';
import { PagesList } from './features/pages/PagesList';
import { PageBuilder } from './features/page-builder/PageBuilder';
import { ThemeStudio } from './features/theme/ThemeStudio';
import { MediaLibrary } from './features/media/MediaLibrary';
import { FormsManager } from './features/forms/FormsManager';
import { SubmissionsInbox } from './features/submissions/SubmissionsInbox';
import { RevisionHistory } from './features/revisions/RevisionHistory';
import { SiteSettings } from './features/settings/SiteSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  // 1. Strict hostname enforcement: gunasai.in/admin -> redirect to https://admin.gunasai.in
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  if ((hostname === 'gunasai.in' || hostname === 'www.gunasai.in') && pathname.startsWith('/admin')) {
    const cleanPath = pathname.replace(/^\/admin/, '') || '/login';
    window.location.replace(`https://admin.gunasai.in${cleanPath}${window.location.search}`);
    return null;
  }

  // 2. On admin.gunasai.in, normalize /admin/* to clean /* routes (e.g. /admin/login -> /login)
  if (hostname.startsWith('admin.') && pathname.startsWith('/admin')) {
    const cleanPath = pathname.replace(/^\/admin/, '') || '/login';
    window.location.replace(`${cleanPath}${window.location.search}`);
    return null;
  }

  const configuredBase = import.meta.env.VITE_BASE_PATH;
  const basename = configuredBase !== undefined ? (configuredBase === '/' ? '' : configuredBase.replace(/\/$/, '')) : '';

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Overview />} />
              <Route path="pages" element={<PagesList />} />
              <Route path="builder" element={<PageBuilder />} />
              <Route path="theme" element={<ThemeStudio />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="forms" element={<FormsManager />} />
              <Route path="submissions" element={<SubmissionsInbox />} />
              <Route path="revisions" element={<RevisionHistory />} />
              <Route path="settings" element={<SiteSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
