import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Landmark, TrendingUp, AlertTriangle, XCircle, CheckCircle2, Filter, X, ChevronDown, BarChart3, Building2, Clock, Download, RefreshCw, ChevronsUpDown, ChevronUp, Info } from 'lucide-react';
import api from '@/services/axios';

interface BankRow {
    beneficiary_bank_name: string;
    ifsc_sample: string | null;
    total_leads: number;
    leads_submitted: number;
    leads_disbursed: number;
    leads_pending_gt7: number;
    leads_rejected: number;
    success_rate: number;
}
interface Summary {
    total_banks: number; total_leads: number; total_submitted: number;
    total_disbursed: number; total_pending_gt7: number; total_rejected: number;
}
type SortKey = keyof BankRow;

function KpiCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
    return (
        <div className={`bg-white rounded-2xl p-4 border-l-4 shadow-sm ${color}`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="font-display font-black text-2xl text-slate-800">{value}</p>
                </div>
            </div>
        </div>
    );
}

// Drill-down modal for bank-specific leads
function BankDrillModal({ bank, filter, onClose }: { bank: string; filter: string; onClose: () => void }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useQuery({
        queryKey: ['banking-lead-table', bank, filter, page],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { data: any[]; last_page: number; total: number } }>(
                `/dashboard/banking-lead-table?bank_name=${encodeURIComponent(bank)}&status_group=${filter}&page=${page}&per_page=15`
            );
            return res.data.data;
        },
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <h3 className="font-display font-black text-lg text-slate-800">{bank}</h3>
                        <p className="text-sm text-slate-500 capitalize">{filter.replace(/_/g, ' ')} leads</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                    ) : !data?.data?.length ? (
                        <div className="py-16 text-center text-slate-400"><Landmark className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No leads found</p></div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    {['Consumer', 'Consumer No.', 'Status', 'Stage', 'Days in Status', 'Submitted'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.data.map((lead: any) => (
                                    <tr key={lead.ulid} className={`hover:bg-slate-50 ${lead.is_stalled ? 'bg-amber-50/40' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-slate-800">{lead.beneficiary_name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{lead.consumer_number || '—'}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">{lead.status_label}</span></td>
                                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                            lead.pipeline_stage === 'Success' ? 'bg-emerald-100 text-emerald-700' :
                                            lead.pipeline_stage === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>{lead.pipeline_stage}</span></td>
                                        <td className="px-4 py-3 tabular-nums">
                                            <span className={`font-bold ${lead.is_stalled ? 'text-amber-600' : 'text-slate-600'}`}>
                                                {lead.days_in_status}d {lead.is_stalled ? '⚠️' : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(lead.created_at).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm">
                        <span className="text-slate-500">Total: {data.total}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold text-slate-600 disabled:opacity-40">Prev</button>
                            <span className="px-3 py-1.5 font-bold text-slate-800">{page} / {data.last_page}</span>
                            <button disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold text-slate-600 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminBankingPage() {
    const [bankFilter, setBankFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [applied, setApplied] = useState({ bank_name: '', date_from: '', date_to: '' });
    const [sortKey, setSortKey] = useState<SortKey>('total_leads');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [drillDown, setDrillDown] = useState<{ bank: string; filter: string } | null>(null);

    const { data: filterOpts } = useQuery({
        queryKey: ['banking-filter-options'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { banks: string[] } }>('/dashboard/banking-filter-options');
            return res.data.data;
        },
        staleTime: 300_000,
    });

    const qs = useMemo(() => {
        const p: Record<string, string> = {};
        if (applied.bank_name) p.bank_name = applied.bank_name;
        if (applied.date_from) p.date_from = applied.date_from;
        if (applied.date_to) p.date_to = applied.date_to;
        return new URLSearchParams(p).toString();
    }, [applied]);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['banking-bank-table', qs],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { summary: Summary; rows: BankRow[] } }>(
                `/dashboard/banking-bank-table${qs ? '?' + qs : ''}`
            );
            return res.data.data;
        },
        staleTime: 60_000,
    });

    const sortedRows = useMemo(() => {
        if (!data?.rows) return [];
        return [...data.rows].sort((a, b) => {
            const av = (a[sortKey] as number | string) ?? 0;
            const bv = (b[sortKey] as number | string) ?? 0;
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data?.rows, sortKey, sortDir]);

    const handleSort = (k: SortKey) => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } };
    const SIcon = ({ k }: { k: SortKey }) => sortKey !== k ? <ChevronsUpDown className="w-3 h-3 text-slate-300" /> : sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-500" /> : <ChevronDown className="w-3 h-3 text-indigo-500" />;

    const hasActive = !!(applied.bank_name || applied.date_from || applied.date_to);
    const s = data?.summary;

    const exportCsv = () => {
        if (!sortedRows.length) return;
        const h = 'Bank Name,IFSC,Submitted,Success,Pending >7d,Rejected,Total,Success%';
        const rows = sortedRows.map(r => `${r.beneficiary_bank_name},${r.ifsc_sample ?? ''},${r.leads_submitted},${r.leads_disbursed},${r.leads_pending_gt7},${r.leads_rejected},${r.total_leads},${r.success_rate}%`);
        const blob = new Blob([[h, ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'banking.csv'; a.click();
    };

    const COLS: { key: SortKey; label: string }[] = [
        { key: 'beneficiary_bank_name', label: 'Bank Name' },
        { key: 'ifsc_sample', label: 'IFSC' },
        { key: 'leads_submitted', label: 'Submitted' },
        { key: 'leads_disbursed', label: 'Success' },
        { key: 'leads_pending_gt7', label: 'Pending >7d' },
        { key: 'leads_rejected', label: 'Rejected' },
        { key: 'total_leads', label: 'Total' },
        { key: 'success_rate', label: 'Success %' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="font-display font-black text-2xl text-slate-800 tracking-tight">Banking Dashboard</h1>
                        <p className="text-sm text-slate-500">Bank-wise lead performance analysis</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>
                    <button onClick={exportCsv} disabled={!sortedRows.length} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiCard label="Banks" value={s?.total_banks ?? '—'} icon={<Building2 className="w-5 h-5 text-indigo-600" />} color="border-indigo-500" />
                <KpiCard label="Total Leads" value={s?.total_leads ?? '—'} icon={<BarChart3 className="w-5 h-5 text-slate-600" />} color="border-slate-400" />
                <KpiCard label="Submitted" value={s?.total_submitted ?? '—'} icon={<TrendingUp className="w-5 h-5 text-sky-600" />} color="border-sky-500" />
                <KpiCard label="Success" value={s?.total_disbursed ?? '—'} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="border-emerald-500" />
                <KpiCard label="Pending >7d" value={s?.total_pending_gt7 ?? '—'} icon={<Clock className="w-5 h-5 text-amber-600" />} color="border-amber-500" />
                <KpiCard label="Rejected" value={s?.total_rejected ?? '—'} icon={<XCircle className="w-5 h-5 text-rose-600" />} color="border-rose-500" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Filters</span>
                    {hasActive && <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-600 rounded-full uppercase">Active</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
                        <div className="relative">
                            <select id="bank-name-filter" value={bankFilter} onChange={e => setBankFilter(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40 pr-8">
                                <option value="">All Banks</option>
                                {filterOpts?.banks?.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Date From</label>
                        <input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Date To</label>
                        <input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
                    </div>
                    <div className="flex items-end gap-2 xl:col-span-2">
                        <button id="apply-filter" onClick={() => setApplied({ bank_name: bankFilter, date_from: dateFrom, date_to: dateTo })}
                            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700">Apply</button>
                        
                        {/* Quick Filters */}
                        <div className="flex gap-2 ml-2 border-l border-slate-200 pl-4">
                            <button onClick={() => { handleSort('success_rate'); setSortDir('desc'); }}
                                className="px-3 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-100 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <TrendingUp className="w-3.5 h-3.5" /> Top Success
                            </button>
                            <button onClick={() => { handleSort('leads_rejected'); setSortDir('desc'); }}
                                className="px-3 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <AlertTriangle className="w-3.5 h-3.5" /> Top Rejected
                            </button>
                        </div>

                        {hasActive && (
                            <button id="clear-filter" onClick={() => { setBankFilter(''); setDateFrom(''); setDateTo(''); setApplied({ bank_name: '', date_from: '', date_to: '' }); }}
                                className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 ml-auto" title="Clear filters">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <h2 className="font-display font-black text-lg text-slate-800">Bank Performance Table</h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                        <Info className="w-3.5 h-3.5" /><span>Click numbers to see individual leads</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                ) : !sortedRows.length ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                        <Landmark className="w-10 h-10 opacity-30" />
                        <p className="font-semibold">No banking data found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50">
                                    {COLS.map(col => (
                                        <th key={col.key} onClick={() => handleSort(col.key)}
                                            className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 whitespace-nowrap select-none">
                                            <div className="flex items-center gap-1">{col.label}<SIcon k={col.key} /></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedRows.map(row => {
                                    const rejRate = row.leads_submitted > 0 ? (row.leads_rejected / row.leads_submitted) * 100 : 0;
                                    return (
                                        <tr key={row.beneficiary_bank_name} className={`hover:bg-slate-50/80 ${rejRate > 30 ? 'bg-rose-50/30' : row.leads_pending_gt7 > 10 ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-4 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                                    </div>
                                                    {row.beneficiary_bank_name}
                                                    {rejRate > 30 && <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-100 text-rose-600 rounded-full">HIGH REJ.</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{row.ifsc_sample || '—'}</td>
                                            <td className="px-4 py-3.5">
                                                <button onClick={() => setDrillDown({ bank: row.beneficiary_bank_name, filter: 'submitted' })} className="font-bold text-sky-600 hover:underline tabular-nums">{row.leads_submitted}</button>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <button onClick={() => setDrillDown({ bank: row.beneficiary_bank_name, filter: 'disbursed' })} className="font-bold text-emerald-600 hover:underline tabular-nums">{row.leads_disbursed}</button>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <button onClick={() => setDrillDown({ bank: row.beneficiary_bank_name, filter: 'pending_gt7' })} className={`font-bold tabular-nums hover:underline ${row.leads_pending_gt7 > 10 ? 'text-amber-600' : 'text-amber-500'}`}>
                                                    {row.leads_pending_gt7}{row.leads_pending_gt7 > 10 ? ' ⚠️' : ''}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <button onClick={() => setDrillDown({ bank: row.beneficiary_bank_name, filter: 'rejected' })} className="font-bold text-rose-500 hover:underline tabular-nums">{row.leads_rejected}</button>
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-slate-700 tabular-nums">{row.total_leads}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${row.success_rate >= 70 ? 'bg-emerald-500' : row.success_rate >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${Math.min(row.success_rate, 100)}%` }} />
                                                    </div>
                                                    <span className={`font-black text-xs tabular-nums ${row.success_rate >= 70 ? 'text-emerald-600' : row.success_rate >= 40 ? 'text-amber-600' : 'text-rose-500'}`}>{row.success_rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                <tr className="font-black text-slate-800">
                                    <td className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500" colSpan={2}>Totals ({s?.total_banks ?? 0} banks)</td>
                                    <td className="px-4 py-3 text-sky-700 tabular-nums">{s?.total_submitted ?? 0}</td>
                                    <td className="px-4 py-3 text-emerald-700 tabular-nums">{s?.total_disbursed ?? 0}</td>
                                    <td className="px-4 py-3 text-amber-700 tabular-nums">{s?.total_pending_gt7 ?? 0}</td>
                                    <td className="px-4 py-3 text-rose-600 tabular-nums">{s?.total_rejected ?? 0}</td>
                                    <td className="px-4 py-3 tabular-nums">{s?.total_leads ?? 0}</td>
                                    <td className="px-4 py-3 text-indigo-600">
                                        {s && s.total_submitted > 0 ? `${((s.total_disbursed / s.total_submitted) * 100).toFixed(1)}%` : '—'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /><span>Rejection rate &gt;30%</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /><span>More than 10 leads pending &gt;7 days</span></div>
            </div>

            {drillDown && <BankDrillModal bank={drillDown.bank} filter={drillDown.filter} onClose={() => setDrillDown(null)} />}
        </div>
    );
}
