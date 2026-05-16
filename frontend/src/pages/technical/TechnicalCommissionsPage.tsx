import { useQuery } from '@tanstack/react-query';
import { Banknote, ClipboardCheck, MapPin } from 'lucide-react';
import api from '@/services/axios';
import { formatCurrency } from '@/utils/formatters';
import type { Commission } from '@/types';

export default function TechnicalCommissionsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['technical-commissions'],
        queryFn: async () => {
            const res = await api.get('/technical/commissions');
            return res.data;
        },
    });

    const commissions: Commission[] = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    My Field Earnings
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Commission records for your technical operations and site visits</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Date', 'Lead', 'Amount', 'Status'].map(h => (
                                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-12 text-slate-400">Loading...</td></tr>
                            ) : commissions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardCheck className="w-10 h-10 text-slate-200" />
                                            <p className="font-medium">No commission records yet.</p>
                                            <p className="text-xs">Commissions are usually recorded after installations are approved.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : commissions.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="text-xs font-mono text-slate-400">#{c.id}</div>
                                        <div className="text-xs text-slate-600 mt-0.5">
                                            {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-medium text-slate-800 text-xs">{(c as any).lead?.beneficiary_name ?? '—'}</div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                            <MapPin className="w-3 h-3" />
                                            {(c as any).lead?.ulid?.slice(-8)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-bold text-emerald-700">{formatCurrency(c.amount)}</span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                                            c.payment_status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {c.payment_status === 'paid' ? 'Settled' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
