import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, LayoutDashboard, List, PlusCircle, DollarSign, User, LogOut, BadgeCheck, Bell, FileText, Wallet, Landmark } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/services/auth.api';
import { enumeratorApi } from '@/services/enumerator.api';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';

const NAV = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', to: '/enumerator/dashboard' },
    { icon: <Landmark className="w-5 h-5" />, label: 'Banking', to: '/enumerator/banking' },
    { icon: <List className="w-5 h-5" />, label: 'My Leads', to: '/enumerator/leads' },
    { icon: <PlusCircle className="w-5 h-5" />, label: 'Submit Lead', to: '/enumerator/leads/new' },
    { icon: <DollarSign className="w-5 h-5" />, label: 'My Earnings', to: '/enumerator/commissions' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Withdraw Cash', to: '/enumerator/withdrawals' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', to: '/enumerator/notifications' },
    { icon: <FileText className="w-5 h-5" />, label: 'Resource Library', to: '/enumerator/documents' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', to: '/enumerator/profile' },
];

export default function EnumeratorSidebar({ onClose }: { onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const { companyName, logo } = useSettings();

    const { data: notificationsRes } = useQuery({
        queryKey: ['enumerator-notifications'],
        queryFn: () => enumeratorApi.getNotifications(),
        refetchInterval: 1000 * 60, // check every minute
    });

    const unreadCount = notificationsRes?.unread_count ?? 0;

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSettled: () => {
            clearAuth();
            navigate('/enumerator/login');
            toast.success('Logged out successfully');
        },
    });

    return (
        <aside
            className="w-64 h-full flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #065f46 0%, #047857 60%, #059669 100%)' }}
            aria-label="Enumerator Sidebar"
        >
            {/* Logo */}
            <div className="flex items-center gap-2 p-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? (
                        <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-300 to-emerald-600 flex items-center justify-center">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>
                <span className="font-display font-bold text-white leading-tight">{companyName}</span>
            </div>

            {/* Enumerator Profile */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
                        {(user as any)?.enumerator_id && (
                            <div className="flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3 text-emerald-300" />
                                <span className="text-emerald-300 text-xs font-mono">{(user as any).enumerator_id}</span>
                            </div>
                        )}
                        <span className="text-emerald-400 text-xs">Field Enumerator</span>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto" aria-label="Main Navigation">
                {NAV.filter(item => {
                    // Direct Enumerators (Admin/SA-created) hide earning management (settled directly)
                    const isDirect = (user as any)?.enumerator_creator_role === 'admin' || (user as any)?.enumerator_creator_role === 'super_agent';
                    if (isDirect && (item.to === '/enumerator/commissions' || item.to === '/enumerator/withdrawals')) {
                        return false;
                    }
                    return true;
                }).map((item) => {
                    const isActive = location.pathname === item.to || (item.to !== '/enumerator/dashboard' && location.pathname.startsWith(item.to));
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-white/20 text-white font-bold translate-x-1 shadow-inner' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                            <span className="flex-1">{item.label}</span>
                            {item.to === '/enumerator/notifications' && unreadCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse shadow-lg ring-2 ring-emerald-600 group-active:scale-90 transition-transform">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 transition-all"
                    aria-label="Logout from Enumerator Portal"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
