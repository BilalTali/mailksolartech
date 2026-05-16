import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Offer } from '@/types';
import { offersApi } from '@/services/offers.api';

import {
    Plus, Search, Edit2, Trash2, Target,
    Gift, Users, Clock, ChevronRight, Image as ImageIcon, X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SEOHead from '@/components/shared/SEOHead';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { compressImage } from '@/utils/imageUtils';
import { AdminMyIncentives } from '@/components/admin/AdminMyIncentives';

interface Participant {
    user_id: number;
    name: string;
    agent_id: string;
    role: string;
    total_points: number;
    unredeemed: number;
    redemptions: number;
    last_activity: string | null;
}

export const AdminOffersPage: React.FC = () => {
    const { role } = useAuthStore();
    const isSuperAdmin = role === 'super_admin';
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'manage' | 'personal'>('manage');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
    const [prizeImageFile, setPrizeImageFile] = useState<File | null>(null);
    const [prizeImagePreview, setPrizeImagePreview] = useState<string | null>(null);
    const prizeImageRef = useRef<HTMLInputElement>(null);

    const { data: offersResponse, isLoading } = useQuery({
        queryKey: ['admin-offers'],
        queryFn: offersApi.admin.getAll
    });

    const handleError = (error: any, defaultMsg: string) => {
        const data = error.response?.data;
        if (data?.errors) {
            Object.values(data.errors).flat().forEach((msg: any) => toast.error(msg));
        } else if (data?.message) {
            toast.error(data.message);
        } else {
            toast.error(defaultMsg);
        }
    };

    const createMutation = useMutation({
        mutationFn: (fd: FormData) => offersApi.admin.create(fd as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
            toast.success('Offer created successfully');
            closeModal();
        },
        onError: (err) => handleError(err, 'Failed to create offer')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number, payload: FormData }) =>
            offersApi.admin.update(id, payload as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
            toast.success('Offer updated successfully');
            closeModal();
        },
        onError: (err) => handleError(err, 'Failed to update offer')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => offersApi.admin.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
            toast.success('Offer deleted');
        }
    });

    const openModal = (offer: Offer | null = null) => {
        setEditingOffer(offer);
        setIsModalOpen(true);
        setPrizeImageFile(null);
        setPrizeImagePreview(offer?.prize_image_url ?? null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOffer(null);
        setPrizeImageFile(null);
        setPrizeImagePreview(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this offer?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const rawForm = new FormData(e.currentTarget);

        // Build the final FormData to send — includes file if selected
        const fd = new FormData();
        fd.append('title', rawForm.get('title') as string);
        fd.append('description', rawForm.get('description') as string);
        fd.append('prize_label', rawForm.get('prize_label') as string);
        fd.append('prize_amount', rawForm.get('prize_amount') as string || '0');
        fd.append('offer_from', rawForm.get('offer_from') as string);
        fd.append('offer_to', rawForm.get('offer_to') as string);
        fd.append('target_points', rawForm.get('target_points') as string);
        fd.append('offer_type', rawForm.get('offer_type') as string);
        fd.append('visible_to', rawForm.get('visible_to') as string);
        fd.append('status', rawForm.get('status') as string || 'active');
        fd.append('is_featured', rawForm.get('is_featured') === 'on' ? '1' : '0');
        fd.append('display_order', rawForm.get('display_order') as string || '0');
        if (prizeImageFile) {
            fd.append('prize_image', prizeImageFile);
        }

        if (editingOffer) {
            fd.append('_method', 'PUT');
            updateMutation.mutate({ id: editingOffer.id, payload: fd });
        } else {
            createMutation.mutate(fd);
        }
    };

    const offers = (offersResponse?.data as Offer[]) || [];
    const filteredOffers = offers.filter((o: Offer) =>
        o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.prize_label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            <SEOHead title="Manage Offers | Admin" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Incentive Offers</h1>
                    <p className="text-slate-500 font-medium text-sm">Create and manage target-based rewards for agents</p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 sm:py-3 rounded-2xl sm:rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 w-full sm:w-auto"
                    >
                        <Plus size={20} />
                        New Offer
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/50 p-1 rounded-xl mb-6 max-w-sm">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'manage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Manage Offers
                </button>
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    My Incentives
                </button>
            </div>

            {activeTab === 'personal' ? (
                <AdminMyIncentives />
            ) : (
                <>
                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center">
                        <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or prize..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Offer / Prize</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Target</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visibility</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Wins</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Participants</th>
                                {isSuperAdmin && (
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOffers.map((offer: Offer) => (
                                <tr key={offer.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                <Gift size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                                                    {offer.title}
                                                    {offer.is_featured && (
                                                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full">PINNED</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">{offer.prize_label}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit ${offer.offer_type === 'collective' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {offer.offer_type.toUpperCase()}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Target size={14} className="text-slate-400" />
                                                <span className="text-sm font-bold">{offer.target_points} Pts</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <Users size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium capitalize">{offer.visible_to.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600 space-y-0.5">
                                            <p className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-slate-400" />
                                                {format(new Date(offer.offer_from), 'dd MMM')} - {format(new Date(offer.offer_to), 'dd MMM yy')}
                                            </p>
                                            <p className={`text-[10px] ${offer.days_remaining > 5 ? 'text-indigo-500' : 'text-rose-500'}`}>
                                                {offer.days_remaining} days left
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-900 text-sm font-black">
                                            {offer.redemptions_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight ${offer.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                            offer.status === 'paused' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {offer.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedOfferId(offer.id)}
                                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black hover:bg-indigo-100 transition-all active:scale-95"
                                        >
                                            VIEW LIST
                                        </button>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(offer)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(offer.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOffers.length === 0 && (
                        <div className="py-20 text-center">
                            <Search size={48} className="text-slate-100 mb-4 mx-auto" />
                            <p className="text-slate-500 font-bold italic">No offers found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 mb-8">
                {filteredOffers.map((offer: Offer) => (
                    <div key={offer.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight flex flex-wrap items-center gap-1.5">
                                        {offer.title}
                                        {offer.is_featured && (
                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full">PINNED</span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">{offer.prize_label}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tight ${offer.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                offer.status === 'paused' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {offer.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type & Target</p>
                                <div className="flex flex-col gap-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit ${offer.offer_type === 'collective' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {offer.offer_type.toUpperCase()}
                                    </span>
                                    <p className="text-sm font-bold text-slate-700">{offer.target_points} Pts</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</p>
                                <p className="text-xs font-bold text-slate-700">
                                    {format(new Date(offer.offer_from), 'dd MMM')} - {format(new Date(offer.offer_to), 'dd MMM yy')}
                                </p>
                                <p className={`text-[10px] ${offer.days_remaining > 5 ? 'text-indigo-500' : 'text-rose-500'}`}>
                                    {offer.days_remaining} days left
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visibility</p>
                                <p className="text-xs font-bold text-slate-700 capitalize">{offer.visible_to.replace('_', ' ')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wins</p>
                                <p className="text-xs font-bold text-slate-700">{offer.redemptions_count || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedOfferId(offer.id)}
                                className="flex-grow py-3 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black hover:bg-indigo-100 transition-all active:scale-95"
                            >
                                VIEW PARTICIPANTS
                            </button>
                            {isSuperAdmin && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(offer)}
                                        className="p-3 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(offer.id)}
                                        className="p-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filteredOffers.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
                        <Search size={48} className="text-slate-100 mb-4 mx-auto" />
                        <p className="text-slate-500 font-bold italic">No offers found</p>
                    </div>
                )}
            </div>
            </>
            )}

            {/* Participants Modal */}
            {selectedOfferId && (
                <ParticipantsModal
                    offerId={selectedOfferId}
                    onClose={() => setSelectedOfferId(null)}
                />
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
                        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Offer Title</label>
                                    <input
                                        name="title"
                                        required
                                        defaultValue={editingOffer?.title}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="e.g., Summer Bonanza 2024"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingOffer?.description || ''}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="Detailed rules for this offer..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Prize Value <span className="normal-case text-slate-400">(optional)</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            name="prize_amount"
                                            type="number"
                                            defaultValue={editingOffer?.prize_amount ?? undefined}
                                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Prize Image Upload (Section 5) */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Prize Image <span className="normal-case text-slate-400">(optional)</span></label>
                                    <div
                                        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer min-h-[120px]
                                            flex flex-col items-center justify-center gap-2 transition-all overflow-hidden
                                            ${prizeImagePreview
                                                ? 'border-indigo-300 bg-indigo-50'
                                                : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'}`}
                                    >
                                        <input
                                            ref={prizeImageRef}
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                if (!file) return;
                                                if (file.size > 5 * 1024 * 1024) {
                                                    toast.error('Image too large! Maximum limit is 5MB.');
                                                    return;
                                                }
                                                const toastId = toast.loading('Optimizing image...');
                                                try {
                                                    const compressed = await compressImage(file);
                                                    setPrizeImageFile(compressed);
                                                    setPrizeImagePreview(URL.createObjectURL(compressed));
                                                    toast.dismiss(toastId);
                                                } catch (err) {
                                                    toast.dismiss(toastId);
                                                    toast.error('Failed to compress image');
                                                }
                                            }}
                                        />
                                        {prizeImagePreview ? (
                                            <>
                                                <img src={prizeImagePreview} alt="Prize" className="max-h-20 max-w-full rounded-lg object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPrizeImageFile(null); setPrizeImagePreview(null); if (prizeImageRef.current) prizeImageRef.current.value = ''; }}
                                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 z-20"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                                <p className="text-xs text-slate-500">Click to upload prize image</p>
                                                <p className="text-[10px] text-slate-400">JPG, PNG, WebP · Max 5MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Points</label>
                                    <input
                                        name="target_points"
                                        type="number"
                                        step="0.1"
                                        required
                                        defaultValue={editingOffer?.target_points}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="e.g., 5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valid From</label>
                                    <input
                                        name="offer_from"
                                        type="date"
                                        required
                                        defaultValue={editingOffer?.offer_from ? format(new Date(editingOffer.offer_from), 'yyyy-MM-dd') : ''}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valid To</label>
                                    <input
                                        name="offer_to"
                                        type="date"
                                        required
                                        defaultValue={editingOffer?.offer_to ? format(new Date(editingOffer.offer_to), 'yyyy-MM-dd') : ''}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Offer Type</label>
                                    <select
                                        name="offer_type"
                                        defaultValue={editingOffer?.offer_type || 'individual'}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 bg-slate-50"
                                    >
                                        <option value="individual">Individual (Per Agent)</option>
                                        <option value="collective">Collective (Whole Team Pool)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Visible To</label>
                                    <select
                                        name="visible_to"
                                        defaultValue={editingOffer?.visible_to || 'agents'}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 bg-slate-50"
                                    >
                                        <option value="agents">Agents Only</option>
                                        <option value="super_agents">Super Agents Only</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Offer Status</label>
                                    <select
                                        name="status"
                                        defaultValue={editingOffer?.status || 'active'}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 bg-slate-50"
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="ended">Ended</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-6 md:col-span-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            name="is_featured"
                                            type="checkbox"
                                            id="is_featured"
                                            defaultChecked={editingOffer?.is_featured}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_featured" className="text-sm font-bold text-slate-700">Feature this offer (Pin to Top)</label>
                                    </div>

                                    <div className="flex items-center gap-3 flex-grow">
                                        <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Order:</label>
                                        <input
                                            name="display_order"
                                            type="number"
                                            defaultValue={editingOffer?.display_order || 0}
                                            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-grow py-4 rounded-2xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {editingOffer ? 'SAVE CHANGES' : 'CREATE OFFER'}
                                            <ChevronRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

const ParticipantsModal: React.FC<{ offerId: number, onClose: () => void }> = ({ offerId, onClose }) => {
    const { data: participantsResp, isLoading } = useQuery({
        queryKey: ['admin-offer-participants', offerId],
        queryFn: () => offersApi.admin.getParticipants(offerId)
    });

    const participants = (participantsResp?.data as Participant[]) || [];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
                <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Offer Participants</h2>
                        <p className="text-xs text-slate-500 font-medium">Real-time progress for every registered agent</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : participants.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-medium">No participants found for this offer.</div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Points</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Unredeemed</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Prizes Won</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {participants.map((p: Participant) => (
                                        <tr key={p.user_id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                                <p className="text-[10px] text-indigo-600 font-mono">{p.agent_id}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${p.role === 'super_agent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {p.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{p.total_points}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm font-black text-indigo-600">{p.unredeemed}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black">
                                                    {p.redemptions}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] font-medium text-slate-400">
                                                {p.last_activity || 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
