import { PiggyBank, TrendingDown, ArrowDownRight, TrendingUp } from 'lucide-react';

interface EarningsOverviewCardProps {
    totalProfit: number;
    activeLeadsCount: number;
    role: string;
    // Optional breakdown data
    totalReceived?: number;
    totalDownlines?: number;
    totalExpenses?: number;
}

function fmt(n: number) {
    return Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function EarningsOverviewCard({
    totalProfit,
    activeLeadsCount,
    role,
    totalReceived = 0,
    totalDownlines = 0,
    totalExpenses = 0,
}: EarningsOverviewCardProps) {
    const isPositive = totalProfit >= 0;
    const isAdminRole = role === 'admin' || role === 'super_admin';

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 mb-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                {/* ── Net Profit (main) ─────────────────────────────── */}
                <div className={`relative p-6 md:col-span-1 overflow-hidden ${isPositive ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    <div className="absolute inset-0 opacity-10">
                        <PiggyBank className="absolute -bottom-4 -right-4 w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">
                            {isAdminRole ? 'Net Profit (All Leads)' : 'Net Commission'}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl text-white/80 font-bold">₹</span>
                            <span className="text-4xl font-black text-white tracking-tight">{fmt(totalProfit)}</span>
                        </div>
                        {!isPositive && totalProfit !== 0 && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                Deficit
                            </span>
                        )}
                        <p className="mt-3 text-[10px] text-white/60 font-medium">
                            {isAdminRole ? 'After downlines & expenses' : 'Cumulative commission earned'}
                        </p>
                    </div>
                </div>

                {/* ── Received from SA ──────────────────────────────── */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                            Total Received<br />from Super Admin
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">₹{fmt(totalReceived)}</div>
                    <div className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">Gross allocation</div>
                </div>

                {/* ── Passed to Downlines ───────────────────────────── */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                            Passed to<br />Downlines
                        </span>
                    </div>
                    <div className="text-2xl font-black text-rose-600">₹{fmt(totalDownlines)}</div>
                    <div className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-widest">Agents · Enumerators · Tech</div>
                </div>

                {/* ── Expenses (Ledger + Lead-level) ────────────────── */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <TrendingDown className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                            Expenses<br />&amp; Ledger
                        </span>
                    </div>
                    <div className="text-2xl font-black text-amber-600">₹{fmt(totalExpenses)}</div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Records</span>
                        <span className="font-black text-slate-700">{activeLeadsCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
