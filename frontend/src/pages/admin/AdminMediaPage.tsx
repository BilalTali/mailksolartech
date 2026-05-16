import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Award, Plus, Trash2, ChevronDown, Check, RefreshCcw, Image as ImageIcon,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mediaApi, type AdminMedia } from '@/services/media.api';
import { compressImage } from '@/utils/imageUtils';

const AdminMediaPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [mediaForm, setMediaForm] = useState({ title: '', winner_name: '', description: '', date: '', is_published: true });
    const [mediaImage, setMediaImage] = useState<File | null>(null);
    const [editingMedia, setEditingMedia] = useState<AdminMedia | null>(null);

    const { data: media = [], isLoading } = useQuery({
        queryKey: ['admin-media'],
        queryFn: mediaApi.list,
    });

    const createMutation = useMutation({
        mutationFn: mediaApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-media'] });
            queryClient.invalidateQueries({ queryKey: ['public-media'] });
            toast.success('Media entry added');
            setMediaForm({ title: '', winner_name: '', description: '', date: '', is_published: true });
            setMediaImage(null);
        },
        onError: () => toast.error('Failed to add media'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, fd }: { id: number; fd: FormData }) => mediaApi.update(id, fd),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-media'] });
            queryClient.invalidateQueries({ queryKey: ['public-media'] });
            toast.success('Media entry updated');
            setEditingMedia(null);
        },
        onError: () => toast.error('Failed to update media'),
    });

    const deleteMutation = useMutation({
        mutationFn: mediaApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-media'] });
            queryClient.invalidateQueries({ queryKey: ['public-media'] });
            toast.success('Deleted');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaForm.title) return toast.error('Title is required');
        const fd = new FormData();
        Object.entries(mediaForm).forEach(([k, v]) => {
            if (k === 'is_published') {
                fd.append(k, v ? '1' : '0');
            } else {
                fd.append(k, String(v));
            }
        });
        if (mediaImage) fd.append('image', mediaImage);

        if (editingMedia) {
            updateMutation.mutate({ id: editingMedia.id, fd });
        } else {
            createMutation.mutate(fd);
        }
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><RefreshCcw className="w-8 h-8 text-accent animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Award className="text-accent" /> Reward Winners (Media)
                    </h1>
                    <p className="text-slate-500 text-sm">Manage announcements and reward winners displayed on the public page</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-8">
                        <h4 className="font-bold text-slate-800 text-lg mb-2">{editingMedia ? 'Edit Entry' : 'Add New Entry'}</h4>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title *</label>
                            <input
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm"
                                value={mediaForm.title}
                                onChange={e => setMediaForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Best Performer Feb 24"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Winner Name</label>
                            <input
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm"
                                value={mediaForm.winner_name}
                                onChange={e => setMediaForm(p => ({ ...p, winner_name: e.target.value }))}
                                placeholder="e.g. Rahul Sharma"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm"
                                    value={mediaForm.date}
                                    onChange={e => setMediaForm(p => ({ ...p, date: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                            <textarea
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm min-h-[100px]"
                                value={mediaForm.description}
                                onChange={e => setMediaForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Details about the award..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image/Photo</label>
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:border-accent/50 cursor-pointer transition-all bg-slate-50/50 relative overflow-hidden">
                                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                                    <span className="text-xs font-medium text-slate-500">{mediaImage ? mediaImage.name : 'Click to upload image'}</span>
                                    <input
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
                                                setMediaImage(compressed);
                                                toast.dismiss(toastId);
                                            } catch (err) {
                                                toast.dismiss(toastId);
                                                toast.error('Failed to process image');
                                                setMediaImage(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Published toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-xs font-bold text-slate-700">Show on Public Page</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Visible at andleebsurya.in/media</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMediaForm(p => ({ ...p, is_published: !p.is_published }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${mediaForm.is_published ? 'bg-primary' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${mediaForm.is_published ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                            >
                                {createMutation.isPending || updateMutation.isPending ? <RefreshCcw size={16} className="animate-spin" /> : editingMedia ? <Check size={16} /> : <Plus size={16} />}
                                {editingMedia ? 'Save Changes' : 'Add Media'}
                            </button>
                            {editingMedia && (
                                    <button
                                    type="button"
                                    onClick={() => {
                                        setEditingMedia(null);
                                        setMediaForm({ title: '', winner_name: '', description: '', date: '', is_published: true });
                                        setMediaImage(null);
                                    }}
                                    className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl font-bold border border-slate-100"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h4 className="font-bold text-slate-800">Media Entries</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {media.map((m: AdminMedia) => (
                                <div key={m.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                                        {m.image_url ? (
                                            <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ImageIcon size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-slate-800 truncate">{m.title}</h5>
                                        {m.winner_name && <p className="text-xs font-bold text-accent mb-0.5 tracking-tight flex items-center gap-1.5">Winner: {m.winner_name}</p>}
                                        <p className="text-xs text-slate-500 mb-1 line-clamp-1">{m.description || 'No description'}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                                                <Calendar size={10} /> {m.date || 'No date'}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${m.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {m.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingMedia(m);
                                                setMediaForm({
                                                    title: m.title,
                                                    winner_name: m.winner_name || '',
                                                    description: m.description || '',
                                                    date: m.date || '',
                                                    is_published: m.is_published
                                                });
                                                setMediaImage(null);
                                            }}
                                            className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <ChevronDown size={18} />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Delete this entry?')) deleteMutation.mutate(m.id); }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {media.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    <Award size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="font-medium">No media entries yet</p>
                                    <p className="text-xs">Add reward winners using the form on the left</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMediaPage;
