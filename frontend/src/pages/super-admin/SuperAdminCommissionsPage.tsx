import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ClipboardCheck, CreditCard, ChevronLeft, ChevronRight, Shield, IndianRupee, CheckCircle, Download } from 'lucide-react';
import { superAdminCommissionsApi } from '@/services/commissions.api';
import type { Commission, MarkCommissionPaidPayload, CommissionPaymentMethod } from '@/types';
import toast from 'react-hot-toast';
import ProfitLedgerTable from '@/components/commission/ProfitLedgerTable';

const STATUS_STYLE: Record<string, string> = {
    unpaid: 'bg-amber-100 text-amber-700 font-bold',
    paid:   'bg-green-100 text-green-700 font-bold outline outline-1 outline-green-200',
};

export default function SuperAdminCommissionsPage() {
    const qc = useQueryClient();

    const [page,   setPage]   = useState(1);
    const [tab, setTab] = useState<'admin_payouts' | 'ledger'>('admin_payouts');
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate,   setEndDate]   = useState('');

    const [showPaidModal,    setShowPaidModal]    = useState<Commission | null>(null);
    const [paymentForm, setPaymentForm] = useState<{ method: CommissionPaymentMethod; ref: string; notes: string }>({ method: 'bank_transfer', ref: '', notes: '' });

    const { data: listData, isLoading } = useQuery({
        queryKey: ['super-admin-commissions', filter, page, startDate, endDate],
        queryFn:  () => superAdminCommissionsApi.getAll({
            page,
            per_page: 20,
            ...(filter !== 'all' ? { status: filter } : {}),
            start_date: startDate,
            end_date: endDate,
        }),
    });

    const commissions: Commission[] = listData?.data?.data ?? [];
    const meta = listData?.data?.meta;
    const lastPage = meta?.last_page ?? 1;

    const { data: summaryData } = useQuery({
        queryKey: ['super-admin-commissions-summary'],
        queryFn:  () => superAdminCommissionsApi.getSummary(),
    });
    const summary = summaryData?.data?.data;

    const downloadCSV = () => {
        if (!commissions.length) return;
        
        const headers = ['S.No', 'Admin Name', 'Commission Leads', 'Meeting Commission', 'Total Commission', 'Status', 'Date'];
        const rows = commissions.map((c, i) => [
            (page - 1) * 20 + (i + 1),
            c.payee?.name || 'N/A',
            c.lead?.admin_received_commission || 0,
            c.lead?.admin_meeting_allowance || 0,
            c.amount,
            c.payment_status,
            new Date(c.created_at).toLocaleDateString('en-IN')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `commissions_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const settleMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: MarkCommissionPaidPayload }) =>
            superAdminCommissionsApi.settle(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['super-admin-commissions'] });
            qc.invalidateQueries({ queryKey: ['super-admin-commissions-summary'] });
            toast.success('Commission settled successfully!');
            setShowPaidModal(null);
            setPaymentForm({ method: 'bank_transfer', ref: '', notes: '' });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record settlement.'),
    });

    const handleSettle = () => {
        if (!showPaidModal || !paymentForm.ref) return;
        settleMut.mutate({
            id:   showPaidModal.id,
            data: {
                payment_method:    paymentForm.method,
                payment_reference: paymentForm.ref,
                payment_notes:     paymentForm.notes,
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Commission Settlement</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and settle commissions payable to Administrators.</p>
                </div>
                <button 
                    onClick={downloadCSV}
                    className={`flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all active:scale-95 ${tab === 'ledger' ? 'hidden' : ''}`}
                >
                    <Download size={18} />
                    Download CSV
                </button>
            </div>

            {/* View Selector (Tabs) */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                {[
                    { id: 'admin_payouts', label: 'Admin Settlements', icon: Shield },
                    { id: 'ledger', label: 'System Profit Ledger', icon: ClipboardCheck },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setTab(t.id as any); setPage(1); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            tab === t.id
                                ? (t.id === 'ledger' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-900 shadow-sm')
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <t.icon size={16} className={tab === t.id ? (t.id === 'ledger' ? 'text-white' : 'text-blue-600') : ''} />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'ledger' ? (
                <ProfitLedgerTable role="super_admin" api={superAdminCommissionsApi} />
            ) : (
                <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5"><IndianRupee size={80} /></div>
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><IndianRupee size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Revenue</span>
                    </div>
                    <div className="mt-4 relative z-10">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            ₹{Number(summary?.system_revenue || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Gross Platform Inflows</div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 text-white"><IndianRupee size={80} /></div>
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/10 rounded-xl text-emerald-400"><IndianRupee size={20} /></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Net Profit</span>
                    </div>
                    <div className="mt-4 relative z-10">
                        <div className="text-2xl font-black text-white tracking-tight">
                            ₹{Number(summary?.system_net_profit || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter italic">System Profit</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ClipboardCheck size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settled (Admins)</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            ₹{Number(summary?.admin_paid_amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Cleared Commissions</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><IndianRupee size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unpaid (Admins)</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            ₹{Number(summary?.admin_unpaid_amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                            {summary?.admin_unpaid_count || 0} Pending Records
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                        {(['all', 'unpaid', 'paid'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                                className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary/30 transition-all"
                            />
                            <div className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-slate-400 uppercase">Start Date</div>
                        </div>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                                className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary/30 transition-all"
                            />
                            <div className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-slate-400 uppercase">End Date</div>
                        </div>
                        {(startDate || endDate) && (
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                                className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                {['S.No', 'Name of Admin', 'Commission Leads', 'Meeting Commission', 'Total Commission', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest">LOADING RECORDS...</td></tr>
                            ) : commissions.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-24 text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><ClipboardCheck size={40} /></div>
                                        <div className="font-bold text-slate-600">No commission records found.</div>
                                        <p className="text-xs text-slate-400">Try adjusting your filters or date range.</p>
                                    </div>
                                </td></tr>
                            ) : commissions.map((c, i) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{(page - 1) * 20 + (i + 1)}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Shield size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-800 font-black">{c.payee?.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                                    ID: {c.payee?.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-black text-slate-700">₹{(c.lead?.admin_received_commission || 0).toLocaleString('en-IN')}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{c.lead?.beneficiary_name}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-black text-slate-700">₹{(c.lead?.admin_meeting_allowance || 0).toLocaleString('en-IN')}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Allowance</div>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="px-4 py-2 bg-emerald-50 rounded-2xl w-fit">
                                            <span className="text-sm text-emerald-600 font-black tracking-tight">
                                                ₹{Number(c.amount).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] uppercase font-black tracking-widest ${STATUS_STYLE[c.payment_status] || 'bg-slate-100 text-slate-600'}`}>
                                            {c.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        {c.payment_status === 'unpaid' ? (
                                            <button
                                                onClick={() => { setShowPaidModal(c); setPaymentForm({ method: 'bank_transfer', ref: '', notes: '' }); }}
                                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
                                            >
                                                Settle
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                                <CheckCircle size={14} />
                                                Paid
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/30">
                        <span className="text-slate-500 font-bold opacity-60 uppercase tracking-widest text-[10px]">Page {page} of {lastPage}</span>
                        <div className="flex gap-3">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-2xl bg-white text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-2xl bg-white text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════ SETTLE MODAL ══════════ */}
            {showPaidModal && (
                <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPaidModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 tracking-tight">Record Settlement</h3>
                            <button onClick={() => setShowPaidModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Payee + Amount banner */}
                            <div className="bg-primary rounded-2xl p-5 text-white shadow-xl shadow-primary/20 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Paying To</div>
                                    <div className="text-lg font-black tracking-tight">{showPaidModal.payee?.name}</div>
                                    <div className="text-[10px] text-white/60 font-bold mt-0.5">Administrator</div>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 text-right">Amount</div>
                                    <div className="text-2xl font-black">₹{Number(showPaidModal.amount).toLocaleString('en-IN')}</div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12"><IndianRupee size={100} /></div>
                            </div>

                            {/* Payment method */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1 text-center">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['bank_transfer', 'upi', 'cash', 'cheque'] as CommissionPaymentMethod[]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentForm(prev => ({ ...prev, method: m }))}
                                            className={`py-3 px-3 border-2 rounded-2xl text-[11px] font-black capitalize flex flex-col items-center gap-1.5 transition-all ${paymentForm.method === m ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <CreditCard size={18} />
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reference No. (UTR / RTGS / CHQ) *</label>
                                <input
                                    type="text"
                                    value={paymentForm.ref}
                                    onChange={e => setPaymentForm(prev => ({ ...prev, ref: e.target.value }))}
                                    placeholder="Enter transaction reference"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>

                            {/* Notes (optional) */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Notes (optional)</label>
                                <input
                                    type="text"
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="e.g. March commission batch"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={handleSettle}
                                disabled={!paymentForm.ref || settleMut.isPending}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary-dark disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                {settleMut.isPending ? 'Recording...' : 'Confirm Settlement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </>
            )}
        </div>
    );
}
