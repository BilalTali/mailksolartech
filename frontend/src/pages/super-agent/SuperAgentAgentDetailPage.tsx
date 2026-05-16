 import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { superAgentApi } from '@/services/superAgent.api';
import { formatCurrency } from '@/utils/formatters';

export default function SuperAgentAgentDetailPage() {
    const { agentId } = useParams<{ agentId: string }>();

    const { data, isLoading } = useQuery({
        queryKey: ['sa-agent-detail', agentId],
        queryFn: () => superAgentApi.getAgentDetail(Number(agentId)),
        enabled: !!agentId,
    });

    const agent = data?.data;
    const stats = agent?.stats ?? {};

    if (isLoading) return <div className="py-16 text-center text-slate-400">Loading agent details...</div>;
    if (!agent) return <div className="py-16 text-center text-slate-400">Business Development Executive not found.</div>;

    return (
        <div className="space-y-6">
            <Link to="/super-agent/team" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
                <ArrowLeft size={16} /> Back to Team
            </Link>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{agent.name}</h1>
                        <p className="text-sm text-slate-500 font-mono mt-0.5">{agent.agent_id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{agent.status}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 text-sm">
                    <div><p className="text-xs text-slate-400">Mobile</p><p className="font-medium">{agent.mobile}</p></div>
                    <div><p className="text-xs text-slate-400">District</p><p className="font-medium">{agent.district}</p></div>
                    <div><p className="text-xs text-slate-400">State</p><p className="font-medium">{agent.state}</p></div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Leads', value: stats.total_leads ?? 0 },
                    { label: 'Installed', value: stats.installed ?? 0 },
                    { label: 'Commission Earned', value: formatCurrency(stats.commission_earned ?? 0) },
                    { label: 'Commission Pending', value: formatCurrency(stats.commission_pending ?? 0) },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                ℹ️ This is a read-only view. Contact admin to modify agent details or manage commissions.
            </div>
        </div>
    );
}
