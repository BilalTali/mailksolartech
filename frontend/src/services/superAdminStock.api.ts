import api from './axios';

export const superAdminStockApi = {
  // List all dispatches
  getDispatches: (params?: any) => api.get('/super-admin/stock-dispatches', { params }),

  // Get form data (admins + inventory catalogue)
  getFormData: () => api.get('/super-admin/stock-dispatches/form-data'),

  // Create new dispatch
  createDispatch: (data: any) => api.post('/super-admin/stock-dispatches', data),

  // Get dispatch detail
  getDispatch: (id: number) => api.get(`/super-admin/stock-dispatches/${id}`),
};
