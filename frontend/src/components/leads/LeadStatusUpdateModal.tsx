import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import { leadsApi } from '@/services/leads.api';
import { LEAD_STATUS_OPTIONS, getLeadStatusLabel } from '@/constants/leadStatuses';
import toast from 'react-hot-toast';
import type { Lead } from '@/types';

interface Props {
    lead: Lead;
    queryKeyToInvalidate: string[];
    triggerButtonText?: string;
    buttonClassName?: string;
}

export function LeadStatusUpdateModal({ 
    lead, 
    queryKeyToInvalidate,
    triggerButtonText = "Update Status",
    buttonClassName = "flex items-center gap-1.5 text-[10px] font-bold text-orange-600 hover:text-orange-800 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 transition-colors uppercase tracking-tight"
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [notes, setNotes] = useState('');
    const qc = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['lead-available-statuses', lead.ulid],
        queryFn: () => leadsApi.getAvailableStatuses(lead.ulid),
        enabled: isOpen,
    });

    const availableStatuses = data?.data?.statuses || [];

    const statusMut = useMutation({
        mutationFn: (formData: FormData) => leadsApi.updateLeadStatus(lead.ulid, formData),
        onSuccess: () => {
            toast.success('Status updated successfully');
            qc.invalidateQueries({ queryKey: queryKeyToInvalidate });
            setIsOpen(false);
            setNewStatus('');
            setNotes('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatus) return;

        if ((newStatus === 'REJECTED' || newStatus === 'FILE_DISBURSED') && !notes.trim()) {
            toast.error(newStatus === 'REJECTED' ? 'Reason for rejection is required' : 'Reference number is required');
            return;
        }

        const fd = new FormData();
        fd.append('status', newStatus);
        if (notes) fd.append('notes', notes);

        statusMut.mutate(fd);
    };

    return (
        <>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                className={buttonClassName}
                aria-label="Update lead status"
            >
                <RefreshCw size={12} /> {triggerButtonText}
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Update Status</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {lead.ulid?.slice(-8)}</p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {isLoading ? (
                                <div className="py-8 flex justify-center">
                                    <RefreshCw className="animate-spin text-orange-500" size={24} />
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Cannot fetch statuses</p>
                                        <p className="text-xs mt-1">You may not have permission to update this lead's status right now.</p>
                                    </div>
                                </div>
                            ) : availableStatuses.length === 0 ? (
                                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl flex items-start gap-3 text-sm">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">No updates available</p>
                                        <p className="text-xs mt-1">This lead is currently in a state where you cannot change its status.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</label>
                                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium">
                                            {getLeadStatusLabel(lead.status)}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Status</label>
                                        <select
                                            value={newStatus}
                                            onChange={e => setNewStatus(e.target.value)}
                                            required
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                        >
                                            <option value="">Select a status...</option>
                                            {LEAD_STATUS_OPTIONS.filter(opt => availableStatuses.includes(opt.value)).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {newStatus === 'REJECTED'
                                                ? 'Reason for Rejection *' 
                                                : newStatus === 'FILE_DISBURSED' 
                                                    ? 'Reference Number *' 
                                                    : 'Notes (Optional)'}
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            required={newStatus === 'REJECTED' || newStatus === 'FILE_DISBURSED'}
                                            rows={3}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                            placeholder={newStatus === 'REJECTED' 
                                                ? 'Enter the reason provided by the bank...' 
                                                : newStatus === 'FILE_DISBURSED' 
                                                    ? 'Enter the disbursement reference number...' 
                                                    : 'Add any remarks for this status change...'}
                                        />
                                    </div>

                                    <div className="pt-2 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newStatus || statusMut.isPending}
                                            className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {statusMut.isPending && <RefreshCw size={14} className="animate-spin" />}
                                            {statusMut.isPending ? 'Saving...' : 'Update Status'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
