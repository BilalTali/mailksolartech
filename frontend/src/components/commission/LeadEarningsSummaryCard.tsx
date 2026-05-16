import { useState } from 'react';
import { Lock, Plus, Trash2, TrendingUp, TrendingDown, ArrowDownRight, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import { Lead } from '../../types';
import { adminCommissionsApi } from '../../services/commissions.api';
import toast from 'react-hot-toast';

interface LeadEarningsSummaryCardProps {
    lead: Lead;
    role: string;
    onUpdate?: () => void;
}

const ROLE_LABEL: Record<string, string> = {
    super_agent: 'Business Dev. Manager',
    agent: 'Agent',
    enumerator: 'Enumerator',
    field_technical_team: 'Field Technician',
    installer: 'Installer',
    surveyor: 'Surveyor',
};

const ROLE_COLOR: Record<string, string> = {
    super_agent: 'bg-orange-100 text-orange-700',
    agent: 'bg-blue-100 text-blue-700',
    enumerator: 'bg-indigo-100 text-indigo-700',
    field_technical_team: 'bg-amber-100 text-amber-700',
    installer: 'bg-amber-100 text-amber-700',
    surveyor: 'bg-emerald-100 text-emerald-700',
};

function fmt(n: number) {
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function LeadEarningsSummaryCard({ lead, role, onUpdate }: LeadEarningsSummaryCardProps) {
    const isAdmin = role === 'admin' || role === 'super_admin';
    const [showDownlines, setShowDownlines] = useState(true);
    const [showExpenses, setShowExpenses] = useState(true);
    const [isPending, setIsPending] = useState(false);

    // Add expense form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newExpenseLabel, setNewExpenseLabel] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');

    if (!isAdmin) return null;

    // ── Data ──────────────────────────────────────────────────────
    const receivedCommission = Number(lead.admin_received_commission ?? 0);
    const receivedMeeting = Number(lead.admin_meeting_allowance ?? 0);
    const receivedOther = Number(lead.admin_additional_expenses ?? 0);
    const totalReceived = receivedCommission + receivedMeeting + receivedOther;

    const downlineCommissions: any[] = (lead.commissions ?? []).filter((c: any) => c.payee_role !== 'admin');
    const totalDownlines = downlineCommissions.reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);

    const otherExpenses: { label: string; amount: number }[] = lead.admin_other_expenses ?? [];
    const totalOtherExpenses = otherExpenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);

    const netProfit = totalReceived - totalDownlines - totalOtherExpenses;
    const isProfit = netProfit >= 0;

    // ── Handlers ──────────────────────────────────────────────────
    const handleAddExpense = async () => {
        const label = newExpenseLabel.trim();
        const amount = parseFloat(newExpenseAmount);
        if (!label || isNaN(amount) || amount <= 0) {
            toast.error('Enter a valid expense label and amount.');
            return;
        }
        setIsPending(true);
        try {
            await adminCommissionsApi.updateAdminExpenses(lead.ulid, {
                expenses: [...otherExpenses, { label, amount }],
            });
            toast.success('Expense added.');
            setNewExpenseLabel('');
            setNewExpenseAmount('');
            setShowAddForm(false);
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to add expense.');
        } finally {
            setIsPending(false);
        }
    };

    const handleRemoveExpense = async (index: number) => {
        if (!confirm('Remove this expense?')) return;
        setIsPending(true);
        try {
            await adminCommissionsApi.updateAdminExpenses(lead.ulid, {
                expenses: otherExpenses.filter((_, i) => i !== index),
            });
            toast.success('Expense removed.');
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error('Failed to remove expense.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 overflow-hidden bg-white">

            {/* ── HEADER: Received from Super Admin (LOCKED) ─────────────── */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border-b border-indigo-100 px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Received from Super Admin</h3>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Read-only · Set by Super Admin</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-indigo-100 px-4 py-3 shadow-sm">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Commission</span>
                        <div className="flex items-center gap-0.5">
                            <span className="text-xs text-slate-400">₹</span>
                            <span className="text-lg font-black text-slate-800">{fmt(receivedCommission)}</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 px-4 py-3 shadow-sm">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Meeting Allow.</span>
                        <div className="flex items-center gap-0.5">
                            <span className="text-xs text-slate-400">₹</span>
                            <span className="text-lg font-black text-slate-800">{fmt(receivedMeeting)}</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 px-4 py-3 shadow-sm">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Add. Expenses</span>
                        <div className="flex items-center gap-0.5">
                            <span className="text-xs text-slate-400">₹</span>
                            <span className="text-lg font-black text-slate-800">{fmt(receivedOther)}</span>
                        </div>
                    </div>
                </div>

                {/* Total Received */}
                <div className="mt-4 flex items-center justify-between bg-indigo-600 text-white rounded-xl px-5 py-3 shadow-lg shadow-indigo-200">
                    <span className="text-xs font-black uppercase tracking-widest">Total Received</span>
                    <span className="text-2xl font-black tracking-tight">₹{fmt(totalReceived)}</span>
                </div>
            </div>

            {/* ── DOWNLINE COMMISSIONS ────────────────────────────────────── */}
            <div className="border-b border-slate-100">
                <button
                    onClick={() => setShowDownlines(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="text-left">
                            <span className="text-sm font-black text-slate-700">Commissions Passed to Downlines</span>
                            <span className="block text-[10px] font-bold text-rose-500">
                                {downlineCommissions.length} record{downlineCommissions.length !== 1 ? 's' : ''} · ₹{fmt(totalDownlines)} total
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-base font-black text-rose-600">- ₹{fmt(totalDownlines)}</span>
                        {showDownlines ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                </button>

                {showDownlines && (
                    <div className="px-6 pb-4 space-y-2">
                        {downlineCommissions.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No downline commissions recorded yet.
                            </div>
                        ) : (
                            downlineCommissions.map((c: any) => {
                                const roleLabel = ROLE_LABEL[c.payee_role] ?? c.payee_role?.replace(/_/g, ' ');
                                const roleColor = ROLE_COLOR[c.payee_role] ?? 'bg-slate-100 text-slate-600';
                                return (
                                    <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                                <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-slate-800">{c.payee?.name ?? 'Unknown'}</span>
                                                <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${roleColor}`}>{roleLabel}</span>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {c.payment_status === 'paid' ? (
                                                        <span className="text-emerald-600 font-bold">✓ Paid</span>
                                                    ) : (
                                                        <span className="text-amber-600 font-bold">⏳ Pending payout</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-base font-black text-rose-600">₹{fmt(Number(c.amount))}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ── OTHER EXPENSES (editable by admin) ─────────────────────── */}
            <div className="border-b border-slate-100">
                <button
                    onClick={() => setShowExpenses(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <span className="text-sm font-black text-slate-700">Other Expenses</span>
                            <span className="block text-[10px] font-bold text-amber-600">
                                {otherExpenses.length} item{otherExpenses.length !== 1 ? 's' : ''} · ₹{fmt(totalOtherExpenses)} total
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-base font-black text-amber-600">- ₹{fmt(totalOtherExpenses)}</span>
                        {showExpenses ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                </button>

                {showExpenses && (
                    <div className="px-6 pb-4 space-y-2">
                        {otherExpenses.map((expense, index) => (
                            <div key={index} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 group">
                                <div>
                                    <span className="text-sm font-bold text-slate-700">{expense.label}</span>
                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Custom Expense</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-base font-black text-amber-700">₹{fmt(Number(expense.amount))}</span>
                                    <button
                                        onClick={() => handleRemoveExpense(index)}
                                        disabled={isPending}
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                                        title="Remove expense"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add expense form */}
                        {showAddForm ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Expense</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Label</label>
                                        <input
                                            type="text"
                                            value={newExpenseLabel}
                                            onChange={e => setNewExpenseLabel(e.target.value)}
                                            placeholder="e.g. Travel, Office"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={newExpenseAmount}
                                            onChange={e => setNewExpenseAmount(e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setShowAddForm(false); setNewExpenseLabel(''); setNewExpenseAmount(''); }}
                                        className="flex-1 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddExpense}
                                        disabled={isPending || !newExpenseLabel.trim() || !newExpenseAmount}
                                        className="flex-1 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-40"
                                    >
                                        {isPending ? 'Saving...' : 'Add Expense'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Custom Expense
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── PROFIT WATERFALL ────────────────────────────────────────── */}
            <div className="px-6 py-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Profit Calculation</p>

                <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-xl">
                        <span className="text-sm font-bold text-indigo-700">Total Received</span>
                        <span className="font-black text-indigo-800">₹{fmt(totalReceived)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3">
                        <span className="text-sm font-medium text-slate-600">Less: Downline Commissions</span>
                        <span className="font-bold text-rose-500">- ₹{fmt(totalDownlines)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3">
                        <span className="text-sm font-medium text-slate-600">Less: Other Expenses</span>
                        <span className="font-bold text-amber-500">- ₹{fmt(totalOtherExpenses)}</span>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-dashed border-slate-200 my-2" />

                    {/* Net Profit */}
                    <div className={`flex items-center justify-between px-4 py-3.5 rounded-2xl shadow-sm ${isProfit ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                        <div className="flex items-center gap-2">
                            {isProfit
                                ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                                : <TrendingDown className="w-5 h-5 text-rose-600" />
                            }
                            <span className={`text-base font-black uppercase tracking-widest ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                                Your {isProfit ? 'Profit' : 'Deficit'}
                            </span>
                        </div>
                        <span className={`text-2xl font-black tracking-tight ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                            ₹{fmt(Math.abs(netProfit))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
