import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, ClipboardCheck, CreditCard, X, ChevronLeft, ChevronRight, Wallet, ArrowUpRight, Clock, MapPin, ReceiptText } from 'lucide-react';
import { superAgentCommissionsApi } from '@/services/commissions.api';
import type { Commission, SuperAgentCommissionSummary } from '@/types';
import toast from 'react-hot-toast';
import ProfitLedgerTable from '@/components/commission/ProfitLedgerTable';

type Tab = 'my_earnings' | 'pay_agents' | 'ledger';

const COMMISSION_STATUS_STYLE: Record<string, string> = {
    unpaid: 'bg-amber-100 text-amber-700 font-bold',
    paid: 'bg-green-100 text-green-700 font-bold outline outline-1 outline-green-200',
};

export default function SuperAgentCommissionsPage() {
    const [tab, setTab] = useState<Tab>('my_earnings');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'paid' | 'all'>('all');

    // Modals
    const [showPaidModal, setShowPaidModal] = useState<Commission | null>(null);
    const [paymentForm, setPaymentForm] = useState({ method: 'bank_transfer', ref: '', notes: '' });

    const qc = useQueryClient();

    // Mapping frontend tabs/filters to backend 'filter' strings
    let backendFilter = 'all';
    if (tab === 'my_earnings') {
        backendFilter = statusFilter === 'pending' ? 'pending_my_payment' : (statusFilter === 'paid' ? 'fully_paid' : 'all_my_earnings');
    } else {
        backendFilter = statusFilter === 'pending' ? 'pending_to_pay' : (statusFilter === 'paid' ? 'payouts_paid' : 'all_to_pay');
    }

    const { data: commissionsData, isLoading: loadingCommissions } = useQuery({
        queryKey: ['sa-commissions-list', tab, backendFilter, page],
        queryFn: () => superAgentCommissionsApi.getAll({
            filter: backendFilter,
            page: page,
            per_page: 20
        }),
    });
    const commissions: Commission[] = commissionsData?.data?.data ?? [];
    const meta = (commissionsData?.data as any)?.meta ?? { last_page: 1, current_page: 1, total: 0 };

    const { data: summaryData } = useQuery({
        queryKey: ['sa-commissions-summary'],
        queryFn: () => superAgentCommissionsApi.getSummary(),
    });
    const summary: SuperAgentCommissionSummary | undefined = summaryData?.data?.data;

    // ════════════════════ MUTATIONS ════════════════════
    const markPaidMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => superAgentCommissionsApi.markPaid(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-commissions-list'] });
            qc.invalidateQueries({ queryKey: ['sa-commissions-summary'] });
            toast.success('Payout recorded successfully');
            setShowPaidModal(null);
            setPaymentForm({ method: 'bank_transfer', ref: '', notes: '' });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record payout.'),
    });

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Hub</h1>
                    <p className="text-sm text-slate-500 mt-1">Track personal BDM earnings and settle team incentives.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><Wallet size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Pending</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">₹{Number(summary?.my_earnings_unpaid || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter italic">Awaiting Admin Release</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><IndianRupee size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Total Paid</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">₹{Number(summary?.my_earnings_paid || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter italic">Settled Earnings</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Clock size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Pay Team</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">₹{Number(summary?.agent_payouts_unpaid || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-tighter">Incentives Due</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><ArrowUpRight size={20} /></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Disbursed</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">₹{Number(summary?.agent_payouts_paid || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Distributed to Team</div>
                    </div>
                </div>
            </div>

            {/* View Selector & Secondary Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: 'my_earnings', label: 'My Earnings', icon: Wallet },
                        { id: 'pay_agents', label: 'Incentive Payouts', icon: ClipboardCheck },
                        { id: 'ledger', label: 'Profit Ledger', icon: ReceiptText },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setTab(t.id as Tab); setPage(1); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${tab === t.id ? (t.id === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <t.icon size={16} className={tab === t.id ? (t.id === 'ledger' ? 'text-white' : 'text-blue-600') : ''} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab !== 'ledger' && (
                <div className="flex gap-2">
                    {(['pending', 'paid', 'all'] as const).map(f => (
                        <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                            className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${statusFilter === f ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {f === 'pending' ? 'Unpaid' : f}
                        </button>
                    ))}
                </div>
                )}
            </div>

            {tab === 'ledger' ? (
                <ProfitLedgerTable role="super_agent" api={superAgentCommissionsApi} />
            ) : (<>
            {/* Tab Alert Box */}
            <div className={`border rounded-2xl px-5 py-4 flex items-start gap-4 shadow-sm transition-all duration-500 ${tab === 'my_earnings' ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100' : 'bg-orange-50 border-orange-200 shadow-orange-100'}`}>
                <div className={`p-2 rounded-xl shadow-sm bg-white ${tab === 'my_earnings' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {tab === 'my_earnings' ? <ReceiptText size={20} /> : <UserCog size={20} className="w-5 h-5" />}
                </div>
                <div>
                    <h3 className={`text-sm font-black ${tab === 'my_earnings' ? 'text-emerald-900' : 'text-orange-900'}`}>
                        {tab === 'my_earnings' ? 'BDM Personal Earnings' : 'Team Incentive Management'}
                    </h3>
                    <p className={`text-xs mt-1 font-medium leading-relaxed ${tab === 'my_earnings' ? 'text-emerald-700' : 'text-orange-700'}`}>
                        {tab === 'my_earnings'
                            ? "This view tracks the commissions credited to you by the Admin for leads successfully converted by you or your team."
                            : "Manage the incentives due to your agents. Once you record a payout here, it will be reflected in the agent's dashboard as settled."
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
                                {['Ref/Date', 'Lead Identity', tab === 'my_earnings' ? 'Source' : 'Team (Payee)', 'Amount', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loadingCommissions ? (
                                <tr><td colSpan={6} className="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest">LOADING...</td></tr>
                            ) : commissions.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-24 text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><ClipboardCheck size={32} /></div>
                                        <div className="font-bold">No commission records found.</div>
                                    </div>
                                </td></tr>
                            ) : commissions.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        <div className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">ID: {c.id}</div>
                                        <div className="text-[11px] text-slate-500 font-bold mt-1">
                                            {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5">
                                        <div className="text-xs font-black text-slate-800">{c.lead?.beneficiary_name}</div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter truncate max-w-[120px]">
                                            <MapPin size={10} className="text-slate-300" /> {c.lead?.beneficiary_district}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5">
                                        {tab === 'my_earnings' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><IndianRupee size={12} /></div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-800">Admin Credit</div>
                                                    <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Internal</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-xs font-black text-slate-800">{c.payee?.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{c.payee?.code}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-5">
                                        <div className="text-sm text-orange-600 font-black tracking-tight">₹{Number(c.amount).toLocaleString('en-IN')}</div>
                                    </td>
                                    <td className="px-5 py-5 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest ${COMMISSION_STATUS_STYLE[c.payment_status] || 'bg-slate-100 text-slate-600'}`}>
                                            {c.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-5">
                                        {c.payment_status === 'paid' ? (
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 group-hover:bg-white transition-colors">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Paid On</div>
                                                <div className="text-[10px] font-black text-slate-600">{new Date(c.paid_at!).toLocaleDateString('en-IN')}</div>
                                                <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[100px]">{c.payment_reference}</div>
                                            </div>
                                        ) : tab === 'pay_agents' ? (
                                            <button onClick={() => { setShowPaidModal(c); setPaymentForm({ method: 'bank_transfer', ref: '', notes: '' }); }}
                                                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 transform hover:-translate-y-0.5 active:translate-y-0">
                                                Mark Paid
                                            </button>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 font-bold italic py-2 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                Awaiting Admin Payout
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/30">
                        <span className="text-slate-500 font-bold opacity-60">Page {page} of {meta.last_page}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30 transition-all">
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                                className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30 transition-all">
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Record Payout Modal */}
            {showPaidModal && (
                <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPaidModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 tracking-tight">Team Payout</h3>
                            <button onClick={() => setShowPaidModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-xl shadow-slate-200 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Paying To</div>
                                    <div className="text-lg font-black tracking-tight">{showPaidModal.payee?.name}</div>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1 text-right">Amount</div>
                                    <div className="text-2xl font-black">₹{Number(showPaidModal.amount).toLocaleString('en-IN')}</div>
                                </div>
                                <div className="absolute -right-4 -top-4 text-white/5 rotate-12"><IndianRupee size={100} /></div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['bank_transfer', 'upi', 'cash', 'cheque'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentForm(prev => ({ ...prev, method: m }))}
                                            className={`py-3 px-3 border-2 rounded-2xl text-[11px] font-black capitalize flex flex-col items-center gap-1.5 transition-all ${paymentForm.method === m ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-50' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            <CreditCard size={18} />
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reference Number *</label>
                                <input
                                    type="text"
                                    value={paymentForm.ref}
                                    onChange={e => setPaymentForm(prev => ({ ...prev, ref: e.target.value }))}
                                    placeholder="Enter UTR / Ref Number"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={handleMarkPaid}
                                disabled={!paymentForm.ref || markPaidMut.isPending}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-2xl hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {markPaidMut.isPending ? 'Processing...' : 'Confirm Payout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </>)}
        </div>
    );
}

const UserCog = ({ className, size }: { className?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M10.5 14.5c2.2 1.4 4.5 4 4.5 4.5" />
        <path d="M3.5 14.5c2.2 1.4 4.5 4 4.5 4.5" />
    </svg>
);
