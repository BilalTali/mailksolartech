import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, Sun } from 'lucide-react';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';

const schema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
});
type FormData = z.infer<typeof schema>;

export default function AgentSetPasswordPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { companyName } = useSettings();

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const setPasswordMutation = useMutation({
        mutationFn: authApi.setPassword,
        onSuccess: () => {
            toast.success(`Password set successfully! Welcome to ${companyName}.`);
            navigate('/agent/dashboard');
        },
        onError: () => toast.error('Failed to set password. Please try again.'),
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-neutral-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md">
                            <Sun className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-display font-bold text-2xl text-primary">{companyName}</span>
                    </div>
                    <h1 className="font-display font-bold text-2xl text-dark">Set Your Password</h1>
                    <p className="text-neutral-600 text-sm mt-2">
                        Welcome, <strong>{user?.name}</strong>! Please set your password to continue.
                    </p>
                </div>

                <div className="card shadow-xl">
                    <form onSubmit={handleSubmit((d) => setPasswordMutation.mutate(d))} className="flex flex-col gap-5">
                        <div>
                            <label className="label">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                <input
                                    type="password"
                                    className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="Min. 8 characters"
                                    {...register('password')}
                                />
                            </div>
                            {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
                        </div>
                        <div>
                            <label className="label">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                <input
                                    type="password"
                                    className={`input pl-10 ${errors.password_confirmation ? 'input-error' : ''}`}
                                    placeholder="Re-enter password"
                                    {...register('password_confirmation')}
                                />
                            </div>
                            {errors.password_confirmation && <p className="text-danger text-xs mt-1">{errors.password_confirmation.message}</p>}
                        </div>
                        <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={setPasswordMutation.isPending}>
                            {setPasswordMutation.isPending ? 'Setting password...' : 'Set Password & Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
