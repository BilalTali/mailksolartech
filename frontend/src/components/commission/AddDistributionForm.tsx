import { useState } from 'react';
import { IndianRupee, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddDistributionFormProps {
    onSave: (data: { label: string; amount: number }) => Promise<void>;
    onCancel: () => void;
    isPending?: boolean;
}

export default function AddDistributionForm({ onSave, onCancel, isPending }: AddDistributionFormProps) {
    const [label, setLabel] = useState('');
    const [amount, setAmount] = useState('');

    const handleSave = async () => {
        if (label.trim().length < 3) {
            toast.error('Expense label must be at least 3 characters');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }

        await onSave({ label: label.trim(), amount: numAmount });
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-50 mt-4 mb-2">
            <h4 className="text-sm font-bold text-indigo-900 mb-4">Add Custom Expense</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Expense Label / Description
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Extra Transport, Labour Cost"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm bg-slate-50 focus:bg-white"
                        disabled={isPending}
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Amount (₹)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IndianRupee className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm bg-slate-50 focus:bg-white font-medium"
                            disabled={isPending}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-5 border-t border-slate-100">
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isPending || !label.trim() || !amount}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isPending ? 'Saving...' : 'Save Expense'}
                </button>
            </div>
        </div>
    );
}
