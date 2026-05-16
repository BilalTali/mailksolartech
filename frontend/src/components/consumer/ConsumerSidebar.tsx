import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, Package, MessageSquare, Star, LogOut, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.api';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ConsumerSidebarProps {
    onClose?: () => void;
}

const NAV_LINKS = [
    { to: '/consumer/dashboard', label: 'Dashboard', icon: Home },
    { to: '/consumer/profile', label: 'Profile Settings', icon: User },
    { to: '/consumer/material', label: 'Material Delivery', icon: Package },
    { to: '/consumer/service', label: 'Service & Support', icon: MessageSquare },
    { to: '/consumer/feedback', label: 'Rate Your Team', icon: Star },
];

export default function ConsumerSidebar({ onClose }: ConsumerSidebarProps) {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSettled: () => {
            clearAuth();
            navigate('/consumer/login');
            toast.success('Logged out');
        },
    });

    return (
        <div className="flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800 text-slate-300">
            {/* Header */}
            <div className="p-4 lg:p-6 shrink-0 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <div className="font-black text-white text-lg tracking-wide">Portal</div>
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">Consumer</div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition lg:hidden">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* User Profile Snippet */}
            <div className="p-4 border-b border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Welcome</div>
                <div className="font-bold text-white text-sm truncate">{user?.name}</div>
                <div className="text-xs text-slate-400 truncate">{user?.mobile}</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {NAV_LINKS.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={onClose}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${isActive 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }
                        `}
                    >
                        <link.icon className={`w-4 h-4 shrink-0`} />
                        <span className="truncate">{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 shrink-0 border-t border-slate-800">
                <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Logout
                </button>
            </div>
        </div>
    );
}
