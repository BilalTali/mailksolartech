import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import ConsumerSidebar from '@/components/consumer/ConsumerSidebar';

export default function ConsumerLayout() {
    const { user } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { companyName, logo } = useAdminSettings();

    // Guard: only allow consumer role
    if (!user) return <Navigate to="/consumer/login" replace />;
    if (user.role !== 'consumer') return <Navigate to="/" replace />;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block shrink-0">
                <ConsumerSidebar />
            </div>

            {/* Mobile Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10 h-full">
                        <ConsumerSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Bar (mobile) */}
                <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-40">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        {logo && (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                            </div>
                        )}
                        <span className="font-bold text-slate-800 tracking-wide text-sm truncate">
                            {companyName} <span className="text-[10px] text-amber-500 font-black uppercase ml-1">Portal</span>
                        </span>
                    </div>
                </header>

                {/* Content Area */}
                <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 relative" tabIndex={-1}>
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
                    <div className="relative z-10 max-w-5xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
