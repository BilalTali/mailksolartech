import { X, Filter, Trash2 } from 'lucide-react';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterField {
    id: string;
    label: string;
    type: 'select' | 'text';
    options?: FilterOption[];
    placeholder?: string;
}

interface MobileFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    fields: FilterField[];
    values: Record<string, string>;
    onChange: (id: string, value: string) => void;
    onClear: () => void;
    title?: string;
}

export default function MobileFilterModal({
    isOpen,
    onClose,
    fields,
    values,
    onChange,
    onClear,
    title = 'Filters'
}: MobileFilterModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white sm:hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-orange-500" />
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-50 transition-colors"
                >
                    <X size={24} className="text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <label htmlFor={field.id} className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {field.label}
                        </label>
                        {field.type === 'select' ? (
                            <select
                                id={field.id}
                                value={values[field.id] || ''}
                                onChange={(e) => onChange(field.id, e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            >
                                <option value="">All {field.label}s</option>
                                {field.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={field.id}
                                type="text"
                                placeholder={field.placeholder || `Search ${field.label}...`}
                                value={values[field.id] || ''}
                                onChange={(e) => onChange(field.id, e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                    onClick={() => {
                        onClear();
                        onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-white transition-all bg-white"
                >
                    <Trash2 size={16} /> Reset All
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
}
