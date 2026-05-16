import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { ProfitLedgerRow, ProfitLedgerTotals } from '@/types';
import {
    Download, ChevronLeft, ChevronRight,
    FileText, TrendingUp, TrendingDown, ArrowDownRight,
    Users, Wrench, IndianRupee, Edit2, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const parseCapacity = (cap: string | number | null | undefined): number => {
    if (!cap) return 0;
    if (typeof cap === 'number') return cap;
    const match = cap.toString().match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
};

const ROLE_LABELS: Record<string, string> = {
    agent: 'Agent',
    enumerator: 'Enum',
    super_agent: 'BDM',
};

const ROLE_COLORS: Record<string, string> = {
    agent: 'bg-blue-100 text-blue-700',
    enumerator: 'bg-purple-100 text-purple-700',
    super_agent: 'bg-orange-100 text-orange-700',
};

const CHAIN_LABELS: Record<string, string> = {
    SURVEYOR: 'Surveyor',
    INSTALLER: 'Installer',
    WORKER: 'Worker',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function RowTypeBadge({ type }: { type: ProfitLedgerRow['row_type'] }) {
    if (type === 'lead') return (
        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
            <FileText className="w-2.5 h-2.5" /> Lead
        </span>
    );
    if (type === 'ledger_credit') return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
            <TrendingUp className="w-2.5 h-2.5" /> Credit
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
            <TrendingDown className="w-2.5 h-2.5" /> Expense
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'paid' || status === 'settled') {
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest">{status}</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 uppercase tracking-widest">Unpaid</span>;
}


// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProfitLedgerTable({ role, api }: { role: string; api: any }) {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [editRevenueModal, setEditRevenueModal] = useState<{ ulid: string; capacity: number; currentRevenue: number; name: string } | null>(null);
    const [commissionPerKw, setCommissionPerKw] = useState<number | string>('');

    const updateRevenueMut = useMutation({
        mutationFn: async ({ ulid, revenue }: { ulid: string, revenue: number }) => {
            return api.updateSystemRevenue(ulid, { lead_revenue: revenue });
        },
        onSuccess: () => {
            toast.success('System Revenue updated successfully!');
            qc.invalidateQueries({ queryKey: [`${role}-profit-ledger`] });
            qc.invalidateQueries({ queryKey: ['super-admin-commissions-summary'] });
            setEditRevenueModal(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update system revenue');
        }
    });

    const { data, isLoading } = useQuery({
        queryKey: [`${role}-profit-ledger`, page, startDate, endDate],
        queryFn: () => api.getProfitLedger({ page, start_date: startDate, end_date: endDate }),
    });

    const rows: ProfitLedgerRow[] = data?.data?.data ?? [];
    const meta = data?.data?.meta;
    const totals: ProfitLedgerTotals | undefined = data?.data?.totals;
    const lastPage = meta?.last_page ?? 1;

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.exportProfitLedger({ start_date: startDate, end_date: endDate });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `profit_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('CSV downloaded successfully');
        } catch {
            toast.error('Failed to export. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Profit Ledger</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Every financial event — lead commissions, downline payouts, tech fees & enterprise expenses
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="bg-transparent text-[10px] font-black uppercase text-slate-600 outline-none px-2 py-1"
                        />
                        <span className="text-slate-300 font-bold">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="bg-transparent text-[10px] font-black uppercase text-slate-600 outline-none px-2 py-1"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-700 px-2"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>

                    <button
                        id="profit-ledger-export-btn"
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {totals && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: role === 'super_admin' ? 'System Revenue' : (role === 'admin' ? 'Received from SA' : (role === 'super_agent' ? 'Received from Admin' : 'Received')), value: totals.total_received_from_sa, icon: IndianRupee, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', show: true },
                        { label: 'Ledger Credits', value: totals.total_ledger_credits, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', show: role === 'admin' },
                        { label: 'Paid to Downlines', value: totals.total_downlines, icon: Users, color: 'text-orange-600 bg-orange-50 border-orange-100', show: role !== 'enumerator' },
                        { label: 'Tech Team', value: totals.total_tech, icon: Wrench, color: 'text-teal-600 bg-teal-50 border-teal-100', show: role === 'admin' },
                        { label: 'Enterprise Expenses', value: totals.total_enterprise_exp, icon: ArrowDownRight, color: 'text-rose-600 bg-rose-50 border-rose-100', show: role === 'admin' },
                        {
                            label: 'Net Balance',
                            value: totals.grand_net_profit,
                            icon: totals.grand_net_profit >= 0 ? TrendingUp : TrendingDown,
                            color: totals.grand_net_profit >= 0 ? 'text-emerald-700 bg-emerald-600 border-emerald-600' : 'text-white bg-rose-600 border-rose-600',
                            invert: true,
                            show: true
                        },
                    ].filter(item => item.show).map(({ label, value, icon: Icon, color, invert }) => (
                        <div key={label} className={`rounded-2xl border p-4 ${invert ? color + ' text-white' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-3.5 h-3.5 ${invert ? 'text-white/80' : color.split(' ')[0]}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${invert ? 'text-white/70' : 'text-slate-400'}`}>{label}</span>
                            </div>
                            <div className={`text-xl font-black ${invert ? 'text-white' : color.split(' ')[0]}`}>
                                {value < 0 ? '-' : ''}₹{fmt(value)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cards List instead of Table */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest text-xs bg-white rounded-3xl border border-slate-200 shadow-sm">
                        LOADING RECORDS…
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-24 text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                <FileText size={32} />
                            </div>
                            <div className="font-bold text-sm">No financial records yet</div>
                            <div className="text-xs text-slate-300">Ledger entries and lead allocations will appear here</div>
                        </div>
                    </div>
                ) : rows.map((row, idx) => {
                    const isPositiveRow = row.row_net >= 0;
                    const isLedger = row.row_type !== 'lead';
                    const receivedLabel = role === 'super_admin' ? 'System Revenue' : (role === 'admin' ? 'Received from SA' : (role === 'super_agent' ? 'Received from Admin' : 'Received'));

                    if (isLedger) {
                        return (
                            <div key={`${row.row_type}-${idx}`} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 shrink-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(row.date).toLocaleString('en-IN', { month: 'short' })}</span>
                                        <span className="text-lg font-black text-slate-700 leading-none">{new Date(row.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <RowTypeBadge type={row.row_type} />
                                            {row.category && (
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded-md">
                                                    {row.category.replace(/_/g, ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-black text-slate-800">{row.description || 'Ledger Entry'}</div>
                                        {row.created_by_name && (
                                            <div className="text-[10px] font-medium text-slate-500 mt-0.5">by {row.created_by_name}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Row Net</div>
                                        <div className={`text-lg font-black ${isPositiveRow ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isPositiveRow ? '+' : '-'}₹{fmt(row.row_net)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Balance</div>
                                        <div className={`text-sm font-black px-3 py-1.5 rounded-xl inline-block shadow-inner ${row.running_balance >= 0 ? 'bg-indigo-100/70 text-indigo-800' : 'bg-rose-100/70 text-rose-800'}`}>
                                            ₹{fmt(row.running_balance)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={row.lead_ulid ?? idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 transition-all hover:shadow-2xl hover:shadow-slate-200/60">
                            {/* Lead Header */}
                            <div className="bg-slate-800 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-700 rounded-2xl shadow-inner border border-slate-600 shrink-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(row.date).toLocaleString('en-IN', { month: 'short' })}</span>
                                        <span className="text-lg font-black text-white leading-none">{new Date(row.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-indigo-500/30">Lead</span>
                                            {row.system_capacity ? (
                                                <span className="bg-slate-700 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-lg">
                                                    {row.system_capacity} kW
                                                </span>
                                            ) : null}
                                        </div>
                                        <h3 className="text-base font-black text-white">{row.consumer_name || 'Unknown Consumer'}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[11px] text-slate-400 font-mono">{row.consumer_mobile}</span>
                                            {row.lead_ulid && (
                                                <span className="text-[9px] text-slate-500 font-mono">#{row.lead_ulid.slice(-8)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={row.payment_status} />
                                </div>
                            </div>

                            {/* Financial Body */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                
                                {/* 1. INFLOWS */}
                                <div className="p-5 md:p-6 bg-slate-50/50">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ArrowDownRight className="w-3 h-3 text-emerald-500 rotate-180" /> 
                                        Inflows
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group/rev">
                                            <span className="text-xs font-bold text-slate-600">{receivedLabel}</span>
                                            <div className="flex items-center gap-2">
                                                {role === 'super_admin' && row.lead_ulid && (
                                                    <button 
                                                        onClick={() => {
                                                            const cap = parseCapacity(row.system_capacity);
                                                            setEditRevenueModal({ ulid: row.lead_ulid!, capacity: cap, currentRevenue: row.received_from_sa, name: row.consumer_name ?? 'Lead' });
                                                            setCommissionPerKw(cap > 0 && row.received_from_sa > 0 ? Math.round(row.received_from_sa / cap) : '');
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl opacity-0 group-hover/rev:opacity-100 transition-all"
                                                        title="Edit Revenue"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                                <span className="text-sm font-black text-indigo-700">₹{fmt(row.received_from_sa)}</span>
                                            </div>
                                        </div>

                                        {role === 'admin' && (
                                            <div className="flex flex-col bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-600">Ledger Credits</span>
                                                    <span className="text-sm font-black text-emerald-700">₹{fmt(row.ledger_credit)}</span>
                                                </div>
                                                
                                                {/* Detailed Breakdown for Admin */}
                                                {row.row_type === 'lead' && ((row.lead_meeting_allowance ?? 0) > 0 || (row.lead_additional_expenses ?? 0) > 0) && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100/60 space-y-2">
                                                        {(row.lead_meeting_allowance ?? 0) > 0 && (
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="text-slate-500 font-medium">Meeting Allowance</span>
                                                                <span className="text-slate-700 font-bold">₹{fmt(row.lead_meeting_allowance!)}</span>
                                                            </div>
                                                        )}
                                                        {(row.lead_additional_expenses ?? 0) > 0 && (
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="text-slate-500 font-medium">Additional Expenses</span>
                                                                <span className="text-slate-700 font-bold">₹{fmt(row.lead_additional_expenses!)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. OUTFLOWS */}
                                <div className="p-5 md:p-6 bg-white">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ArrowDownRight className="w-3 h-3 text-rose-500" /> 
                                        Payouts & Expenses
                                    </h4>

                                    <div className="space-y-4">
                                        {/* Downlines */}
                                        {role !== 'enumerator' && (
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Team Payouts</div>
                                                {row.downlines.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {row.downlines.map((d, i) => (
                                                            <div key={i} className="flex flex-wrap items-center justify-between gap-2 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded flex-shrink-0 font-black uppercase tracking-widest ${ROLE_COLORS[d.role] ?? 'bg-slate-100 text-slate-600'}`}>
                                                                        {ROLE_LABELS[d.role] ?? d.role}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-700 font-bold truncate max-w-[120px]">{d.name}</span>
                                                                </div>
                                                                <span className={`text-xs font-black shrink-0 ${d.status === 'paid' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                                    ₹{fmt(d.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 font-medium italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 border-dashed">No team payouts</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Tech Team */}
                                        {role === 'admin' && (
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2 mt-4">Tech Team</div>
                                                {row.tech_payouts.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {row.tech_payouts.map((t, i) => (
                                                            <div key={i} className="flex flex-wrap items-center justify-between gap-2 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/50">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded flex-shrink-0 font-black uppercase tracking-widest bg-teal-100 text-teal-700">
                                                                        <Wrench className="w-2 h-2 inline mr-0.5" />
                                                                        {CHAIN_LABELS[t.chain_type ?? ''] ?? 'Tech'}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-700 font-bold truncate max-w-[120px]">{t.name}</span>
                                                                </div>
                                                                <span className={`text-xs font-black shrink-0 ${t.status === 'paid' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                                    ₹{fmt(t.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 font-medium italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 border-dashed">No tech payouts</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Enterprise Expenses */}
                                        {role === 'admin' && row.enterprise_expense > 0 && (
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2 mt-4">Other Deductions</div>
                                                <div className="flex items-center justify-between bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                                                    <span className="text-[11px] text-slate-700 font-bold">Enterprise Expenses</span>
                                                    <span className="text-xs font-black text-rose-600">₹{fmt(row.enterprise_expense)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. NET BALANCE */}
                                <div className="p-5 md:p-6 bg-slate-50 flex flex-col justify-center">
                                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Row Net Profit</div>
                                            <div className={`text-2xl font-black tracking-tight ${isPositiveRow ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isPositiveRow ? '+' : '-'}₹{fmt(row.row_net)}
                                            </div>
                                        </div>
                                        
                                        <div className="h-px bg-slate-100 w-full" />

                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Running Balance</div>
                                            <div className={`inline-block px-4 py-2 rounded-xl text-lg font-black shadow-inner ${row.running_balance >= 0 ? 'bg-indigo-100/70 text-indigo-800' : 'bg-rose-100/70 text-rose-800'}`}>
                                                ₹{fmt(row.running_balance)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl">
                        Page {meta?.current_page} of {lastPage} <span className="opacity-40 px-2">•</span> {meta?.total} Total Records
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                            disabled={page === lastPage}
                            className="inline-flex items-center gap-1 px-5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Revenue Modal */}
            {editRevenueModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                            <div>
                                <h3 className="font-black text-indigo-900">Edit System Revenue</h3>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Lead: {editRevenueModal.name}</p>
                            </div>
                            <button onClick={() => setEditRevenueModal(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Capacity</span>
                                <span className="font-black text-slate-800">{editRevenueModal.capacity} kW</span>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Commission per kW (₹)</label>
                                <input 
                                    type="number" min="0" 
                                    value={commissionPerKw} 
                                    onChange={e => setCommissionPerKw(e.target.value)}
                                    placeholder="e.g. 10000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-700"
                                />
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total System Revenue</span>
                                    <span className="text-xl font-black text-indigo-700">
                                        ₹{((Number(commissionPerKw) || 0) * editRevenueModal.capacity).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateRevenueMut.mutate({ ulid: editRevenueModal.ulid, revenue: (Number(commissionPerKw) || 0) * editRevenueModal.capacity })} 
                                        disabled={updateRevenueMut.isPending || !commissionPerKw} 
                                        className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-200"
                                    >
                                        {updateRevenueMut.isPending ? 'Saving...' : <><Check size={16} /> Save</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
