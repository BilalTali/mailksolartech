import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, Send, CheckCircle2, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/axios';

interface TeamMember {
    id: string | number;
    role: string;
    name: string;
    title: string;
}

interface Rating {
    id: number;
    role_rated: string;
    rated_user_id: string | number | null;
    rating: number;
    comments: string | null;
}

export default function ConsumerFeedbackPage() {
    const queryClient = useQueryClient();
    
    // State to hold form data
    const [ratings, setRatings] = useState<Record<string, { rating: number, comments: string, user_id: string | number }>>({});

    const { data, isLoading } = useQuery({
        queryKey: ['consumer-team'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: { team: TeamMember[], ratings: Rating[] } }>('/consumer/team');
            return res.data.data;
        },
    });

    // Initialize state from existing ratings
    useEffect(() => {
        if (data) {
            const initialRatings: Record<string, any> = {};
            data.team.forEach(member => {
                const existing = data.ratings.find(r => r.role_rated === member.role);
                initialRatings[member.role] = {
                    user_id: member.id,
                    rating: existing?.rating || 0,
                    comments: existing?.comments || '',
                };
            });
            setRatings(initialRatings);
        }
    }, [data]);

    const submitMutation = useMutation({
        mutationFn: () => {
            // Convert record to array
            const payload = Object.entries(ratings)
                .filter(([_, v]) => v.rating > 0)
                .map(([role, v]) => ({
                    role,
                    user_id: v.user_id,
                    rating: v.rating,
                    comments: v.comments,
                }));
            
            return api.post('/consumer/rate-team', { ratings: payload });
        },
        onSuccess: () => {
            toast.success('Thank you for your feedback!');
            queryClient.invalidateQueries({ queryKey: ['consumer-team'] });
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || 'Failed to submit feedback');
        }
    });

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    const handleRating = (role: string, value: number) => {
        setRatings(prev => ({
            ...prev,
            [role]: { ...prev[role], rating: value }
        }));
    };

    const handleComment = (role: string, value: string) => {
        setRatings(prev => ({
            ...prev,
            [role]: { ...prev[role], comments: value }
        }));
    };

    const team = data?.team || [];
    const hasExistingRatings = data?.ratings && data.ratings.length > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Rate Your Team</h1>
                    <p className="text-slate-500 text-sm mt-1">Please share your experience with the team members assigned to your project.</p>
                </div>
            </div>

            {hasExistingRatings && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-emerald-800">Feedback Submitted</div>
                        <div className="text-xs text-emerald-600 mt-0.5">You have previously rated your team. You can update your ratings below if you'd like.</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {team.map((member) => (
                    <div key={member.role} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-0 opacity-50" />
                        
                        <div className="relative z-10">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <UserCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{member.name}</h3>
                                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{member.title}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-bold text-slate-700 mb-2">Rating</div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const currentRating = ratings[member.role]?.rating || 0;
                                            return (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRating(member.role, star)}
                                                    className="p-1 hover:scale-110 transition-transform"
                                                >
                                                    <Star 
                                                        className={`w-8 h-8 ${star <= currentRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-bold text-slate-700 mb-2">Comments (Optional)</div>
                                    <textarea
                                        value={ratings[member.role]?.comments || ''}
                                        onChange={(e) => handleComment(member.role, e.target.value)}
                                        rows={3}
                                        placeholder={`How was your experience with ${member.name}?`}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending || Object.values(ratings).every(r => r.rating === 0)}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                    {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Submit Feedback
                </button>
            </div>
        </div>
    );
}
