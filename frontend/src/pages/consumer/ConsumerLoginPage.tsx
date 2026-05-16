import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sun, Smartphone, KeyRound, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';
import { useAuthStore } from '@/store/authStore';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export default function ConsumerLoginPage() {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const { companyName, logo } = useAdminSettings();

    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const loginMutation = useMutation({
        mutationFn: () => api.post('/consumer/login', { mobile, password }),
        onSuccess: (res) => {
            const { token, user } = res.data.data;
            setAuth(token, user);
            toast.success(`Welcome, ${user.name}!`);
            navigate('/consumer/dashboard', { replace: true });
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Invalid credentials'),
    });

    const handleSubmit = () => {
        if (!mobile.trim() || !password.trim()) return;
        loginMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow-2xl shadow-amber-500/30 mb-4 overflow-hidden">
                        {logo
                            ? <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                            : <Sun className="w-8 h-8 text-white" />
                        }
                    </div>
                    <h1 className="text-2xl font-black text-white">{companyName}</h1>
                    <p className="text-indigo-200 text-sm mt-1">Consumer Portal — Track your solar project</p>
                </div>

                {/* Card */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl space-y-5"
                >
                    <div>
                        <h2 className="text-xl font-black text-white mb-1">Sign In</h2>
                        <p className="text-indigo-200 text-sm">Use your registered mobile number and the password provided by our team.</p>
                    </div>

                    <div className="space-y-3">
                        {/* Mobile */}
                        <div>
                            <label className="block text-xs font-bold text-indigo-200 mb-1.5">Mobile Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                                <input
                                    id="input-consumer-mobile"
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-indigo-200 mb-1.5">Password</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                                <input
                                    id="input-consumer-password"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Your portal password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition"
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        id="btn-consumer-login"
                        type="submit"
                        disabled={!mobile.trim() || !password.trim() || loginMutation.isPending}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-sm hover:opacity-90 transition shadow-lg shadow-orange-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loginMutation.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                            : <><LogIn className="w-4 h-4" /> Sign In to Portal</>
                        }
                    </button>
                </form>

                <p className="text-center text-xs text-indigo-400 mt-6">
                    Don't have your credentials? Contact your solar project team.
                </p>
            </div>
        </div>
    );
}
