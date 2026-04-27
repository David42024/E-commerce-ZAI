import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: Props) => {
  const { accessToken, usuario } = useAuthStore();
  const location = useLocation();
  
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    const roles = usuario?.roles || [];
    const isStaff = roles.some(role => ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role));
    if (!isStaff) {
      return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};