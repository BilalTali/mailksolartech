import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileText, DollarSign, Bell, UserCircle,
    Power, PlusCircle, List, ChevronDown, Gift, Landmark
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { superAgentApi } from '@/services/superAgent.api';
import { DownloadIdCardButton } from '@/components/shared/DownloadIdCardButton';
import { useSettings } from '@/hooks/useSettings';

interface SuperAgentSidebarProps {
    onClose?: () => void;
}

export default function SuperAgentSidebar({ onClose }: SuperAgentSidebarProps) {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { companyName, logo } = useSettings();

    const isLeadActive = location.pathname.startsWith('/super-agent/leads');
    const [leadsOpen, setLeadsOpen] = useState(isLeadActive);

    const { data: notifData } = useQuery({
        queryKey: ['super-agent-notifications-count'],
        queryFn: () => superAgentApi.getNotifications(),
        staleTime: 30000,
        refetchInterval: 60000,
    });
    const unreadCount = notifData?.data?.unread_count ?? 0;

    const handleLogout = () => {
        clearAuth();
        navigate('/super-agent/login');
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive ? 'bg-orange-500 text-white shadow' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`;

    const subLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 pl-9 pr-3 py-2 rounded-lg text-xs font-medium transition-all group ${isActive ? 'bg-orange-500/80 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
        }`;

    return (
        <aside className="flex flex-col h-full bg-gradient-to-b from-slate-800 to-slate-900 text-white w-64" aria-label="Business Development Manager Sidebar">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-lg">
                        {logo ? (
                            <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                        ) : (
                            user?.profile_photo_url ? (
                                <img src={user.profile_photo_url} alt={`Profile photo of ${user.name}`} className="w-full h-full object-cover" />
                            ) : (
                                <span aria-hidden="true">☀</span>
                            )
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-white leading-tight">{companyName}</p>
                        <p className="text-xs text-slate-400">Business Development Manager Portal</p>
                    </div>
                </div>
            </div>

            {/* User badge */}
            <div className="px-6 py-4 border-b border-slate-700">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-white font-semibold truncate">{user?.name}</p>
                {user?.super_agent_code && (
                    <span className="mt-1 inline-block text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono" aria-label={`Manager Code: ${user.super_agent_code}`}>
                        {user.super_agent_code}
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
                <NavLink to="/super-agent/dashboard" onClick={onClose} className={navLinkClass}>
                    <LayoutDashboard size={18} aria-hidden="true" /> Dashboard
                </NavLink>

                <NavLink to="/super-agent/banking" onClick={onClose} className={navLinkClass}>
                    <Landmark size={18} aria-hidden="true" /> Banking
                </NavLink>

                <NavLink to="/super-agent/team" onClick={onClose} className={navLinkClass}>
                    <Users size={18} aria-hidden="true" /> My Team
                </NavLink>

                <NavLink to="/super-agent/enumerators" onClick={onClose} className={navLinkClass}>
                    <Users size={18} aria-hidden="true" /> Enumerators
                </NavLink>

                <NavLink to="/super-agent/offers" onClick={onClose} className={navLinkClass}>
                    <Gift size={18} aria-hidden="true" /> Team Milestone Prizes
                </NavLink>

                {/* Leads group (collapsible) */}
                <div>
                    <button
                        onClick={() => setLeadsOpen(o => !o)}
                        aria-expanded={leadsOpen}
                        aria-controls="leads-submenu"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isLeadActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <FileText size={18} aria-hidden="true" />
                        <span className="flex-1 text-left">Leads</span>
                        <ChevronDown
                            size={14}
                            aria-hidden="true"
                            className={`transition-transform duration-200 ${leadsOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {leadsOpen && (
                        <div id="leads-submenu" className="mt-1 space-y-0.5" role="group" aria-label="Leads Submenu">
                            <NavLink to="/super-agent/leads" end onClick={onClose} className={subLinkClass}>
                                <List size={13} aria-hidden="true" /> All Leads
                            </NavLink>
                            <NavLink to="/super-agent/leads/new" onClick={onClose} className={subLinkClass}>
                                <PlusCircle size={13} aria-hidden="true" /> Create Lead
                            </NavLink>
                        </div>
                    )}
                </div>

                <NavLink to="/super-agent/commissions" onClick={onClose} className={navLinkClass}>
                    <DollarSign size={18} aria-hidden="true" /> Commissions
                </NavLink>


                <NavLink to="/super-agent/documents" onClick={onClose} className={navLinkClass}>
                    <FileText size={18} aria-hidden="true" /> Resource Library
                </NavLink>

                <NavLink to="/super-agent/notifications" onClick={onClose} className={navLinkClass}>
                    <Bell size={18} aria-hidden="true" />
                    <span className="flex-1 text-left">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </NavLink>

                <NavLink to="/super-agent/profile" onClick={onClose} className={navLinkClass}>
                    <UserCircle size={18} aria-hidden="true" /> My Profile
                </NavLink>

                <div className="pt-2">
                    <DownloadIdCardButton className="w-full justify-start !shadow-none !bg-white/5 hover:!bg-white/10 !border !border-white/10" />
                </div>
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    aria-label="Logout from Manager Portal"
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all"
                >
                    <Power size={18} aria-hidden="true" />
                    Logout
                </button>
            </div>
        </aside>
    );
}

