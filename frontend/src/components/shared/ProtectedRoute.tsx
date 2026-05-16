import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole: UserRole | UserRole[];
    loginPath: string;
}

export default function ProtectedRoute({ children, requiredRole, loginPath }: ProtectedRouteProps) {
    const { token, role } = useAuthStore();

    const allowed = Array.isArray(requiredRole)
        ? role !== null && requiredRole.includes(role)
        : role === requiredRole;

    if (!token || !allowed) {
        return <Navigate to={loginPath} replace />;
    }

    return <>{children}</>;
}
