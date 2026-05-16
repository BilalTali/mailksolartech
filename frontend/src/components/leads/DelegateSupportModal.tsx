import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, User, MessageSquare, X, Loader2 } from 'lucide-react';
import api from '@/services/axios';
import toast from 'react-hot-toast';
import { ApiResponse, User as UserType } from '@/types';

interface DelegateSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadUlid: string;
    beneficiaryName: string;
}

export const DelegateSupportModal: React.FC<DelegateSupportModalProps> = ({ 
    isOpen, onClose, leadUlid, beneficiaryName 
}) => {
    const queryClient = useQueryClient();
    const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const { data: techRes, isLoading: isTechLoading } = useQuery({
        queryKey: ['admin', 'technical-team'],
        enabled: isOpen,
        queryFn: async () => {
            const response = await api.get<ApiResponse<any>>('/admin/technical-team', {
                params: { per_page: 100 }
            });
            return response.data;
        }
    });

    const technicians: UserType[] = Array.isArray(techRes?.data) 
        ? techRes.data 
        : techRes?.data?.data || [];

    const delegateMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTeamMember) throw new Error('Please select a team member');
            if (!message) throw new Error('Please enter instruction message');
            
            const res = await api.post(`/admin/leads/${leadUlid}/delegate-ticket`, { 
                team_member_id: parseInt(selectedTeamMember), 
                message 
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Support task delegated to technical team successfully!');
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'monitor-leads'] });
            onClose();
            setMessage('');
            setSelectedTeamMember('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || err.message || 'Failed to delegate task');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                            <Send size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Delegate Support Task</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Lead: {beneficiaryName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <User size={12} /> Select Technical Team Member
                        </label>
                        <div className="relative">
                            {isTechLoading ? (
                                <div className="w-full h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
                                    <Loader2 size={16} className="animate-spin text-slate-400" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Team...</span>
                                </div>
                            ) : (
                                <select 
                                    value={selectedTeamMember}
                                    onChange={(e) => setSelectedTeamMember(e.target.value)}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-bold text-slate-700 text-sm appearance-none"
                                >
                                    <option value="">Select Technician...</option>
                                    {technicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>{tech.name} ({tech.agent_id || 'ID N/A'})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <MessageSquare size={12} /> Actionable Instructions
                        </label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g. Visit consumer to verify panel cleaning, check inverter fault log, etc."
                            className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium text-slate-700 text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                    <button 
                        onClick={() => delegateMutation.mutate()}
                        disabled={delegateMutation.isPending || !selectedTeamMember || !message}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {delegateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        Confirm Delegation
                    </button>
                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-6">
                        This action will notify the team member and mark this lead as having a pending support task in their portal.
                    </p>
                </div>
            </div>
        </div>
    );
};
