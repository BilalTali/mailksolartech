import LoginLayout from '@/components/auth/LoginLayout';
import UnifiedLoginForm from '@/components/auth/UnifiedLoginForm';

export default function SuperAdminLoginPage() {
    return (
        <LoginLayout 
            role="super_admin"
            title="Super Admin Control Center"
            subtitle="Master entry for platform-wide administration"
        >
            <UnifiedLoginForm />
        </LoginLayout>
    );
}
