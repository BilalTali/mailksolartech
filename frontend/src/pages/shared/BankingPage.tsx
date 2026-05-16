import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Landmark, AlertTriangle, Filter, X, ChevronDown, Search, Download, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/axios';
import { useAuthStore } from '@/store/authStore';


export default function BankingPage() {
    const { role } = useAuthStore();
    const baseLink = role === 'super_agent' ? '/super-agent/leads' : role === 'agent' ? '/agent/leads' : '/enumerator/leads';

    const [bankFilter, setBankFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [search, setSearch] = useState('');
    const [applied, setApplied] = useState({ bank_name: '', status: '', date_from: '', date_to: '', search: '' });
    const [page, setPage] = useState(1);

    const { data: filterOpts } = useQuery({
        queryKey: ['banking-filter-options'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { banks: string[]; statuses: string[] } }>('/dashboard/banking-filter-options');
            return res.data.data;
        },
        staleTime: 300_000,
    });

    const qs = useMemo(() => {
        const p: Record<string, string> = { page: String(page), per_page: '15' };
        if (applied.bank_name) p.bank_name = applied.bank_name;
        if (applied.status) p.status = applied.status;
        if (applied.date_from) p.date_from = applied.date_from;
        if (applied.date_to) p.date_to = applied.date_to;
        if (applied.search) p.search = applied.search;
        return new URLSearchParams(p).toString();
    }, [applied, page]);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['banking-lead-table-full', qs],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: any }>(
                `/dashboard/banking-lead-table?${qs}`
            );
            return res.data.data;
        },
        staleTime: 60_000,
    });

    const hasActive = !!(applied.bank_name || applied.status || applied.date_from || applied.date_to || applied.search);

    const exportCsv = () => {
        if (!data?.data?.length) return;
        const h = 'Consumer Name,Consumer No.,Bank Name,Branch,Account,Status,Stage,Days in Status,Submitted';
        const rows = data.data.map((r: any) => `"${r.beneficiary_name}","${r.consumer_number || ''}","${r.beneficiary_bank_name || ''}","${r.beneficiary_bank_branch || ''}","${r.masked_account || ''}","${r.status_label}","${r.pipeline_stage}",${r.days_in_status},${new Date(r.created_at).toLocaleDateString('en-IN')}`);
        const blob = new Blob([[h, ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'banking_leads.csv'; a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="font-display font-black text-2xl text-slate-800 tracking-tight">Banking Status</h1>
                        <p className="text-sm text-slate-500">Track your leads through the banking and disbursement pipeline</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>
                    <button onClick={exportCsv} disabled={!data?.data?.length} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                        <Download className="w-4 h-4" /> Export Page CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Filters</span>
                    {hasActive && <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-600 rounded-full uppercase">Active</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="xl:col-span-2 relative">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Search Consumer</label>
                        <div className="relative">
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or Consumer No."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pl-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
                        <div className="relative">
                            <select value={bankFilter} onChange={e => setBankFilter(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40 pr-8">
                                <option value="">All Banks</option>
                                {filterOpts?.banks?.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                        <div className="relative">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40 pr-8">
                                <option value="">All Statuses</option>
                                {filterOpts?.statuses?.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Date From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Date To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
                    </div>
                </div>
                <div className="flex items-end gap-2 mt-3">
                    <button onClick={() => { setApplied({ bank_name: bankFilter, status: statusFilter, date_from: dateFrom, date_to: dateTo, search }); setPage(1); }}
                        className="bg-indigo-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 w-full sm:w-auto min-w-[120px]">
                        Apply Filters
                    </button>
                    {hasActive && (
                        <button onClick={() => { setBankFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); setApplied({ bank_name: '', status: '', date_from: '', date_to: '', search: '' }); setPage(1); }}
                            className="px-4 py-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 border border-rose-100 text-sm font-bold flex gap-2 items-center">
                            <X className="w-4 h-4" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-display font-black text-lg text-slate-800">Banking Leads</h2>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                    ) : !data?.data?.length ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                            <FileText className="w-10 h-10 opacity-30" />
                            <p className="font-semibold">No banking leads found matching your filters</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    {['Consumer', 'Bank Details', 'Status / Stage', 'Days in Status', 'Submitted', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.data.map((lead: any) => (
                                    <tr key={lead.ulid} className={`hover:bg-slate-50 transition-colors ${lead.is_stalled ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-800">{lead.beneficiary_name}</p>
                                            <p className="font-mono text-xs text-slate-500 mt-0.5">{lead.consumer_number || 'No Consumer No.'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-700">{lead.beneficiary_bank_name || '—'}</p>
                                            <div className="flex items-center gap-2 text-xs mt-0.5 text-slate-500">
                                                <span>{lead.beneficiary_bank_branch || 'No branch'}</span>
                                                <span>•</span>
                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{lead.masked_account || 'No A/C'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 mb-1">
                                                {lead.status_label}
                                            </span>
                                            <p className={`text-xs font-bold ${
                                                lead.pipeline_stage === 'Success' ? 'text-emerald-600' :
                                                lead.pipeline_stage === 'Rejected' ? 'text-rose-600' :
                                                'text-amber-600'
                                            }`}>{lead.pipeline_stage}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-1 rounded-lg text-xs ${
                                                lead.is_stalled ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {lead.is_stalled && <AlertTriangle className="w-3.5 h-3.5" />}
                                                {lead.days_in_status} days
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-medium">
                                            {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link to={`${baseLink}/${lead.ulid}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 mt-auto bg-slate-50/50">
                        <span className="text-sm text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-700">{data.from || 0}</span> to <span className="font-bold text-slate-700">{data.to || 0}</span> of <span className="font-bold text-slate-700">{data.total}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
                            <span className="px-3 py-1.5 text-sm font-bold text-slate-700">{page} / {data.last_page}</span>
                            <button disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
