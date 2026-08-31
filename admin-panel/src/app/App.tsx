import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { SessionProvider } from '../features/session/session';
import { useSession } from '../features/session/useSession';

const DashboardPage = lazy(async () => {
  const module = await import('../pages/DashboardPage');
  return { default: module.DashboardPage };
});

const EventsPage = lazy(async () => {
  const module = await import('../pages/EventsPage');
  return { default: module.EventsPage };
});

const UsersPage = lazy(async () => {
  const module = await import('../pages/UsersPage');
  return { default: module.UsersPage };
});

const ComplaintsPage = lazy(async () => {
  const module = await import('../pages/ComplaintsPage');
  return { default: module.ComplaintsPage };
});

const AuditPage = lazy(async () => {
  const module = await import('../pages/AuditPage');
  return { default: module.AuditPage };
});

const SettingsPage = lazy(async () => {
  const module = await import('../pages/SettingsPage');
  return { default: module.SettingsPage };
});

const LoginPage = lazy(async () => {
  const module = await import('../pages/LoginPage');
  return { default: module.LoginPage };
});

const RouteFallback = ({ label = 'Loading workspace…' }: { label?: string }) => (
  <div className="boot-screen">{label}</div>
);

const renderLazyPage = (Page: ComponentType, label?: string) => (
  <Suspense fallback={<RouteFallback label={label} />}>
    <Page />
  </Suspense>
);

const AuthenticatedApp = () => {
  const { isAuthenticated, status } = useSession();

  if (status === 'booting') {
    return <div className="boot-screen">Restoring session…</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : renderLazyPage(LoginPage, 'Loading sign-in…')}
      />
      <Route path="/" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />}>
        <Route path="dashboard" element={renderLazyPage(DashboardPage)} />
        <Route path="events" element={renderLazyPage(EventsPage, 'Loading events…')} />
        <Route path="users" element={renderLazyPage(UsersPage)} />
        <Route path="complaints" element={renderLazyPage(ComplaintsPage)} />
        <Route path="audit" element={renderLazyPage(AuditPage)} />
        <Route path="settings" element={renderLazyPage(SettingsPage)} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AuthenticatedApp />
      </SessionProvider>
    </BrowserRouter>
  );
};
