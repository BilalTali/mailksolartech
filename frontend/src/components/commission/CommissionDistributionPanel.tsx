import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DistributionRow from './DistributionRow';
import AddDistributionForm from './AddDistributionForm';
import { Lead } from '../../types';
import toast from 'react-hot-toast';

interface CommissionDistributionPanelProps {
    lead: Lead;
    onUpdateExpenses: (expenses: { label: string; amount: number }[]) => Promise<void>;
    isAdmin: boolean;
}

export default function CommissionDistributionPanel({ lead, onUpdateExpenses, isAdmin }: CommissionDistributionPanelProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const automatedCommissions = lead.commissions || [];
    const otherExpenses = lead.admin_other_expenses || [];

    const handleAddExpense = async (data: { label: string; amount: number }) => {
        setIsPending(true);
        try {
            const newExpenses = [...otherExpenses, data];
            await onUpdateExpenses(newExpenses);
            setShowAddForm(false);
            toast.success('Expense added successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add expense');
        } finally {
            setIsPending(false);
        }
    };

    const handleRemoveExpense = async (index: number) => {
        if (!confirm('Are you sure you want to remove this expense?')) return;
        
        setIsPending(true);
        try {
            const newExpenses = otherExpenses.filter((_, i) => i !== index);
            await onUpdateExpenses(newExpenses);
            toast.success('Expense removed');
        } catch (error: any) {
            toast.error('Failed to remove expense');
        } finally {
            setIsPending(false);
        }
    };

    if (automatedCommissions.length === 0 && otherExpenses.length === 0 && !showAddForm) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium mb-4">No downline distributions or expenses recorded yet.</p>
                {isAdmin && (
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                        + Add Custom Expense
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Downline Distributions & Expenses
                </h3>
                {isAdmin && !showAddForm && (
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Expense
                    </button>
                )}
            </div>

            {/* Automated Downline Commissions */}
            <div className="space-y-2">
                {automatedCommissions.map((comm) => (
                    <DistributionRow
                        key={comm.id}
                        recipientName={comm.payee?.name || 'Unknown'}
                        recipientRole={comm.payee_role}
                        amount={parseFloat(comm.amount.toString())}
                        category="Automated Commission"
                        status={comm.payment_status === 'paid' ? 'paid' : 'pending'}
                        date={comm.created_at || new Date().toISOString()}
                    />
                ))}

                {/* Custom Expenses */}
                {otherExpenses.map((expense, index) => (
                    <div key={`expense-${index}`} className="relative group">
                        <DistributionRow
                            recipientName="Admin Custom Expense"
                            recipientRole="expense"
                            amount={parseFloat(expense.amount.toString())}
                            category={expense.label}
                            status="confirmed"
                            date={lead.updated_at || new Date().toISOString()}
                        />
                        {isAdmin && (
                            <button
                                onClick={() => handleRemoveExpense(index)}
                                disabled={isPending}
                                className="absolute right-[-40px] top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                                title="Remove expense"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {showAddForm && (
                <AddDistributionForm 
                    onSave={handleAddExpense} 
                    onCancel={() => setShowAddForm(false)} 
                    isPending={isPending}
                />
            )}
        </div>
    );
}
