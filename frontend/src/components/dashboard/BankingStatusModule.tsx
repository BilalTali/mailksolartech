import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building, Banknote, AlertTriangle, FileCheck } from 'lucide-react';
import api from '@/services/axios';
import BankingLeadsModal from './BankingLeadsModal';

interface BankingStats {
    total_leads: number;
    disbursed: number;
    not_proceeded: number;
    signature_pending: number;
    top_performing_bank: string;
    non_performing_bank: string;
}

export default function BankingStatusModule() {
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'disbursed' | 'not_proceeded' | 'signature_pending' | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['banking-stats'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: BankingStats }>('/dashboard/banking-stats');
            return res.data.data;
        },
        refetchInterval: 300000, // 5 mins
    });

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const stats = data ? [
        { id: 'all', label: 'Total Managed Leads', value: data.total_leads, icon: <Building className="w-6 h-6" />, color: 'border-slate-500 text-slate-500', bgHover: 'hover:bg-slate-50' },
        { id: 'disbursed', label: 'Disbursed by Bank', value: data.disbursed, icon: <Banknote className="w-6 h-6" />, color: 'border-emerald-500 text-emerald-500', bgHover: 'hover:bg-emerald-50' },
        { id: 'not_proceeded', label: 'Not Proceeded', value: data.not_proceeded, icon: <AlertTriangle className="w-6 h-6" />, color: 'border-rose-500 text-rose-500', bgHover: 'hover:bg-rose-50' },
        { id: 'signature_pending', label: 'Signature Pending', value: data.signature_pending, icon: <FileCheck className="w-6 h-6" />, color: 'border-amber-500 text-amber-500', bgHover: 'hover:bg-amber-50' },
    ] as const : [];

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-black text-xl text-slate-800 tracking-tight">Banking Status Tracker</h2>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Top Bank: <span className="font-bold">{data?.top_performing_bank || 'N/A'}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        High Rejections: <span className="font-bold">{data?.non_performing_bank || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <button
                        key={stat.id}
                        onClick={() => setSelectedFilter(stat.id)}
                        className={`text-left relative overflow-hidden bg-white p-5 rounded-2xl border-l-4 shadow-sm transition-all duration-300 ${stat.color} ${stat.bgHover} group cursor-pointer hover:shadow-md`}
                    >
                        <div className="relative z-10 flex flex-col gap-1">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className="font-display font-black text-3xl text-slate-800 tracking-tight">{stat.value}</p>
                        </div>
                        <div className={`absolute top-5 right-5 p-2 rounded-xl bg-current/10 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </button>
                ))}
            </div>

            {selectedFilter && (
                <BankingLeadsModal
                    filter={selectedFilter}
                    onClose={() => setSelectedFilter(null)}
                />
            )}
        </div>
    );
}
