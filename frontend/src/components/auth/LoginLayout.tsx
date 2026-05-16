import React from 'react';
import { Sun, CheckCircle2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

interface LoginLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    role: 'super_admin' | 'admin' | 'super_agent' | 'agent' | 'enumerator';
}

export default function LoginLayout({ children, title, subtitle, role }: LoginLayoutProps) {
    const { companyName } = useSettings();

    const roleConfig = {
        super_admin: {
            gradient: 'from-[#1E1B4B] to-[#312E81]', // Deep Indigo
            accent: 'text-indigo-400',
            bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80',
            feature: 'Master Platform Oversight'
        },
        admin: {
            gradient: 'from-[#0A3D7A] to-[#1A5FA8]',
            accent: 'text-blue-400',
            bgImage: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80',
            feature: 'Centralized Control Center'
        },
        super_agent: {
            gradient: 'from-[#1E293B] to-[#C2410C]',
            accent: 'text-orange-400',
            bgImage: 'https://images.unsplash.com/photo-1454165833767-13300a215f3d?auto=format&fit=crop&q=80',
            feature: 'Team Performance & Strategy'
        },
        agent: {
            gradient: 'from-[#064E3B] to-[#059669]',
            accent: 'text-emerald-400',
            bgImage: 'https://images.unsplash.com/photo-1466611653911-954ff2131404?auto=format&fit=crop&q=80',
            feature: 'Lead Generation & Growth'
        },
        enumerator: {
            gradient: 'from-[#4C1D95] to-[#7C3AED]',
            accent: 'text-purple-400',
            bgImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80',
            feature: 'Field Surveys & Data Accuracy'
        }
    };

    const config = roleConfig[role];

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Branding & Features (Hidden on mobile) */}
            <div className={`hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white bg-gradient-to-br ${config.gradient}`}>
                <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                    <img 
                        src={config.bgImage} 
                        alt="Background" 
                        className="w-full h-full object-cover"
                    />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                            <Sun className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <span className="block font-display font-bold text-2xl tracking-tight">{companyName}</span>
                            <span className="text-white/60 text-xs uppercase tracking-widest font-medium">PM Surya Ghar Portal</span>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h2 className="text-4xl font-display font-bold leading-tight mb-6">
                            Illuminating Lives through <br />
                            <span className={config.accent}>Solar Innovation</span>
                        </h2>
                        <p className="text-white/70 text-lg leading-relaxed mb-8">
                            A unified ecosystem for seamless deployment of PM Surya Ghar Muft Bijli Yojana across J&K and Ladakh.
                        </p>

                        <div className="space-y-4">
                            {[
                                'Real-time performance tracking',
                                'Secure point-based incentive system',
                                config.feature,
                                'Instant digital verification letters'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className={`w-5 h-5 ${config.accent}`} />
                                    <span className="text-white/80 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-12 border-t border-white/10">
                    <p className="text-white/40 text-sm font-medium">
                        © {new Date().getFullYear()} Andleeb Cluster of Services. All rights reserved.
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo Only */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-2">
                             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                                <Sun className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-display font-bold text-2xl text-primary">{companyName}</span>
                        </div>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{title}</h1>
                        <p className="text-slate-500 font-medium">{subtitle}</p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-premium border border-slate-100 relative overflow-hidden">
                        {/* Top Accent Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradient}`}></div>
                        
                        {children}
                    </div>

                    <div className="mt-8 text-center text-slate-400 text-xs font-medium">
                        Secure 256-bit AES Encrypted Authentication
                    </div>
                </div>
            </div>
        </div>
    );
}
