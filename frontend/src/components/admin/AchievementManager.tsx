import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Trophy, Check, ChevronDown, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { achievementsApi, type AdminAchievement } from '@/services/achievements.api';
import { compressImage } from '@/utils/imageUtils';

export const AchievementManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [achForm, setAchForm] = useState({ title: '', winner_name: '', description: '', date: '', is_published: true });
    const [achImage, setAchImage] = useState<File | null>(null);
    const [editingAch, setEditingAch] = useState<AdminAchievement | null>(null);
    const achImageRef = useRef<HTMLInputElement>(null);

    const { data: achievements = [], isLoading } = useQuery({
        queryKey: ['admin-achievements'],
        queryFn: achievementsApi.list,
    });

    const createAchMutation = useMutation({
        mutationFn: achievementsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
            toast.success('Achievement added');
            setAchForm({ title: '', winner_name: '', description: '', date: '', is_published: true });
            setAchImage(null);
            if (achImageRef.current) achImageRef.current.value = '';
        }
    });

    const updateAchMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => achievementsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
            toast.success('Achievement updated');
            setEditingAch(null);
            setAchForm({ title: '', winner_name: '', description: '', date: '', is_published: true });
            setAchImage(null);
            if (achImageRef.current) achImageRef.current.value = '';
        }
    });

    const deleteAchMutation = useMutation({
        mutationFn: achievementsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
            toast.success('Achievement deleted');
        }
    });

    const handleAchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!achForm.title) return toast.error('Title is required');

        const fd = new FormData();
        fd.append('title', achForm.title);
        fd.append('winner_name', achForm.winner_name);
        fd.append('description', achForm.description);
        fd.append('date', achForm.date);
        fd.append('is_published', achForm.is_published ? '1' : '0');
        if (achImage) fd.append('image', achImage);

        if (editingAch) {
            updateAchMutation.mutate({ id: editingAch.id, data: fd });
        } else {
            createAchMutation.mutate(fd);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading achievements...</div>;

    return (
        <div className="space-y-6">
            {/* Form */}
            <form onSubmit={handleAchSubmit} className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100 shadow-inner">
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                    {editingAch ? <Check size={16} className="text-indigo-600" /> : <Plus size={16} className="text-indigo-600" />}
                    {editingAch ? 'Edit Achievement Authority' : 'Add Achievement Authority'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title *</label>
                        <input 
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-600 outline-none transition-all text-sm" 
                            value={achForm.title} 
                            onChange={e => setAchForm(p => ({ ...p, title: e.target.value }))} 
                            placeholder="e.g. 500 Homes Powered!" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                        <input 
                            type="date" 
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-600 outline-none transition-all text-sm" 
                            value={achForm.date} 
                            onChange={e => setAchForm(p => ({ ...p, date: e.target.value }))} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Achiever Name</label>
                        <input 
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-600 outline-none transition-all text-sm" 
                            value={achForm.winner_name} 
                            onChange={e => setAchForm(p => ({ ...p, winner_name: e.target.value }))} 
                            placeholder="e.g. Malik Surya" 
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-600 outline-none transition-all text-sm" 
                        rows={2} 
                        value={achForm.description} 
                        onChange={e => setAchForm(p => ({ ...p, description: e.target.value }))} 
                        placeholder="Short description..." 
                    />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                    <div className="flex-1 w-full space-y-1 relative">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Image</label>
                        <div className="relative border border-slate-200 rounded-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer overflow-hidden">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 flex items-center justify-center gap-2">
                                <Plus size={12} /> {achImage ? achImage.name : 'Choose file...'}
                            </span>
                            <input 
                                ref={achImageRef} 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                                onChange={async e => {
                                    const file = e.target.files?.[0] || null;
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error('Image must be under 5MB.');
                                        return;
                                    }
                                    const toastId = toast.loading('Optimizing image...');
                                    try {
                                        const compressed = await compressImage(file);
                                        setAchImage(compressed);
                                        toast.dismiss(toastId);
                                    } catch (err) {
                                        toast.dismiss(toastId);
                                        toast.error('Failed to process image');
                                        setAchImage(file);
                                    }
                                }} 
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {editingAch && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingAch(null);
                                    setAchForm({ title: '', winner_name: '', description: '', date: '', is_published: true });
                                    setAchImage(null);
                                }} 
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            type="submit" 
                            disabled={createAchMutation.isPending || updateAchMutation.isPending} 
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                            {editingAch ? <><Check size={14} /> Update Authority</> : <><Plus size={14} /> Add Achievement</>}
                        </button>
                    </div>
                </div>
            </form>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {achievements.map((a: AdminAchievement) => (
                    <div key={a.id} className="group flex items-center gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex shrink-0 items-center justify-center">
                            {a.image_url ? (
                                <img src={a.image_url} alt={a.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <Trophy size={30} className="text-slate-200" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h4 className="font-display font-black text-slate-800 text-lg truncate tracking-tight">{a.title}</h4>
                                {a.is_published ? (
                                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full"><Eye size={10} /> Published</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full"><EyeOff size={10} /> Private</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                {a.date && <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{a.date}</p>}
                                {a.winner_name && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-slate-200 pl-4">{a.winner_name}</p>}
                                <p className="text-xs text-slate-400 line-clamp-1 border-l border-slate-200 pl-4">{a.description || 'No detailed records'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setEditingAch(a);
                                    setAchForm({ title: a.title, winner_name: a.winner_name || '', description: a.description || '', date: a.date || '', is_published: a.is_published });
                                }} 
                                className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                                <ChevronDown size={16} />
                            </button>
                            <button 
                                onClick={() => { if (confirm('Permanently revoke this achievement?')) deleteAchMutation.mutate(a.id); }} 
                                className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {achievements.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <Trophy className="text-slate-200 mb-4" size={50} />
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">No platform achievements recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
