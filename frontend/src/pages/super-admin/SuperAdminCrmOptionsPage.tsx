import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Settings, Plus, Edit2, Trash2, Save, X, 
    CheckCircle, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { crmOptionsApi, type CrmOption } from '@/services/crmOptions.api';

const CATEGORIES = [
    { value: 'system_capacity', label: 'System Capacity (kW)' },
    { value: 'discom_name', label: 'Electricity DISCOMs' },
    { value: 'roof_size', label: 'Roof Size Ranges' }
];

export default function SuperAdminCrmOptionsPage() {
    const qc = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        label: '',
        value: '',
        sort_order: 0,
        is_active: true,
        category: CATEGORIES[0].value
    });

    const { data, isLoading } = useQuery({
        queryKey: ['admin-crm-options', selectedCategory],
        queryFn: () => crmOptionsApi.getAll(selectedCategory)
    });

    const options = data?.data ?? [];

    const createMut = useMutation({
        mutationFn: crmOptionsApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crm-options'] });
            toast.success('Option added successfully');
            setIsAdding(false);
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add option')
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: number, data: Partial<CrmOption> }) => crmOptionsApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crm-options'] });
            toast.success('Option updated');
            setIsEditing(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed')
    });

    const deleteMut = useMutation({
        mutationFn: crmOptionsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-crm-options'] });
            toast.success('Option deleted');
        },
        onError: () => toast.error('Failed to delete')
    });

    const resetForm = () => {
        setFormData({
            label: '',
            value: '',
            sort_order: options.length + 1,
            is_active: true,
            category: selectedCategory
        });
    };

    const handleEdit = (opt: CrmOption) => {
        setIsEditing(opt.id);
        setFormData({
            label: opt.label,
            value: opt.value,
            sort_order: opt.sort_order,
            is_active: opt.is_active,
            category: opt.category
        });
    };

    const handleSave = () => {
        if (!formData.label || !formData.value) {
            toast.error('Label and Value are required');
            return;
        }

        if (isEditing) {
            updateMut.mutate({ id: isEditing, data: formData });
        } else {
            createMut.mutate({ ...formData, category: selectedCategory });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-orange-500" /> CRM Options Manager
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage dropdown options for Lead Registration forms globally</p>
                </div>
                
                <button
                    onClick={() => { setIsAdding(true); resetForm(); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition"
                >
                    <Plus size={18} /> Add New Option
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => { setSelectedCategory(cat.value); setIsAdding(false); setIsEditing(null); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            selectedCategory === cat.value 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sort</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Label (What User Sees)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">System Value</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isAdding && (
                                <tr className="bg-orange-50/50 animate-in fade-in slide-in-from-top-1">
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number" 
                                            value={formData.sort_order}
                                            onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                                            className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-orange-400"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 5 kW"
                                            value={formData.label}
                                            onChange={e => setFormData({...formData, label: e.target.value})}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-400"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 5kw"
                                            value={formData.value}
                                            onChange={e => setFormData({...formData, value: e.target.value})}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 font-mono"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.is_active}
                                                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                                className="w-4 h-4 rounded text-green-500 border-slate-300 focus:ring-green-500"
                                            />
                                            <span className="text-xs font-semibold text-slate-600">Active</span>
                                        </label>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Save">
                                                <Save size={18} />
                                            </button>
                                            <button onClick={() => setIsAdding(false)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Cancel">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <RefreshCw className="animate-spin inline-block mr-2" size={20} /> Loading options...
                                    </td>
                                </tr>
                            ) : options.length === 0 && !isAdding ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Layers className="mx-auto text-slate-200 mb-2" size={40} />
                                        <p className="text-slate-400">No options found for this category.</p>
                                    </td>
                                </tr>
                            ) : options.map((opt: CrmOption) => (
                                <tr key={opt.id} className={`group hover:bg-slate-50 transition-colors ${isEditing === opt.id ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        {isEditing === opt.id ? (
                                            <input 
                                                type="number" 
                                                value={formData.sort_order}
                                                onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                                                className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono text-slate-400">{opt.sort_order}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isEditing === opt.id ? (
                                            <input 
                                                type="text" 
                                                value={formData.label}
                                                onChange={e => setFormData({...formData, label: e.target.value})}
                                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isEditing === opt.id ? (
                                            <input 
                                                type="text" 
                                                value={formData.value}
                                                onChange={e => setFormData({...formData, value: e.target.value})}
                                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono"
                                            />
                                        ) : (
                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{opt.value}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isEditing === opt.id ? (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.is_active}
                                                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                                    className="w-4 h-4 rounded text-green-500 border-slate-300"
                                                />
                                                <span className="text-xs font-semibold text-slate-600">Active</span>
                                            </label>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                opt.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {opt.is_active ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                {opt.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isEditing === opt.id ? (
                                                <>
                                                    <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Save changes">
                                                        <Save size={18} />
                                                    </button>
                                                    <button onClick={() => setIsEditing(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" title="Cancel">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(opt)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure? Existing leads using this value will not be affected, but it will be removed from the form.')) {
                                                                deleteMut.mutate(opt.id);
                                                            }
                                                        }} 
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg" 
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                <div className="text-sm text-indigo-800">
                    <p className="font-bold mb-1">Architectural Note:</p>
                    <p>These options are cached for performance. Any changes here will immediately invalidate the background cache, and within 1 hour, the public website form will reflect the new values. <span className="font-bold underline">System Value</span> should be unique per category and should ideally be in lowercase slug format.</p>
                </div>
            </div>

            {selectedCategory === 'system_capacity' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 mt-4">
                    <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
                    <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">Important: Capacity Points Configuration</p>
                        <p>Adding a new capacity here only makes it appear in the Lead form dropdown. <strong>It will earn 0 points by default.</strong> To assign points to this new capacity, you must also configure it in the <span className="font-bold">Points Config</span> page.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

