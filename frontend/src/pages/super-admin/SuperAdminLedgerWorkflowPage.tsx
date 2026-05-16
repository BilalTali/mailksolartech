import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
    CheckCircle2, XCircle, CreditCard, Clock, FileText, 
    ExternalLink, Search, ArrowUpRight, ArrowDownRight,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { adminLedgerApi } from '@/services/adminLedger.api';
import { formatCurrency, formatDate, getFileUrl } from '@/utils/formatters';

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: any }> = {
    pending:  { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    approved: { bg: 'bg-blue-100',  text: 'text-blue-700',  icon: CheckCircle2 },
    rejected: { bg: 'bg-rose-100',  text: 'text-rose-700',  icon: XCircle },
    paid:     { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
};

export default function SuperAdminLedgerWorkflowPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending');
    
    // Modals state
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [payingId, setPayingId] = useState<number | null>(null);
    const [paymentDetails, setPaymentDetails] = useState({ method: 'bank_transfer', reference: '' });

    const { data: listData, isLoading } = useQuery({
        queryKey: ['super-admin-ledger', statusFilter, page],
        queryFn: () => adminLedgerApi.getAll({ 
            status: statusFilter === 'all' ? undefined : statusFilter,
            page 
        }).then(res => res.data)
    });

    const items = listData?.data ?? [];
    const meta = listData?.meta;

    const approveMut = useMutation({
        mutationFn: (id: number) => adminLedgerApi.approve(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['super-admin-ledger'] });
            toast.success('Expense approved');
        }
    });

    const rejectMut = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => adminLedgerApi.reject(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['super-admin-ledger'] });
            toast.success('Expense rejected');
            setRejectingId(null);
            setRejectionReason('');
        }
    });

    const payMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => adminLedgerApi.markPaid(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['super-admin-ledger'] });
            toast.success('Marked as paid');
            setPayingId(null);
            setPaymentDetails({ method: 'bank_transfer', reference: '' });
        }
    });

    return (
        <div className="pb-24 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="font-display font-black text-4xl text-slate-800 tracking-tight">Ledger Workflow</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Audit, approve and settle administrative expenses</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-inner">
                    {['pending', 'approved', 'paid', 'rejected', 'all'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-slate-900 shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Administrator</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Type & Category</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Amount</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Receipt</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-24 text-center text-slate-400 animate-pulse font-black tracking-widest">FETCHING FINANCIAL RECORDS...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-32 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                            <Search size={40} />
                                        </div>
                                        <p className="font-black text-slate-600 uppercase tracking-tight">No records found for this status</p>
                                    </div>
                                </td></tr>
                            ) : items.map((item: any) => {
                                const style = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 font-black">
                                                    {item.admin?.name?.charAt(0) || 'A'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-800">{item.admin?.name || 'Unknown Admin'}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">ID: {item.admin_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    {item.transaction_type === 'credit' ? (
                                                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDownRight className="w-3 h-3 text-rose-500" />
                                                    )}
                                                    <span className="text-xs font-black text-slate-700 capitalize tracking-tight">{item.category.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium max-w-[200px] truncate group-hover:whitespace-normal transition-all">{item.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="text-lg font-black text-slate-900 tracking-tight">
                                                {formatCurrency(item.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            {item.receipt_path ? (
                                                <a 
                                                    href={getFileUrl(item.receipt_path)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 hover:scale-105 transition-transform shadow-sm shadow-indigo-100"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    View Bill
                                                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold uppercase italic tracking-widest">No Proof</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text} border border-current opacity-90`}>
                                                <style.icon className="w-3 h-3" />
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-slate-400 font-bold text-xs uppercase tracking-tighter">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => setRejectingId(item.id)}
                                                            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                                                            title="Reject Claim"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => approveMut.mutate(item.id)}
                                                            disabled={approveMut.isPending}
                                                            className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100 shadow-sm hover:shadow-emerald-100"
                                                            title="Approve Claim"
                                                        >
                                                            <CheckCircle2 size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === 'approved' && (
                                                    <button 
                                                        onClick={() => setPayingId(item.id)}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                                    >
                                                        <CreditCard size={14} />
                                                        Settle Payment
                                                    </button>
                                                )}
                                                {item.status === 'paid' && (
                                                    <div className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                        <CheckCircle2 size={14} />
                                                        Settled
                                                    </div>
                                                )}
                                                {item.status === 'rejected' && (
                                                    <div className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-1.5 italic opacity-60">
                                                        <XCircle size={14} />
                                                        Declined
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {meta && meta.last_page > 1 && (
                    <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/30">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Page {page} of {meta.last_page}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))} 
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-5 py-3 border-2 border-slate-100 rounded-2xl bg-white text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} 
                                disabled={page === meta.last_page}
                                className="inline-flex items-center gap-1 px-5 py-3 border-2 border-slate-100 rounded-2xl bg-white text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════ REJECTION MODAL ══════════ */}
            {rejectingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                            <div>
                                <h3 className="font-display font-black text-2xl text-slate-800 tracking-tight">Reject Expense</h3>
                                <p className="text-xs text-slate-500 mt-1 font-bold">Please provide a valid reason for rejection</p>
                            </div>
                            <button onClick={() => setRejectingId(null)} className="text-slate-400 hover:text-slate-600 font-black text-2xl">&times;</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Rejection Reason</label>
                                <textarea 
                                    autoFocus
                                    required
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Bill is not clear, Category mismatch..."
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-rose-100 focus:border-rose-500 focus:outline-none transition-all resize-none shadow-inner"
                                ></textarea>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setRejectingId(null)} className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                                <button 
                                    onClick={() => rejectMut.mutate({ id: rejectingId, reason: rejectionReason })}
                                    disabled={!rejectionReason || rejectMut.isPending}
                                    className="flex-[2] px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 disabled:opacity-50"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ SETTLE MODAL ══════════ */}
            {payingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                            <div>
                                <h3 className="font-display font-black text-2xl text-slate-800 tracking-tight">Confirm Payment</h3>
                                <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Mark as settled in system</p>
                            </div>
                            <button onClick={() => setPayingId(null)} className="text-slate-400 hover:text-slate-600 font-black text-2xl">&times;</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['bank_transfer', 'upi', 'cash', 'cheque'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentDetails({ ...paymentDetails, method: m })}
                                            className={`py-4 px-4 border-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${paymentDetails.method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Reference No. (Optional)</label>
                                <input 
                                    type="text"
                                    value={paymentDetails.reference}
                                    onChange={e => setPaymentDetails({ ...paymentDetails, reference: e.target.value })}
                                    placeholder="UTR / Transaction ID"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm font-black focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setPayingId(null)} className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                                <button 
                                    onClick={() => payMut.mutate({ id: payingId, data: { payment_method: paymentDetails.method, payment_reference: paymentDetails.reference } })}
                                    disabled={payMut.isPending}
                                    className="flex-[2] px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                >
                                    Confirm & Pay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
