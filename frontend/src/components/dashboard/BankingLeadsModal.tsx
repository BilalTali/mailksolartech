import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileCheck } from 'lucide-react';
import api from '@/services/axios';
import LeadStatusBadge from '../shared/LeadStatusBadge';
import { formatDate } from '@/utils/formatters';
import type { LeadStatus } from '@/types';

interface BankingLeadsModalProps {
    filter: 'all' | 'disbursed' | 'not_proceeded' | 'signature_pending';
    onClose: () => void;
}

interface BankingLead {
    id: number;
    beneficiary_name: string;
    beneficiary_bank_name: string | null;
    masked_account: string;
    status: LeadStatus;
    has_signature: boolean;
    created_at: string;
}

interface PaginatedResponse {
    data: BankingLead[];
    current_page: number;
    last_page: number;
    total: number;
}

const FILTER_TITLES = {
    all: 'All Managed Leads',
    disbursed: 'Leads Disbursed by Bank',
    not_proceeded: 'Leads Not Proceeded (Rejected / On Hold)',
    signature_pending: 'Consumer Signature Pending',
};

export default function BankingLeadsModal({ filter, onClose }: BankingLeadsModalProps) {
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['banking-leads', filter, page],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: PaginatedResponse }>(`/dashboard/banking-leads?filter=${filter}&page=${page}&per_page=15`);
            return res.data.data;
        },
    });

    return (
        <div className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] pointer-events-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-display font-black text-slate-800">
                                {FILTER_TITLES[filter]}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                {data ? `Showing ${data.data.length} of ${data.total} leads` : 'Loading...'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : data?.data?.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">ID</th>
                                            <th className="px-4 py-3">Beneficiary</th>
                                            <th className="px-4 py-3">Bank Details</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Signature</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.data.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-mono font-medium text-slate-600">#{lead.id}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-800">{lead.beneficiary_name}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-slate-800 font-medium">{lead.beneficiary_bank_name || <span className="text-slate-400 italic">Not provided</span>}</div>
                                                    <div className="text-slate-500 text-xs font-mono mt-0.5">{lead.masked_account}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <LeadStatusBadge status={lead.status} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    {lead.has_signature ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Uploaded
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Missing
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <FileCheck className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-lg">No leads found</h3>
                                <p className="text-slate-500 text-sm max-w-sm mt-1">There are no leads matching this specific banking criteria.</p>
                            </div>
                        )}
                    </div>

                    {data && data.last_page > 1 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
                            <span className="text-sm text-slate-500 font-medium">
                                Page <span className="font-bold text-slate-800">{data.current_page}</span> of <span className="font-bold text-slate-800">{data.last_page}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page === data.last_page}
                                    onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                                    className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
