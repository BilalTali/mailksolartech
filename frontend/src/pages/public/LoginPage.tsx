import { Navigate } from 'react-router-dom';
import LoginLayout from '@/components/auth/LoginLayout';
import UnifiedLoginForm from '@/components/auth/UnifiedLoginForm';
import { useAuthStore } from '@/store/authStore';

function dashboardForRole(role: string): string {
    switch (role) {
        case 'super_admin': return '/super-admin/dashboard';
        case 'admin':       return '/admin/dashboard';
        case 'super_agent': return '/super-agent/dashboard';
        case 'agent':       return '/agent/dashboard';
        case 'enumerator':  return '/enumerator/dashboard';
        case 'operator':    return '/admin/leads';
        case 'field_technical_team': return '/technical';
        case 'consumer':    return '/consumer/dashboard';
        default:            return '/';
    }
}

export default function LoginPage() {
    const { token, role } = useAuthStore();

    // Already logged in → send to their dashboard immediately
    if (token && role) {
        return <Navigate to={dashboardForRole(role)} replace />;
    }

    return (
        <LoginLayout
            role="agent"
            title="Portal Login"
            subtitle="Enter your credentials — we'll take you to your dashboard"
        >
            <UnifiedLoginForm />
        </LoginLayout>
    );
}
