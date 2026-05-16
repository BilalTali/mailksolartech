import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ClipboardCheck, CreditCard, ChevronLeft, ChevronRight, UserCog, Edit3, IndianRupee, BarChart2 } from 'lucide-react';
import { adminCommissionsApi } from '@/services/commissions.api';
import type { Commission } from '@/types';
import toast from 'react-hot-toast';
import EarningsOverviewCard from '@/components/commission/EarningsOverviewCard';
import ProfitLedgerTable from '@/components/commission/ProfitLedgerTable';
import { useAuthStore } from '@/store/authStore';

const COMMISSION_STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 font-bold',
    paid: 'bg-green-100 text-green-700 font-bold outline outline-1 outline-green-200',
};

export default function AdminCommissionsPage() {
    const qc = useQueryClient();

    // ════════════════════ STATE ════════════════════
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState<'managers' | 'direct_agents' | 'all' | 'ledger'>('managers');
    const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('all');

    // Modals
    const [showPaidModal, setShowPaidModal] = useState<Commission | null>(null);
    const [showEditModal, setShowEditModal] = useState<Commission | null>(null);

    // Forms
    const [paymentForm, setPaymentForm] = useState({ method: 'bank_transfer', ref: '', notes: '' });
    const [editForm, setEditForm] = useState({ amount: '' });

    // Derive backend filter
    const backendFilter = `${tab === 'managers' ? 'super_agent' : (tab === 'direct_agents' ? 'agent_direct' : 'all')}_${filter}`;

    const { data: listData, isLoading: loading } = useQuery({
        queryKey: ['admin-commissions-list', backendFilter, page],
        queryFn: () => adminCommissionsApi.getAll({
            page: page,
            per_page: 20,
            filter: backendFilter
        }),
    });

    const commissions: Commission[] = listData?.data?.data ?? [];
    const lastPage = listData?.data?.meta?.last_page ?? 1;

    const { data: summaryData } = useQuery({
        queryKey: ['admin-commissions-summary'],
        queryFn: () => adminCommissionsApi.getSummary(),
    });
    const summary = summaryData?.data?.data;

    // ════════════════════ MUTATIONS ════════════════════
    const markPaidMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => adminCommissionsApi.markPaid(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-commissions-list'] });
            qc.invalidateQueries({ queryKey: ['admin-commissions-summary'] });
            toast.success('Payment recorded successfully');
            setShowPaidModal(null);
            setPaymentForm({ method: 'bank_transfer', ref: '', notes: '' });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record payment.'),
    });

    const updateAmountMut = useMutation({
        mutationFn: ({ id, amount }: { id: number; amount: number }) => adminCommissionsApi.updateCommission(id, { amount }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-commissions-list'] });
            qc.invalidateQueries({ queryKey: ['admin-commissions-summary'] });
            toast.success('Commission amount updated');
            setShowEditModal(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update amount.'),
    });

    // ════════════════════ HANDLERS ════════════════════
    const handleMarkPaid = () => {
        if (!showPaidModal || !paymentForm.ref) return;
        markPaidMut.mutate({
            id: showPaidModal.id,
            data: {
                payment_method: paymentForm.method,
                payment_reference: paymentForm.ref,
                payment_notes: paymentForm.notes
            }
        });
    };

    const handleUpdateAmount = () => {
        if (!showEditModal || !editForm.amount) return;
        updateAmountMut.mutate({
            id: showEditModal.id,
            amount: parseFloat(editForm.amount)
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Disbursements</h1>
                    <p className="text-sm text-slate-500 mt-1">Track and manage payouts for Managers and Direct Agents.</p>
                </div>
            </div>

            {/* Earnings Overview — Net Profit = Received - Downlines - Ledger Expenses */}
            <EarningsOverviewCard
                totalProfit={summary?.admin_net_profit ?? summary?.admin_net_earning_total ?? 0}
                activeLeadsCount={listData?.data?.meta?.total || 0}
                role={useAuthStore.getState().role || 'admin'}
                totalReceived={summary?.commissions_earned ?? summary?.total_received_from_sa ?? 0}
                totalDownlines={summary?.commissions_to_downlines ?? summary?.total_passed_to_downlines ?? 0}
                totalExpenses={summary?.total_other_expenses ?? 0}
            />

            {/* View Selector (Tabs) */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: 'managers', label: 'Manager Payouts', icon: UserCog },
                        { id: 'direct_agents', label: 'Direct Agent Payouts', icon: CreditCard },
                        { id: 'all', label: 'All Records', icon: ClipboardCheck },
                        { id: 'ledger', label: 'Profit Ledger', icon: BarChart2 },
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

                {/* Filter Toggle — hidden on Profit Ledger tab */}
                {tab !== 'ledger' && (
                <div className="flex gap-2">
                    {(['pending', 'paid', 'all'] as const).map(f => (
                        <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {f === 'pending' ? 'Unpaid / Pending' : f}
                        </button>
                    ))}
                </div>
                )}
            </div>

            {/* ═══════════ PROFIT LEDGER TAB ═══════════ */}
            {tab === 'ledger' ? (
                <ProfitLedgerTable role={useAuthStore.getState().role || 'admin'} api={adminCommissionsApi} />
            ) : (<>

            {/* Disclaimer / Info */}

            {/* Dynamic Alert based on Tab */}
            <div className={`border rounded-2xl px-5 py-4 flex items-start gap-4 shadow-sm transition-all duration-500 ${tab === 'managers' ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100' : 'bg-blue-50 border-blue-200 shadow-blue-100'}`}>
                <div className={`p-2 rounded-xl shadow-sm bg-white ${tab === 'managers' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {tab === 'managers' ? <UserCog size={20} /> : <CreditCard size={20} />}
                </div>
                <div>
                    <h3 className={`text-sm font-black ${tab === 'managers' ? 'text-emerald-900' : 'text-blue-900'}`}>
                        {tab === 'managers' ? 'Manager Payouts (BDM Role)' : (tab === 'direct_agents' ? 'Direct Agent Disbursements' : 'System-wide Transaction History')}
                    </h3>
                    <p className={`text-xs mt-1 font-medium leading-relaxed ${tab === 'managers' ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {tab === 'managers'
                            ? "This view shows commissions destined for Managers. They are responsible for further disbursing these amounts to their respective team agents."
                            : (tab === 'direct_agents'
                                ? "This list includes agents who work directly with the company without a BDM. You are responsible for their individual payouts."
                                : "A unified view of all commissions in the system, including those internal payouts handled by Managers for their teams.")
                        }
                    </p>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                {['Ref/Date', tab === 'all' ? 'Payee & Role' : 'Payee', 'Lead Information', 'Amount', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest">LOADING RECORDS...</td></tr>
                            ) : commissions.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-24 text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><ClipboardCheck size={32} /></div>
                                        <div className="font-bold">No records found for this view.</div>
                                    </div>
                                </td></tr>
                            ) : commissions.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        <div className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">ID: {p.id}</div>
                                        <div className="text-[11px] text-slate-500 font-bold mt-1">
                                            {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm text-slate-800 font-black">{p.payee.name}</div>
                                             {tab === 'all' && (
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                                                    p.payee_role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                                    p.payee_role === 'super_agent' ? 'bg-orange-100 text-orange-700' : 
                                                    (p.payee_role === 'field_technical_team' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')
                                                }`}>
                                                     {p.payee_role === 'admin' ? 'Received from SA' :
                                                      p.payee_role === 'super_agent' ? 'Manager' : (
                                                        p.payee_role === 'field_technical_team' 
                                                            ? (p.chain_type === 'SURVEYOR' ? 'Surveyor' : (p.chain_type === 'WORKER' ? 'Worker' : 'Installer'))
                                                            : (p.payee_role === 'enumerator' ? 'Enumerator' : 'Agent')
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.payee.code || (p.payee as any).super_agent_code}</div>
                                    </td>
                                    <td className="px-5 py-5">
                                        <div className="text-xs font-bold text-slate-700">{p.lead?.beneficiary_name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-70">ULID: {p.lead?.ulid.slice(-8)}</div>
                                    </td>
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 group">
                                            <span className={`text-base font-black tracking-tight ${p.payee_role === 'admin' ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                ₹{Number(p.amount).toLocaleString('en-IN')}
                                            </span>
                                             {p.payment_status === 'unpaid' && p.payee_role !== 'admin' && (
                                                <button
                                                    onClick={() => { setShowEditModal(p); setEditForm({ amount: p.amount.toString() }); }}
                                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Amount"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest ${COMMISSION_STATUS_STYLE[p.payment_status] || 'bg-slate-100 text-slate-600'}`}>
                                            {p.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-5">
                                        {p.payment_status === 'unpaid' ? (
                                            p.payee_role === 'admin' ? (
                                                <div className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-indigo-100">
                                                    Awaiting SA Settlement
                                                </div>
                                            ) : (
                                                <button onClick={() => { setShowPaidModal(p); setPaymentForm({ method: 'bank_transfer', ref: '', notes: '' }); }}
                                                    className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 transform hover:-translate-y-0.5 active:translate-y-0">
                                                    Record Payment
                                                </button>
                                            )
                                        ) : (
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Reference</div>
                                                <div className="text-[10px] font-mono text-slate-600 font-black truncate max-w-[120px]">{p.payment_reference}</div>
                                                <div className="text-[9px] text-slate-400 mt-1 font-bold">Paid: {new Date(p.paid_at!).toLocaleDateString('en-IN')}</div>
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
                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/30">
                        <span className="text-slate-500 font-bold opacity-60">Showing page {page} of {lastPage}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30 transition-all">
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                                className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30 transition-all">
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════ EDIT AMOUNT MODAL ══════════ */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowEditModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 tracking-tight">Adjust Commission</h3>
                            <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <div className="bg-white p-2 h-fit rounded-lg shadow-sm text-blue-600"><Edit3 size={18} /></div>
                                <div>
                                    <div className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Adjusting for</div>
                                    <div className="text-sm font-bold text-blue-900">{showEditModal.payee.name}</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">New Amount (₹) *</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={editForm.amount}
                                        onChange={e => setEditForm({ amount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-4 text-xl font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={handleUpdateAmount}
                                disabled={!editForm.amount || updateAmountMut.isPending}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {updateAmountMut.isPending ? 'Updating...' : 'Save Adjustment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ MARK PAID MODAL ══════════ */}
            {showPaidModal && (
                <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPaidModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 tracking-tight text-center">Record Disbursal</h3>
                            <button onClick={() => setShowPaidModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-orange-600 rounded-2xl p-5 text-white shadow-xl shadow-orange-200 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Paying To</div>
                                    <div className="text-lg font-black tracking-tight">{showPaidModal.payee.name}</div>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 text-right">Amount</div>
                                    <div className="text-2xl font-black">₹{Number(showPaidModal.amount).toLocaleString('en-IN')}</div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12"><IndianRupee size={100} /></div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1 text-center">Payment System</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['bank_transfer', 'upi', 'cash', 'cheque'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentForm(prev => ({ ...prev, method: m }))}
                                            className={`py-3 px-3 border-2 rounded-2xl text-[11px] font-black capitalize flex flex-col items-center gap-1.5 transition-all ${paymentForm.method === m ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg shadow-orange-100' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            <CreditCard size={18} />
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reference No. (RTGS / UTR / CHQ) *</label>
                                <input
                                    type="text"
                                    value={paymentForm.ref}
                                    onChange={e => setPaymentForm(prev => ({ ...prev, ref: e.target.value }))}
                                    placeholder="Enter transaction reference"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-700 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={handleMarkPaid}
                                disabled={!paymentForm.ref || markPaidMut.isPending}
                                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm shadow-2xl hover:bg-slate-900 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {markPaidMut.isPending ? 'Recording...' : 'Confirm Disbursal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </>)}
        </div>
    );
}
