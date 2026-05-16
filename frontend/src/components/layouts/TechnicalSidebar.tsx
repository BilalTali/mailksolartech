import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Sun, List, User, LayoutDashboard, Banknote } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/services/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

const NAV = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Portal Dashboard', to: '/technical/dashboard' },
    { icon: <List className="w-5 h-5" />, label: 'Assigned Leads', to: '/technical/leads' },
    { icon: <Banknote className="w-5 h-5" />, label: 'My Commissions', to: '/technical/commissions' },
    { icon: <User className="w-5 h-5" />, label: 'My Hub (Profile)', to: '/technical/profile' },
];

export default function TechnicalSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSettled: () => {
            clearAuth();
            navigate('/login');
            toast.success('Logged out successfully');
        },
    });

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const SidebarContent = () => (
        <aside className="sidebar w-64 h-full flex flex-col shadow-2xl relative z-[60]" aria-label="Technical Sidebar">
            {/* Logo */}
            <div className="flex items-center gap-2 p-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    <Sun className="w-5 h-5 text-white" />
                </div>
                <div className="font-display font-bold leading-tight">
                    <div className="text-white">Field Operations</div>
                    <div className="text-orange-400 text-[10px] uppercase tracking-widest leading-none mt-0.5">Technical Division</div>
                </div>
            </div>

            {/* Profile Summary */}
            <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 overflow-hidden shrink-0">
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Settings className="w-5 h-5 text-orange-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate leading-tight">{user?.name}</p>
                        <span className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                            {(user as any)?.technician_type || 'Technician'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto" aria-label="Main Navigation">
                {NAV.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                isActive 
                                    ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />}
                            <span className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} aria-hidden="true">
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm tracking-wide hover:bg-red-500/20 transition-all border border-red-500/10"
                    aria-label="Logout"
                >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Logout Account
                </button>
            </div>
        </aside>
    );

    return (
        <>
            <div className={`md:hidden fixed top-0 inset-x-0 h-14 bg-[#0a192f] border-b border-white/10 flex items-center justify-between px-4 z-[51]`}>
                <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-orange-400" />
                    <span className="font-display font-bold text-white text-sm tracking-wide">Operations</span>
                </div>
                <button 
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-1.5 -mr-1.5 bg-white/5 rounded-lg border border-white/10 text-white"
                >
                    <List />
                </button>
            </div>
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[59]" 
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 ease-spring md:relative md:translate-x-0 ${isMobileOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.5)]' : '-translate-x-full'}`}>
                <SidebarContent />
            </div>
        </>
    );
}
