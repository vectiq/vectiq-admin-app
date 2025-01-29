import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import Login from '@/pages/Login';
<<<<<<< HEAD
import Processing from '@/pages/Processing';
import Forecast from '@/pages/Forecast';
import Bonuses from '@/pages/Bonuses';
=======
import TimeEntries from '@/pages/TimeEntries';
import Leave from '@/pages/Leave';
import Reports from '@/pages/Reports';
>>>>>>> 24f29c2e344e093b64de73e291d51fbf16e965f9
import Projects from '@/pages/Projects';
import Clients from '@/pages/Clients';
import Users from '@/pages/Users';
import Teams from '@/pages/Teams';
import Admin from '@/pages/Admin';

const queryClient = new QueryClient()

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
<<<<<<< HEAD
              path="bonuses"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Bonuses />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="processing"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Processing />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="forecast"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Forecast />
=======
              path="reports"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Reports />
>>>>>>> 24f29c2e344e093b64de73e291d51fbf16e965f9
                </RoleProtectedRoute>
              }
            />
            <Route
              path="projects"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Projects />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="clients"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Clients />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="teams"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Teams />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Admin />
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* Catch all route - must be last */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}