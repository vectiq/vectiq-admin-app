import { Navigate, useLocation } from 'react-router-dom';
import { useUsers } from '@/lib/hooks/useUsers';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  teamManagerOnly?: boolean;
}

export function RoleProtectedRoute({ children, allowedRoles, teamManagerOnly }: RoleProtectedRouteProps) {
  const { currentUser, isLoading, isTeamManager } = useUsers();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role) || (teamManagerOnly && !isTeamManager)) {
    // If user is not authorized, redirect to timesheet
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}