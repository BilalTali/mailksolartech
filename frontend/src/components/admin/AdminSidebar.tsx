import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Sun, LayoutDashboard, List, BarChart3,
    Settings, LogOut, Shield, Award, FileText, Bell,
    ClipboardCheck, Banknote, Wrench, ScanLine, Truck, Package, Landmark,
    DollarSign, Wallet, Database, Gift, Inbox, Users, Star
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/services/auth.api';
import { adminNotificationsApi } from '@/services/adminNotifications.api';
import { useAuthStore } from '@/store/authStore';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import { useAdminSettings } from '@/hooks/useAdminSettings';

const CORE_NAV = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: <Landmark className="w-5 h-5" />, label: 'Banking', to: '/admin/banking' },
    { icon: <List className="w-5 h-5" />, label: 'Leads', to: '/admin/leads' },
    { icon: <Wrench className="w-5 h-5 text-rose-500" />, label: 'Escalated Support', to: '/admin/monitor-leads' },
    { icon: <FileText className="w-5 h-5" />, label: 'View Documents', to: '/admin/lead-documents' },
    { icon: <FileText className="w-5 h-5" />, label: 'Agent Documents', to: '/admin/documents' },
    { icon: <Award className="w-5 h-5" />, label: 'Reward Winners', to: '/admin/media' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Reports', to: '/admin/reports' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', to: '/admin/notifications' },
];

const FINANCIAL_NAV = [
    { icon: <DollarSign className="w-5 h-5 text-emerald-500" />, label: 'Commissions', to: '/admin/commissions' },
    { icon: <Banknote className="w-5 h-5 text-indigo-500" />, label: 'Enterprise Ledger', to: '/admin/ledger' },
    { icon: <Wallet className="w-5 h-5 text-amber-500" />, label: 'Withdrawal Requests', to: '/admin/withdrawals' },
    { icon: <Database className="w-5 h-5 text-indigo-500" />, label: 'Master Points Overview', to: '/admin/points-master' },
    { icon: <Gift className="w-5 h-5 text-rose-500" />, label: 'Offer Approvals', to: '/admin/redemptions' },
    { icon: <Inbox className="w-5 h-5 text-sky-500" />, label: 'Absorbed Points', to: '/admin/absorptions' },
];

const TEAM_NAV = [
    { icon: <Star className="w-5 h-5 text-yellow-500" />, label: 'BDM (Super Agents)', to: '/admin/super-agents' },
    { icon: <Users className="w-5 h-5 text-teal-500" />, label: 'BDE (Agents)', to: '/admin/agents' },
    { icon: <Users className="w-5 h-5 text-purple-500" />, label: 'Enumerators', to: '/admin/enumerators' },
    { icon: <Shield className="w-5 h-5 text-blue-500" />, label: 'Operators', to: '/admin/operators' },
    { icon: <Settings className="w-5 h-5 text-rose-500" />, label: 'Field Technical Team', to: '/admin/technical-team' },
];

const QUEUE_NAV = [
    { icon: <ClipboardCheck className="w-4 h-4" />, label: 'Registration Queue', to: '/admin/queue/registration' },
    { icon: <Banknote className="w-4 h-4" />, label: 'Disbursement Queue', to: '/admin/queue/disbursement' },
    { icon: <Wrench className="w-4 h-4" />, label: 'Installation Queue', to: '/admin/queue/installation' },
    { icon: <ScanLine className="w-4 h-4" />, label: 'POD Queue', to: '/admin/queue/pod' },
    { icon: <Truck className="w-4 h-4" />, label: 'Dispatch', to: '/admin/dispatch' },
    { icon: <Package className="w-4 h-4" />, label: 'Inventory', to: '/admin/inventory' },
];

