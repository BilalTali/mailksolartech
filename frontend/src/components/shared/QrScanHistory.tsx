import React from 'react';
import { History, Globe, Monitor, MapPin, Calendar } from 'lucide-react';
import { agentsApi } from '@/services/agents.api';
import { adminSuperAgentApi } from '@/services/adminSuperAgent.api';
import { superAgentApi } from '@/services/superAgent.api';
import { format } from 'date-fns';

interface QrScanHistoryProps {
    userId: number;
    role: 'admin' | 'super_agent' | 'agent';
    isSelfView?: boolean;
}

const QrScanHistory: React.FC<QrScanHistoryProps> = ({ userId, role, isSelfView = false }) => {
    const [scans, setScans] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    const fetchScans = async () => {
        setLoading(true);
        try {
            let res;
            if (isSelfView) {
                if (role === 'super_agent') res = await superAgentApi.getQrScans({ page });
                else if (role === 'agent') res = await agentsApi.getSelfQrScans({ page });
                else res = await agentsApi.getQrScans(userId, { page });
            } else {
                if (role === 'super_agent') res = await adminSuperAgentApi.getQrScans(userId, { page });
                else res = await agentsApi.getQrScans(userId, { page });
            }

            if (res.success) {
                // Handle both paginated and direct array responses
                const data = res.data.data ? res.data.data : res.data;
                const lastPage = res.data.last_page ? res.data.last_page : 1;
                setScans(Array.isArray(data) ? data : []);
                setTotalPages(lastPage);
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to fetch scans', error);
            }
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchScans();
    }, [userId, page]);

    if (loading && page === 1) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-800/50 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (scans.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="bg-slate-900/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6 text-slate-700" />
                </div>
                <h4 className="text-slate-400 text-sm font-medium">No scan history yet</h4>
                <p className="text-slate-600 text-xs mt-1">When someone scans this ID card, it will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3.5 h-3.5" /> Recent Verification Activity
                </h3>
                <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    Showing latest {scans.length} scans
                </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-3">Timestamp / Date</th>
                            <th className="px-4 py-3">Location / IP</th>
                            <th className="px-4 py-3 hidden md:table-cell">Device Info</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {scans.map((scan) => (
                            <tr key={scan.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-orange-500/60" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-200">
                                                {format(new Date(scan.scanned_at), 'dd MMM yyyy')}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {format(new Date(scan.scanned_at), 'hh:mm:ss a')}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3 h-3 text-blue-500/60" />
                                        <div className="flex flex-col">
                                            <span className="font-mono text-slate-400">{scan.ip_address}</span>
                                            <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                                <MapPin className="w-2.5 h-2.5" /> Public Scan
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell max-w-xs overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-3 h-3 text-emerald-500/60" />
                                        <span className="text-[10px] text-slate-500 truncate" title={scan.user_agent}>
                                            {scan.user_agent}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 disabled:opacity-30 hover:bg-slate-800 h transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-[10px] text-slate-500 self-center">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default QrScanHistory;
