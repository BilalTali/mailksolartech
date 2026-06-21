import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Shield, FileText, Monitor, LogOut, ShieldAlert,
    IndianRupee, Landmark, Sparkles, Package, Bell, Truck, Percent
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';

const NAV_CATEGORIES = [
    {
        title: 'Core Administration',
        items: [
            { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', to: '/super-admin/dashboard' },
            { icon: <ShieldAlert className="w-5 h-5" />, label: 'Manage Admins', to: '/super-admin/admins' },
        ]
    },
    {
        title: 'Financial Oversight',
        items: [
            { icon: <Landmark className="w-5 h-5" />, label: 'Banking', to: '/super-admin/banking' },
            { icon: <IndianRupee className="w-5 h-5" />, label: 'Commission Settlements', to: '/super-admin/commissions' },
            { icon: <Percent className="w-5 h-5" />, label: 'Commission Rates', to: '/super-admin/commission-rates' },
            { icon: <FileText className="w-5 h-5" />, label: 'Ledger Approvals', to: '/super-admin/ledger-workflow' },
        ]
    },
    {
        title: 'Operational Oversight',
        items: [
            { icon: <Package className="w-5 h-5" />, label: 'Inventory Management', to: '/super-admin/inventory' },
            { icon: <Truck className="w-5 h-5" />, label: 'Stock Logistics (SA)', to: '/super-admin/stock-logistics' },
            { icon: <Monitor className="w-5 h-5" />, label: 'Monitor BDMs (SA)', to: '/super-admin/monitor/super-agents' },
            { icon: <Users className="w-5 h-5" />, label: 'Monitor BDEs (Agent)', to: '/super-admin/monitor/agents' },
            { icon: <Users className="w-5 h-5" />, label: 'Monitor Enumerators', to: '/super-admin/monitor/enumerators' },
            { icon: <FileText className="w-5 h-5" />, label: 'Monitor Leads', to: '/super-admin/monitor/leads' },
        ]
    },
    {
        title: 'Authority & Governance',
        items: [
            { icon: <Shield className="w-5 h-5 text-indigo-400" />, label: 'Global Settings', to: '/super-admin/global-settings' },
            { icon: <Bell className="w-5 h-5 text-amber-400" />, label: 'System & Notifications', to: '/super-admin/system-support' },
        ]
    }
];

export default function SuperAdminSidebar({ onClose }: { onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const { companyName, logo, masterLogo } = useSettings();
    
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            clearAuth();
            navigate('/super-admin/login');
            toast.success('Logged out successfully');
        },
    });

    return (
        <aside className="sidebar flex flex-col w-72 h-full bg-slate-950 border-r border-slate-800/50 relative overflow-hidden shadow-2xl z-50">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>

            {/* Premium Header */}
            <div className="relative p-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0 group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                        <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/50 flex items-center justify-center overflow-hidden shadow-xl">
                            {logo || masterLogo ? (
                                <img 
                                    src={logo || masterLogo || ''} 
                                    alt={companyName || 'Master identity'} 
                                    className="w-full h-full object-contain p-1" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-display font-black text-slate-100 text-[13px] leading-tight uppercase tracking-widest truncate">
                            {companyName || 'Master Authority'}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em]">System Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar relative z-10 space-y-8" aria-label="Main Navigation">
                {NAV_CATEGORIES.map((category, catIdx) => (
                    <div key={`cat-${catIdx}`}>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">
                            {category.title}
                        </h4>
                        <div className="space-y-1">
                            {category.items.map((item, itemIdx) => {
                                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                                return (
                                    <Link
                                        key={`nav-${catIdx}-${itemIdx}`}
                                        to={item.to}
                                        onClick={onClose}
                                        className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 relative ${
                                            isActive 
                                            ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white font-bold border border-primary/20 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]' 
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-primary-light' : 'group-hover:scale-110 group-hover:text-slate-300'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm tracking-wide">{item.label}</span>
                                        {isActive && (
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent blur opacity-50 -z-10"></div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Premium Profile Footer */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-xl relative z-10">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-inner mb-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                            {user?.profile_photo_url ? (
                                <img src={user.profile_photo_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                            <Shield className="w-2 h-2 text-white" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-slate-200 font-bold text-sm truncate">{user?.name || 'Super Admin'}</p>
                        <span className="text-indigo-400 text-[10px] uppercase font-black tracking-widest block truncate">Root Access</span>
                    </div>
                </div>

                <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500 transition-all duration-300 font-bold group border border-rose-500/20 hover:border-rose-500 shadow-sm"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm tracking-wide">Secure Logout</span>
                </button>
            </div>
        </aside>
    );
}
