import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, LayoutDashboard, List, PlusCircle, DollarSign, Bell, User, Users, LogOut, BadgeCheck, FileText, Gift, Wallet, Landmark } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/services/auth.api';
import { agentsApi } from '@/services/agents.api';
import { useAuthStore } from '@/store/authStore';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import { useSettings } from '@/hooks/useSettings';

const NAV = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', to: '/agent/dashboard' },
    { icon: <Landmark className="w-5 h-5" />, label: 'Banking', to: '/agent/banking' },
    { icon: <Users className="w-5 h-5" />, label: 'Enumerators', to: '/agent/enumerators' },
    { icon: <List className="w-5 h-5" />, label: 'My Leads', to: '/agent/leads' },
    { icon: <Gift className="w-5 h-5" />, label: 'Milestone Prizes', to: '/agent/offers' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Withdraw Cash', to: '/agent/withdrawals' },
    { icon: <PlusCircle className="w-5 h-5" />, label: 'Submit Lead', to: '/agent/leads/new' },
    { icon: <FileText className="w-5 h-5" />, label: 'Resource Library', to: '/agent/documents' },
    { icon: <DollarSign className="w-5 h-5" />, label: 'My Earnings', to: '/agent/commissions' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', to: '/agent/notifications' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', to: '/agent/profile' },
];

export default function AgentSidebar({ onClose }: { onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const { companyName, logo } = useSettings();

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSettled: () => {
            clearAuth();
            navigate('/agent/login');
            toast.success('Logged out successfully');
        },
    });

    const { data: notifData } = useQuery({
        queryKey: ['agent-notifications-count'],
        queryFn: () => agentsApi.getNotifications(),
        staleTime: 30000,
        refetchInterval: 60000,
    });
    const unreadCount = notifData?.data?.unread_count ?? 0;

    return (
        <aside className="w-64 h-full flex flex-col bg-slate-50 border-r border-slate-200 shadow-xl" aria-label="Agent Sidebar">
            {/* Logo */}
            <div className="flex items-center gap-2 p-5 border-b border-slate-200 bg-white">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-sm" aria-hidden="true">
                    {logo ? (
                        <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>
                <span className="font-display font-black tracking-tight text-slate-800">{companyName}</span>
            </div>

            {/* Business Development Executive Profile */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt={`Profile photo of ${user.name}`} className="w-full h-full object-cover" />
                        ) : (
                            <span aria-label={user?.name?.charAt(0).toUpperCase()}>{user?.name?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-slate-800 font-bold text-sm bg-clip-text truncate">{user?.name}</p>
                        {user?.agent_id && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                <span className="text-emerald-600 font-semibold text-xs font-mono" aria-label={`Executive ID: ${user.agent_id}`}>{user.agent_id}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto bg-slate-50/50" aria-label="Main Navigation">
                {NAV.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-white shadow-sm border border-slate-200/60 text-sky-600 translate-x-1' 
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className={`${isActive ? 'text-sky-500 scale-110 drop-shadow-sm' : 'text-slate-400 group-hover:scale-110 transition-transform'}`} aria-hidden="true">
                                {item.icon}
                            </span>
                            <span className="text-sm flex-1">{item.label}</span>
                            {item.to.includes('/notifications') && unreadCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}

                <div className="px-3 mt-4">
                    <DownloadIdCardButton className="w-full justify-start !shadow-sm !bg-white hover:!bg-slate-50 !border !border-slate-200 !text-slate-700 !font-bold" />
                </div>
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-200 bg-white">
                <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                    aria-label="Logout from Agent Portal"
                >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm">Logout safely</span>
                </button>
            </div>
        </aside>
    );
}