const OPERATOR_NAV = [
    { icon: <List className="w-5 h-5" />, label: 'Leads', to: '/admin/leads' },
    { icon: <Wrench className="w-5 h-5 text-rose-500" />, label: 'Escalated Support', to: '/admin/monitor-leads' },
];

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const { companyName, logo } = useAdminSettings();

    const isOperator = user?.role === 'operator';
    
    const { data: notifData } = useQuery({
        queryKey: ['admin-notifications-count'],
        queryFn: () => adminNotificationsApi.getNotifications(),
        staleTime: 30000,
        refetchInterval: 60000,
        enabled: !isOperator,
    });
    const unreadCount = notifData?.data?.unread_count ?? 0;
    
    const renderLink = (item: { icon: React.ReactNode; label: string; to: string }) => {
        const isActive = location.pathname.startsWith(item.to);
        return (
            <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`sidebar-item group ${isActive ? 'sidebar-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
            >
                <span aria-hidden="true">{item.icon}</span>
                <span className="text-sm flex-1">{item.label}</span>
                {item.to === '/admin/notifications' && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </Link>
        );
    };

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSettled: () => {
            clearAuth();
            navigate('/admin/login');
            toast.success('Logged out successfully');
        },
    });

    return (
        <aside className="sidebar w-64 h-full flex flex-col shadow-2xl" aria-label="Admin Sidebar">
            {/* Logo */}
            <div className="flex items-center gap-2 p-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0" aria-hidden="true">
                    {logo ? (
                        <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>
                <span className="font-display font-bold text-white leading-tight">{companyName}</span>
            </div>

            {/* Admin Profile */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-accent/20">
                        {user?.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt={`Profile photo of ${user.name}`} className="w-full h-full object-cover" />
                        ) : (
                            <Shield className="w-5 h-5 text-accent" aria-hidden="true" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
                        <span className="text-accent text-xs font-medium capitalize">{isOperator ? 'Operator' : 'Admin'}</span>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto" aria-label="Main Navigation">
                {isOperator ? (
                    <>
                        {OPERATOR_NAV.map(renderLink)}

                        {/* Pipeline & Inventory Queues Section */}
                        <div className="px-2 pt-4 pb-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Pipeline & Inventory</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        </div>
                        {QUEUE_NAV.map((item) => {
                            const isActive = location.pathname.startsWith(item.to);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
                                    className={`sidebar-item group text-sm ${isActive ? 'sidebar-item-active' : ''}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <span aria-hidden="true">{item.icon}</span>
                                    <span className="text-sm flex-1">{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {/* Core Features */}
                        {CORE_NAV.map(renderLink)}

                        {/* Financial Issues */}
                        <div className="px-2 pt-4 pb-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Financial Issues</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        </div>
                        {FINANCIAL_NAV.map(renderLink)}

                        {/* Roles & Teams */}
                        <div className="px-2 pt-4 pb-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Roles & Teams</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        </div>
                        {TEAM_NAV.map(renderLink)}

                        {/* Pipeline Queues Section */}
                        <div className="px-2 pt-4 pb-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Pipeline Queues</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        </div>
                        {QUEUE_NAV.map((item) => {
                            const isActive = location.pathname.startsWith(item.to);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
                                    className={`sidebar-item group text-sm ${isActive ? 'sidebar-item-active' : ''}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <span aria-hidden="true">{item.icon}</span>
                                    <span className="text-sm flex-1">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Configuration Section */}
                        <div className="px-2 pt-4 pb-1">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Configuration</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        </div>
                        <Link
                            to="/admin/settings"
                            onClick={onClose}
                            className={`sidebar-item group ${location.pathname.startsWith('/admin/settings') ? 'sidebar-item-active' : ''}`}
                        >
                            <span aria-hidden="true"><Settings className="w-5 h-5 text-indigo-400" /></span>
                            <span className="text-sm flex-1">Admin Settings</span>
                        </Link>
                    </>
                )}

                {!isOperator && (
                    <div className="px-3 mt-4">
                        <DownloadIdCardButton className="w-full justify-start !shadow-none !bg-white/5 hover:!bg-white/10 !border !border-white/10" />
                    </div>
                )}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => logoutMutation.mutate()}
                    className="sidebar-item w-full text-danger hover:text-danger hover:bg-danger/10"
                    aria-label="Logout from Admin Portal"
                >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
}
