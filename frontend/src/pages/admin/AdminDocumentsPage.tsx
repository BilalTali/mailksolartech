import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Trash2, ChevronDown, Check, RefreshCcw, Upload,
    Image as ImageIcon, Download, Tag, Search, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi, type AdminDocument } from '@/services/documents.api';
import { compressImage } from '@/utils/imageUtils';

const AdminDocumentsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [docForm, setDocForm] = useState({ title: '', description: '', category: '', is_published: true });
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docThumb, setDocThumb] = useState<File | null>(null);
    const [editingDoc, setEditingDoc] = useState<AdminDocument | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: adminDocs = [], isLoading } = useQuery({
        queryKey: ['admin-documents'],
        queryFn: documentsApi.list,
    });

    const createMutation = useMutation({
        mutationFn: documentsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
            toast.success('Document uploaded successfully');
            setDocForm({ title: '', description: '', category: '', is_published: true });
            setDocFile(null);
            setDocThumb(null);
        },
        onError: () => toast.error('Failed to upload document'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, fd }: { id: number; fd: FormData }) => documentsApi.update(id, fd),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
            toast.success('Document updated successfully');
            setEditingDoc(null);
            setDocFile(null);
            setDocThumb(null);
        },
        onError: () => toast.error('Failed to update document'),
    });

    const deleteMutation = useMutation({
        mutationFn: documentsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
            toast.success('Document deleted');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!docForm.title) return toast.error('Title is required');
        if (!editingDoc && !docFile) return toast.error('Document file is required');

        const fd = new FormData();
        Object.entries(docForm).forEach(([k, v]) => {
            if (k === 'is_published') {
                fd.append(k, v ? '1' : '0');
            } else {
                fd.append(k, String(v));
            }
        });
        if (docFile) fd.append('file', docFile);
        if (docThumb) fd.append('thumbnail', docThumb);

        if (editingDoc) {
            updateMutation.mutate({ id: editingDoc.id, fd });
        } else {
            createMutation.mutate(fd);
        }
    };

    const filteredDocs = adminDocs.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="flex h-64 items-center justify-center"><RefreshCcw className="w-8 h-8 text-accent animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText className="text-accent" /> Agent Resource Library
                    </h1>
                    <p className="text-slate-500 text-sm">Upload and manage resources, training materials, and documents for agents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Sidebar */}
                <div className="lg:col-span-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-8">
                        <h4 className="font-bold text-slate-800 text-lg mb-2">{editingDoc ? 'Edit Document' : 'Upload New Resource'}</h4>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title *</label>
                            <input
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm"
                                value={docForm.title}
                                onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Sales Training PDF"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm"
                                    value={docForm.category}
                                    onChange={e => setDocForm(p => ({ ...p, category: e.target.value }))}
                                    placeholder="e.g. Training"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                            <textarea
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white transition-all text-sm min-h-[80px]"
                                value={docForm.description}
                                onChange={e => setDocForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Short description..."
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">File *</label>
                                <label className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-accent/50 cursor-pointer transition-colors text-sm text-slate-500 overflow-hidden">
                                    <Upload className="w-4 h-4 shrink-0" />
                                    <span className="truncate flex-1 text-center">{docFile ? docFile.name : 'Choose file...'}</span>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={async e => {
                                        const file = e.target.files?.[0] || null;
                                        if (!file) return;
                                        if (file.size > 5 * 1024 * 1024) {
                                            toast.error('File must be under 5MB.');
                                            return;
                                        }
                                        if (file.type.startsWith('image/')) {
                                            const toastId = toast.loading('Optimizing image...');
                                            try {
                                                const compressed = await compressImage(file);
                                                setDocFile(compressed);
                                                toast.dismiss(toastId);
                                            } catch (err) {
                                                toast.dismiss(toastId);
                                                toast.error('Failed to process image');
                                                setDocFile(file);
                                            }
                                        } else {
                                            setDocFile(file);
                                        }
                                    }} />
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thumbnail (Optional)</label>
                                <label className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-accent/50 cursor-pointer transition-colors text-sm text-slate-500 overflow-hidden">
                                    <ImageIcon className="w-4 h-4 shrink-0" />
                                    <span className="truncate flex-1 text-center">{docThumb ? docThumb.name : 'Choose image...'}</span>
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={async e => {
                                        const file = e.target.files?.[0] || null;
                                        if (!file) return;
                                        if (file.size > 5 * 1024 * 1024) {
                                            toast.error('Image must be under 5MB.');
                                            return;
                                        }
                                        const toastId = toast.loading('Optimizing image...');
                                        try {
                                            const compressed = await compressImage(file);
                                            setDocThumb(compressed);
                                            toast.dismiss(toastId);
                                        } catch (err) {
                                            toast.dismiss(toastId);
                                            toast.error('Failed to process image');
                                            setDocThumb(file);
                                        }
                                    }} />
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                            >
                                {createMutation.isPending || updateMutation.isPending ? <RefreshCcw size={16} className="animate-spin" /> : editingDoc ? <Check size={16} /> : <Upload size={16} />}
                                {editingDoc ? 'Save Changes' : 'Upload Now'}
                            </button>
                            {editingDoc && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingDoc(null);
                                        setDocForm({ title: '', description: '', category: '', is_published: true });
                                        setDocFile(null);
                                        setDocThumb(null);
                                    }}
                                    className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl font-bold border border-slate-100"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search documents by title or category..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent text-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Docs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDocs.map((d: AdminDocument) => (
                            <div key={d.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex gap-4 hover:border-accent/30 transition-all group">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 relative shadow-inner">
                                    {d.thumbnail_url ? (
                                        <img src={d.thumbnail_url} alt={d.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <FileText size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-bold text-slate-800 truncate leading-tight mb-1">{d.title}</h5>
                                        {d.category && <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent font-black text-[9px] uppercase tracking-wider rounded-md mb-2">{d.category}</span>}
                                        <p className="text-xs text-slate-500 line-clamp-1">{d.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <a
                                            href={d.file_url!}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                                            title="View in Browser"
                                        >
                                            <Eye size={12} /> View
                                        </a>
                                        <a
                                            href={d.download_url!}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                                            title="Download File"
                                        >
                                            <Download size={12} /> Download
                                        </a>
                                        <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingDoc(d);
                                                    setDocForm({
                                                        title: d.title,
                                                        description: d.description || '',
                                                        category: d.category || '',
                                                        is_published: d.is_published
                                                    });
                                                    setDocFile(null);
                                                    setDocThumb(null);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-accent rounded-lg hover:bg-slate-100"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Delete this resource?')) deleteMutation.mutate(d.id); }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredDocs.length === 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <FileText size={24} className="opacity-20" />
                            </div>
                            <p className="font-bold text-slate-600">No documents found</p>
                            <p className="text-sm">Try a different search or upload a new resource</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDocumentsPage;
