import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import EnumeratorSidebar from '@/components/enumerator/EnumeratorSidebar';
import { useSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.api';
import { enumeratorApi } from '@/services/enumerator.api';

export default function EnumeratorLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { companyName, logo } = useSettings();
    const location = useLocation();
    const { setUser } = useAuthStore();

    const { data: notificationsRes } = useQuery({
        queryKey: ['enumerator-notifications'],
        queryFn: () => enumeratorApi.getNotifications(),
        refetchInterval: 1000 * 60,
    });

    const unreadCount = notificationsRes?.unread_count ?? 0;

    // Proactively fetch user profile if session exists but user state is missing or stale
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await authApi.me();
                if (res.success) {
                    setUser(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };

        // Always fetch on initial load of layout to ensure the profile is fresh
        fetchUser();
    }, [setUser]);

    return (
        <div className="flex h-screen bg-neutral-100 overflow-hidden font-display">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg"
            >
                Skip to main content
            </a>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block shrink-0">
                <EnumeratorSidebar />
            </div>

            {/* Mobile Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10">
                        <EnumeratorSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Global Top Bar */}
                <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-dark shadow-sm border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-white/80 hover:bg-white/10 rounded-xl transition-colors relative"
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark animate-pulse" />
                            )}
                        </button>
                        <div className="flex items-center gap-2">
                            {logo && (
                                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/5">
                                    <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                                </div>
                            )}
                            <span className="font-bold text-white lg:text-lg tracking-tight">
                                {companyName} <span className="hidden sm:inline text-accent font-medium ml-1 text-xs">Enumerator</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4">
                        <Link
                            to="/enumerator/commissions"
                            className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                                location.pathname === '/enumerator/commissions'
                                    ? 'bg-accent text-dark shadow-lg shadow-accent/20'
                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                            }`}
                        >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">My Earnings</span>
                            <span className="xs:hidden">Earnings</span>
                        </Link>
                    </div>
                </header>

                {/* Content Area with background pattern */}
                <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] relative" tabIndex={-1}>
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
                    <div className="relative z-10 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
