import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AgentSidebar from '@/components/agent/AgentSidebar';
import { useSettings } from '@/hooks/useSettings';

export default function AgentLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { companyName, logo } = useSettings();

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
                <AgentSidebar />
            </div>

            {/* Mobile Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10">
                        <AgentSidebar onClose={() => setSidebarOpen(false)} />
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
                        <span className="font-display font-bold text-slate-800 tracking-wide">
                            {companyName} <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase ml-1">BDE</span>
                        </span>
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
