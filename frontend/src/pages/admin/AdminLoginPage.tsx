import LoginLayout from '@/components/auth/LoginLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function AdminLoginPage() {
    return (
        <LoginLayout 
            role="admin"
            title="Administrator Portal"
            subtitle="Secure access for system administrators"
        >
            <LoginForm 
                role="admin"
                redirectPath="/admin"
            />
        </LoginLayout>
    );
}
