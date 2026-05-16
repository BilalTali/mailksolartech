import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { leadsApi } from '@/services/leads.api';
import type { Lead, ApiResponse, PaginatedResponse } from '@/types';
import { LeadDocumentsModal } from '@/components/leads/LeadDocumentsModal';

export default function AdminLeadDocumentsPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery<ApiResponse<PaginatedResponse<Lead>>>({
        queryKey: ['admin-leads-documents', search, page],
        queryFn: () => leadsApi.getAdminLeads({
            search: search || undefined,
            page,
            per_page: 50,
        }),
    });

    const leads: Lead[] = data?.data?.data ?? [];
    const total = data?.data?.total ?? 0;
    const lastPage = data?.data?.last_page ?? 1;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Lead Documents</h1>
                <p className="text-sm text-slate-600 mt-0.5">
                    View and manage documents for all leads
                    {total > 0 && <span className="ml-1 text-slate-500">({total} total)</span>}
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search beneficiary name, mobile..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-80"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">S.No.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Ref / ULID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Mobile Number</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Documents</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-12 text-slate-400">Loading leads...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400">No leads found.</p>
                                    </td>
                                </tr>
                            ) : leads.map((lead, idx) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-600 w-20">{(page - 1) * 50 + idx + 1}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{lead.ulid}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{lead.beneficiary_name}</td>
                                    <td className="px-4 py-3 text-slate-600">{lead.beneficiary_mobile}</td>
                                    <td className="px-4 py-3">
                                        <LeadDocumentsModal ulid={lead.ulid} triggerButtonText="View Documents" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {lastPage > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-sm gap-3">
                        <span className="text-slate-500">Page {page} of {lastPage}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={page === lastPage}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
