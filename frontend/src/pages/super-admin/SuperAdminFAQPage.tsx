import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    HelpCircle, Trash2, RefreshCcw, Plus,
    Edit2, Save, X, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { faqApi, type FAQ } from '@/services/faqs.api';


const SuperAdminFAQPage: React.FC = () => {
    const queryClient = useQueryClient();

    const [faqForm, setFaqForm] = useState<Partial<FAQ>>({ 
        question: '', 
        answer: '', 
        category: '', 
        sort_order: 0, 
        is_published: true 
    });
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [searchQuery, setSearchQuery] = useState('');



    const { data: faqs = [], isLoading } = useQuery({
        queryKey: ['super-admin-faqs'],
        queryFn: async () => {
            const res = await faqApi.getFaqs();
            return res.data || [];
        },
    });

    const createMutation = useMutation({
        mutationFn: faqApi.createFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-faqs'] });
            toast.success('FAQ created successfully');
            resetForm();
        },
        onError: () => toast.error('Failed to create FAQ'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<FAQ> }) => faqApi.updateFaq(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-faqs'] });
            toast.success('FAQ updated successfully');
            setEditingFaq(null);
            resetForm();
        },
        onError: () => toast.error('Failed to update FAQ'),
    });

    const deleteMutation = useMutation({
        mutationFn: faqApi.deleteFaq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-faqs'] });
            toast.success('FAQ deleted');
        },
        onError: () => toast.error('Failed to delete FAQ'),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: faqApi.toggleStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-faqs'] });
            toast.success('Status updated');
        },
    });

    const resetForm = () => {
        setFaqForm({ question: '', answer: '', category: '', sort_order: 0, is_published: true });
        setEditingFaq(null);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFaq(faq);
        setFaqForm({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            sort_order: faq.sort_order,
            is_published: faq.is_published
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!faqForm.question || !faqForm.answer) return toast.error('Question and Answer are required');

        if (editingFaq) {
            updateMutation.mutate({ id: editingFaq.id, data: faqForm });
        } else {
            createMutation.mutate(faqForm);
        }
    };

    const filteredFaqs = faqs.filter((f: FAQ) =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="flex h-64 items-center justify-center"><RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            <HelpCircle size={28} />
                        </div>
                        Help Center Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage Frequently Asked Questions (FAQs) for the public portal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* FAQ Form Sidebar */}
                <div className="lg:col-span-4">
                    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 space-y-5 sticky top-8 border-t-4 border-t-blue-500">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 text-lg">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h4>
                            {editingFaq && (
                                <button type="button" onClick={resetForm} className="text-slate-400 hover:text-red-500 px-2 py-1 flex items-center gap-1 text-xs font-bold uppercase transition-colors">
                                    <X size={14} /> Clear
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    <span>Category</span>
                                </label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 transition-all text-sm font-semibold"
                                    value={faqForm.category || ''}
                                    onChange={e => setFaqForm(p => ({ ...p, category: e.target.value }))}
                                    placeholder="Enter category name"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Question *</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 transition-all text-sm font-semibold min-h-[80px]"
                                    value={faqForm.question}
                                    onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))}
                                    placeholder="Enter the question..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Answer *</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 transition-all text-sm font-medium min-h-[150px] leading-relaxed"
                                    value={faqForm.answer}
                                    onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))}
                                    placeholder="Enter the answer..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sort Order</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 transition-all text-sm font-bold"
                                        value={faqForm.sort_order}
                                        onChange={e => setFaqForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="flex items-end pb-1 px-1">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={faqForm.is_published}
                                                onChange={e => setFaqForm(p => ({ ...p, is_published: e.target.checked }))}
                                            />
                                            <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Visible</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {createMutation.isPending || updateMutation.isPending ? <RefreshCcw size={18} className="animate-spin" /> : editingFaq ? <Save size={18} /> : <Plus size={18} />}
                            {editingFaq ? 'Update FAQ' : 'Save FAQ'}
                        </button>
                    </form>
                </div>

                {/* FAQ List Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Search Toolbar */}
                    <div className="bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-slate-200/50 shadow-sm flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by question, answer, or category..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 text-sm transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* FAQ Items */}
                    <div className="space-y-4">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq: FAQ) => (
                                <div key={faq.id} className={`group bg-white rounded-3xl border ${editingFaq?.id === faq.id ? 'border-blue-300 ring-4 ring-blue-500/5' : 'border-slate-100 hover:border-slate-200'} shadow-sm p-6 transition-all`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest rounded-lg">
                                                    {faq.category || 'General'}
                                                </span>
                                                <span 
                                                    onClick={() => toggleStatusMutation.mutate(faq.id)}
                                                    className={`cursor-pointer inline-block px-2 py-1 rounded-lg font-bold text-[9px] uppercase tracking-widest ${faq.is_published ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                    title="Toggle Status"
                                                >
                                                    {faq.is_published ? 'Live' : 'Draft'}
                                                </span>
                                                <span className="text-[10px] text-slate-300 font-bold"># {faq.sort_order}</span>
                                            </div>
                                            <h5 className="font-black text-slate-800 text-lg mb-2 leading-snug">{faq.question}</h5>
                                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">{faq.answer}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(faq)}
                                                className="p-3 text-slate-400 hover:text-blue-600 rounded-2xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                                title="Edit FAQ"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Remove this FAQ permanently?')) deleteMutation.mutate(faq.id); }}
                                                className="p-3 text-slate-400 hover:text-red-500 rounded-2xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                title="Delete FAQ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/50 border border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center text-slate-400 backdrop-blur-sm">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <HelpCircle size={40} className="text-slate-300" />
                                </div>
                                <h3 className="font-black text-slate-700 text-xl mb-2">No FAQs Yet</h3>
                                <p className="text-sm max-w-xs mx-auto leading-relaxed">Start creating frequently asked questions to help your customers understand the PM Surya Ghar scheme.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminFAQPage;
