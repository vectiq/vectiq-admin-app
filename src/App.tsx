import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Welcome from '@/pages/Welcome';
import Forecast from '@/pages/Forecast';
import Users from '@/pages/Users';

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
              index
              element={<Welcome />}
            />
            
            <Route
              path="forecast"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Forecast />
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