import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, ArrowUpRight, ArrowDownRight, Camera, FileText, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminLedgerApi } from '@/services/adminLedger.api';
import { formatCurrency, formatDate, getFileUrl } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: any }> = {
    pending:  { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
    approved: { bg: 'bg-blue-50',  text: 'text-blue-600',  icon: CheckCircle2 },
    rejected: { bg: 'bg-rose-50',  text: 'text-rose-600',  icon: AlertCircle },
    paid:     { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
};

export default function AdminLedgerPage() {
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isSuperAdmin = role === 'super_admin';

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState<{ category: string; amount: string; description: string; receipt: File | null }>({ 
        category: 'meeting_allowance', 
        amount: '', 
        description: '',
        receipt: null
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: ledgers, isLoading } = useQuery({
        queryKey: ['admin-ledger'],
        queryFn: () => adminLedgerApi.getAll().then(res => res.data.data)
    });

    const expenseMut = useMutation({
        mutationFn: (payload: any) => adminLedgerApi.submitExpense(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-ledger'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
            toast.success('Expense submitted for approval');
            setIsExpenseModalOpen(false);
            setExpenseForm({ category: 'meeting_allowance', amount: '', description: '', receipt: null });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to submit expense');
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setExpenseForm({ ...expenseForm, receipt: e.target.files[0] });
        }
    };

    return (
        <div className="pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-display font-black text-3xl text-slate-800 tracking-tight">Enterprise Ledger</h1>
                    <p className="text-slate-500 font-medium italic">Professional tracking of non-lead expenses & allowances</p>
                </div>
                {!isSuperAdmin && (
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Log Expense
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h2 className="font-black text-lg text-slate-800 uppercase tracking-tight">Transaction History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Receipt</th>
                                <th className="px-6 py-4">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 animate-pulse font-bold">LOADING LEDGER DATA...</td></tr>
                            ) : ledgers?.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No ledger entries found.</td></tr>
                            ) : ledgers?.map((ledger: any) => {
                                const status = STATUS_STYLE[ledger.status] || STATUS_STYLE.pending;
                                return (
                                    <tr key={ledger.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                                            {formatDate(ledger.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {ledger.transaction_type === 'credit' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                    <ArrowUpRight className="w-3 h-3" /> Credit
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                    <ArrowDownRight className="w-3 h-3" /> Expense
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.text}`}>
                                                <status.icon className="w-3 h-3" />
                                                {ledger.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-black capitalize tracking-tight">
                                            {ledger.category.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 text-base">
                                            {formatCurrency(ledger.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {ledger.receipt_path ? (
                                                <a 
                                                    href={getFileUrl(ledger.receipt_path)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg group-hover:scale-105 transition-transform"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    View Bill
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold uppercase italic">No Receipt</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs font-medium max-w-xs truncate">
                                            {ledger.description}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-display font-black text-2xl text-slate-800 tracking-tight">Submit Expense</h3>
                                <p className="text-xs text-slate-500 mt-1 font-bold">Attach bills for Super Admin verification</p>
                            </div>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-200 text-slate-500 transition-colors font-black text-xl">&times;</button>
                        </div>
                        <form onSubmit={e => {
                            e.preventDefault();
                            expenseMut.mutate({ ...expenseForm, amount: Number(expenseForm.amount) });
                        }} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Expense Category</label>
                                    <select 
                                        required
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all"
                                    >
                                        <option value="meeting_allowance">Meeting Expense</option>
                                        <option value="branding">Branding / Marketing</option>
                                        <option value="office_expense">Office Expense</option>
                                        <option value="travel">Travel & Transport</option>
                                        <option value="other">Other / Misc</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                                        <input 
                                            type="number"
                                            required
                                            min="1"
                                            value={expenseForm.amount}
                                            onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                                            placeholder="5000"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-8 pr-4 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Upload Receipt / Bill Proof</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${expenseForm.receipt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30'}`}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*,.pdf" 
                                        onChange={handleFileChange} 
                                    />
                                    {expenseForm.receipt ? (
                                        <div className="text-center">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                            <p className="text-xs font-black text-emerald-700 truncate max-w-[200px]">{expenseForm.receipt.name}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 mt-1">Click to change</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs font-black text-slate-500">Upload Receipt</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic">JPG, PNG or PDF (Max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Reason / Description</label>
                                <textarea 
                                    required
                                    rows={3}
                                    value={expenseForm.description}
                                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                                    placeholder="Explain the necessity of this expense..."
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={expenseMut.isPending} className="flex-[2] px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50">
                                    {expenseMut.isPending ? 'Submitting...' : 'Submit Claim'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
