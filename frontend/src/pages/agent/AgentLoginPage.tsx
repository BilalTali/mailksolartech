import LoginLayout from '@/components/auth/LoginLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function AgentLoginPage() {
    return (
        <LoginLayout 
            role="agent"
            title="BDE Portal"
            subtitle="Business Development Executive Access"
        >
            <LoginForm 
                role="agent"
                redirectPath="/agent/dashboard"
            />
        </LoginLayout>
    );
}
