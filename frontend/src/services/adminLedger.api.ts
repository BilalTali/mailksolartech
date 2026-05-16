import api from './axios';

export const adminLedgerApi = {
    // Get ledger records (filtered by admin_id if Super Admin)
    getAll: (params?: any) => api.get('/admin/ledger', { params }),

    // Admin submits an expense with receipt
    submitExpense: (data: { category: string; amount: number; description: string; receipt?: File }) => {
        const formData = new FormData();
        formData.append('category', data.category);
        formData.append('amount', data.amount.toString());
        formData.append('description', data.description);
        if (data.receipt) {
            formData.append('receipt', data.receipt);
        }
        return api.post('/admin/ledger/expense', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Super Admin grants an allowance
    grantAllowance: (data: { admin_id: number; category: string; amount: number; description: string }) => 
        api.post('/admin/ledger/allowance', data),

    // Super Admin Workflow
    approve: (id: number) => api.put(`/super-admin/ledger/${id}/approve`),
    reject: (id: number, reason: string) => api.put(`/super-admin/ledger/${id}/reject`, { rejection_reason: reason }),
    markPaid: (id: number, data: { payment_method: string; payment_reference?: string }) => 
        api.put(`/super-admin/ledger/${id}/mark-paid`, data),
};
