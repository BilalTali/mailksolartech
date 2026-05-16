import api from './axios';

export const adminInventoryApi = {
  // Get current stock ledger
  getMyStock: () => api.get('/admin/inventory/my-stock'),

  // Get incoming dispatches from Super Admin
  getIncoming: () => api.get('/admin/inventory/incoming'),

  // Confirm receipt of a dispatch
  confirmReceipt: (id: number, data: any) => {
    const formData = new FormData();
    
    // Append items as JSON or separate fields? My backend expects array.
    // In multipart/form-data, arrays are usually item[0][key].
    data.items.forEach((item: any, index: number) => {
      formData.append(`items[${index}][dispatch_item_id]`, item.dispatch_item_id.toString());
      formData.append(`items[${index}][received_quantity]`, item.received_quantity.toString());
      formData.append(`items[${index}][condition]`, item.condition);
      if (item.notes) formData.append(`items[${index}][notes]`, item.notes);
    });

    if (data.geo_photo) formData.append('geo_photo', data.geo_photo);
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    if (data.notes) formData.append('notes', data.notes);

    return api.post(`/admin/inventory/incoming/${id}/confirm`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
