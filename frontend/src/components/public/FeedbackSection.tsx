import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicApi, type PublicFeedback, type PublicSettingsData } from '@/services/public.api';
import { MessageSquare, CheckCircle2, User } from 'lucide-react';
import toast from 'react-hot-toast';

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange?.(i)}
                    className={`text-xl transition-colors ${i <= value ? 'text-amber-400' : onChange ? 'text-neutral-300 hover:text-amber-300' : 'text-neutral-200'}`}
                >★</button>
            ))}
        </div>
    );
}

export default function FeedbackSection() {
    const qc = useQueryClient();
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', rating: 5 });

    const { data: settings } = useQuery<PublicSettingsData>({
        queryKey: ['public-settings'],
        queryFn: publicApi.getSettings,
    });

    const { data: feedbacks = [] } = useQuery({
        queryKey: ['public-feedbacks'],
        queryFn: publicApi.getFeedbacks,
        staleTime: 5 * 60 * 1000,
    });

    const mutation = useMutation({
        mutationFn: publicApi.submitFeedback,
        onSuccess: () => {
            setSubmitted(true);
            qc.invalidateQueries({ queryKey: ['public-feedbacks'] });
        },
        onError: () => toast.error('Failed to submit feedback. Please try again.'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.message) return toast.error('Name and message are required');
        mutation.mutate(form);
    };

    return (
        <section id="feedback" className="py-20 bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 text-accent font-semibold text-sm mb-3">
                        <MessageSquare className="w-4 h-4" /> Customer Feedback
                    </div>
                    <h2 className="font-display font-bold text-3xl text-dark mb-3">What Our Customers Say</h2>
                    <p className="text-neutral-600 max-w-xl mx-auto">Real experiences from real homeowners we've helped</p>
                </div>

                {/* Published Feedbacks */}
                {feedbacks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
                        {feedbacks.map((f: PublicFeedback) => (
                            <div key={f.id} className="card flex flex-col gap-3">
                                <StarRating value={f.rating} />
                                <p className="text-neutral-700 text-sm flex-1 italic">"{f.message}"</p>
                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-semibold text-sm text-dark">{f.name}</span>
                                    <span className="text-xs text-neutral-400 ml-auto">{f.date}</span>
                                </div>
                                {f.admin_reply && (
                                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs text-neutral-600">
                                        <span className="font-bold text-primary">{settings?.company_name || 'SuryaMitra'} Team:</span> {f.admin_reply}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit Form */}
                <div className="max-w-xl mx-auto">
                    <div className="card">
                        <h3 className="font-display font-bold text-xl text-dark mb-1">Share Your Experience</h3>
                        <p className="text-neutral-500 text-sm mb-6">We'd love to hear from you</p>

                        {submitted ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                                <p className="font-semibold text-dark">Thank you for your feedback!</p>
                                <p className="text-sm text-neutral-500 mt-1">Our team will review and publish it soon.</p>
                                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '', rating: 5 }); }} className="btn-ghost mt-4 text-sm">Submit Another</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="label">Your Rating *</label>
                                    <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Name *</label>
                                        <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="label">Phone (Optional)</label>
                                        <input className="input" placeholder="+91..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Email (Optional)</label>
                                    <input className="input" type="email" placeholder={`info@${(settings?.company_name || 'suryamitra').toLowerCase().replace(/\s+/g, '')}.in`} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label">Your Message *</label>
                                    <textarea className="input" rows={4} placeholder="Tell us about your experience..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                                </div>
                                <button type="submit" disabled={mutation.isPending} className="btn-primary">
                                    {mutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
