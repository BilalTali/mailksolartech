import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { companyName, logo } = useAdminSettings();

    return (
        <div className="flex h-screen bg-neutral-100 overflow-hidden">
            {/* Skip to content link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg"
            >
                Skip to main content
            </a>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block shrink-0">
                <AdminSidebar />
            </div>

            {/* Mobile Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10">
                        <AdminSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

                {/* Main */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {/* Top Bar (mobile) */}
                    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-dark shadow-sm border-b border-white/5">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-white/80 hover:bg-white/10 rounded-xl transition-colors"
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            {logo && (
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0">
                                    <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                                </div>
                            )}
                            <span className="font-display font-bold text-white tracking-wide">{companyName} <span className="text-accent text-xs font-medium ml-1">Admin</span></span>
                        </div>
                    </header>

                    {/* Content Area with subtle background pattern */}
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
