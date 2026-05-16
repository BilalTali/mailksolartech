import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import SuperAgentSidebar from '@/components/super-agent/SuperAgentSidebar';
import { useAuthStore } from '@/store/authStore';

export default function SuperAgentLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuthStore();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Skip to content link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg"
            >
                Skip to main content
            </a>

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-shrink-0">
                <SuperAgentSidebar />
            </div>

            {/* Mobile Sidebar Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-50 flex flex-col w-64">
                        <SuperAgentSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-4 right-4 z-50 text-white p-2 hover:bg-white/10 rounded-lg"
                        aria-label="Close sidebar"
                    >
                        <X size={24} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Bar */}
                <header className="bg-dark border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
                        aria-label="Open sidebar"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden lg:block">
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Business Development Manager Dashboard</span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            className="relative p-2 rounded-full text-white/60 hover:text-white transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                        </button>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
                            <p className="text-[10px] text-accent font-mono uppercase tracking-tighter">{user?.super_agent_code}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent/20">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page content with background pattern */}
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
