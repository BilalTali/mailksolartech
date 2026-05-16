import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Eye, EyeOff, Reply, Check, MessageSquare, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { feedbacksApi, type AdminFeedback } from '@/services/feedbacks.api';

export const FeedbackManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');

    const { data: feedbacks = [], isLoading } = useQuery({
        queryKey: ['admin-feedbacks'],
        queryFn: feedbacksApi.list,
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, reply }: { id: number, reply: string }) => feedbacksApi.reply(id, reply),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
            toast.success('Reply submitted');
            setReplyingTo(null);
            setReplyText('');
        }
    });

    const deleteFeedbackMutation = useMutation({
        mutationFn: feedbacksApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
            toast.success('Feedback permanently deleted');
        }
    });

    const togglePublishMutation = useMutation({
        mutationFn: feedbacksApi.togglePublish,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
            toast.success('Visibility toggled');
        }
    });

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading testimonials...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {feedbacks.map((f: AdminFeedback) => (
                    <div key={f.id} className={`p - 8 rounded - [2.5rem] border ${f.is_published ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-white'} shadow - sm space - y - 6 transition - all group`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-600 font-black text-xl">
                                    {f.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-display font-black text-slate-800 tracking-tight leading-none text-lg">{f.name}</h4>
                                    <div className="flex gap-0.5 mt-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} size={14} className={i <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100 fill-slate-100'} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                        {f.created_at.slice(0, 10)} {f.email && `· ${f.email} `} {f.phone && `· ${f.phone} `}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => togglePublishMutation.mutate(f.id)} 
                                    className={`flex items - center gap - 2 px - 4 py - 2.5 rounded - 2xl text - [10px] font - black uppercase tracking - widest transition - all ${f.is_published ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white'} shadow - lg`}
                                >
                                    {f.is_published ? <><Eye size={12} /> Public</> : <><EyeOff size={12} /> Hidden</>}
                                </button>
                                <button 
                                    onClick={() => { if (confirm('Permanently delete this customer record?')) deleteFeedbackMutation.mutate(f.id); }} 
                                    className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <MessageSquare className="absolute -left-6 -top-2 text-indigo-600/10" size={40} />
                            <p className="text-slate-700 italic font-medium leading-relaxed pl-4 border-l-4 border-indigo-600/10">"{f.message}"</p>
                        </div>

                        {f.admin_reply && replyingTo !== f.id && (
                            <div className="bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-3xl p-6 shadow-inner animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Reply size={12} className="text-indigo-600" />
                                    <span className="font-black text-indigo-600 text-[10px] uppercase tracking-widest">Official Platform Response</span>
                                </div>
                                <p className="text-sm text-slate-600 font-bold leading-relaxed">{f.admin_reply}</p>
                            </div>
                        )}

                        {replyingTo === f.id ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <textarea 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 text-slate-800 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner h-32" 
                                    placeholder="Draft your official response..." 
                                    value={replyText} 
                                    onChange={e => setReplyText(e.target.value)} 
                                />
                                <div className="flex gap-3 justify-end">
                                    <button 
                                        onClick={() => { setReplyingTo(null); setReplyText(''); }} 
                                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => { if (replyText) replyMutation.mutate({ id: f.id, reply: replyText }); }} 
                                        disabled={replyMutation.isPending} 
                                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                    >
                                        <Check size={12} /> Send Response
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end pr-4">
                                <button 
                                    onClick={() => { setReplyingTo(f.id); setReplyText(f.admin_reply || ''); }} 
                                    className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-800 transition-all group-hover:scale-105"
                                >
                                    <Reply size={14} /> {f.admin_reply ? 'Edit Official Reply' : 'Dispatch Response'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {feedbacks.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <MessageSquare className="text-slate-200 mb-4" size={50} />
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">No customer feedback available at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
