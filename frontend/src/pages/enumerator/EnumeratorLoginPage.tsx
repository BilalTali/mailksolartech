import LoginLayout from '@/components/auth/LoginLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function EnumeratorLoginPage() {
    return (
        <LoginLayout 
            role="enumerator"
            title="Field Enumerator Portal"
            subtitle="Secure access for survey and data collection"
        >
            <LoginForm 
                role="enumerator"
                redirectPath="/enumerator/dashboard"
            />
        </LoginLayout>
    );
}
