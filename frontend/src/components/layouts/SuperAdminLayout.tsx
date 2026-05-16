import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Shield } from 'lucide-react';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import { useSettings } from '@/hooks/useSettings';

export default function SuperAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { companyName, logo, masterLogo } = useSettings();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block shrink-0 h-full">
                <SuperAdminSidebar />
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[100] flex lg:hidden">
                    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10 animate-in slide-in-from-left-4 duration-300">
                        <SuperAdminSidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                {logo || masterLogo ? (
                                    <img 
                                        src={logo || masterLogo || ''} 
                                        alt={companyName || 'Master identity'} 
                                        className="w-full h-full object-contain" 
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-white" />
                                    </div>
                                )}
                             </div>
                             <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
                                {companyName || 'Master identity'} <span className="text-indigo-600 font-medium text-sm ml-2 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">Authority Panel</span>
                             </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status bar if needed */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">System Live</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-slate-50/50" tabIndex={-1}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
                    
                    <div className="relative z-10 max-w-7xl mx-auto pb-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
