import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FieldDefinition {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'radio';
    placeholder?: string;
    options?: string[];  // For radio type: e.g. ['yes', 'no']
}

interface SettingJsonEditorProps {
    value: string;
    onChange: (newValue: string) => void;
    fields: FieldDefinition[];
    label?: string;
}

export const SettingJsonEditor: React.FC<SettingJsonEditorProps> = ({
    value,
    onChange,
    fields,
    label
}) => {
    const items = React.useMemo(() => {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }, [value]);

    const updateItems = (newItems: any[]) => {
        onChange(JSON.stringify(newItems));
    };

    const handleItemChange = (index: number, key: string, val: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [key]: val };
        updateItems(newItems);
    };

    const addItem = () => {
        const newItem = fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
        updateItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        updateItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
                    <button 
                        onClick={addItem}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-all"
                    >
                        <Plus size={12} /> Add Entry
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="group relative bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 transition-all hover:border-indigo-100 hover:bg-white">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => removeItem(idx)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map(f => (
                                <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block ml-1">{f.label}</label>
                                    {f.type === 'textarea' ? (
                                        <textarea
                                            value={item[f.key] || ''}
                                            onChange={e => handleItemChange(idx, f.key, e.target.value)}
                                            placeholder={f.placeholder}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all h-24"
                                        />
                                    ) : f.type === 'radio' ? (
                                        <div className="flex gap-2 mt-1">
                                            {(f.options ?? ['yes', 'no']).map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => handleItemChange(idx, f.key, opt)}
                                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                                                        item[f.key] === opt
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type={f.type}
                                            value={item[f.key] || ''}
                                            onChange={e => handleItemChange(idx, f.key, e.target.value)}
                                            placeholder={f.placeholder}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                        <p className="text-slate-400 text-xs font-medium">No entries defined yet.</p>
                        <button 
                            onClick={addItem}
                            className="mt-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                        >
                            Create first entry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
