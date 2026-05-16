import LoginLayout from '@/components/auth/LoginLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function SuperAgentLoginPage() {
    return (
        <LoginLayout 
            role="super_agent"
            title="BDM Portal"
            subtitle="Business Development Manager Access"
        >
            <LoginForm 
                role="super_agent"
                redirectPath="/super-agent/dashboard"
            />
        </LoginLayout>
    );
}
