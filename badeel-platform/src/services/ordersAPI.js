import api from '../config/api';

const ordersAPI = {
  // Get all orders for the current user
  getOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب الطلبات';
    }
  },

  // Get single order details
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب تفاصيل الطلب';
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في إلغاء الطلب';
    }
  },

  // Track order
  trackOrder: async (orderNumber) => {
    try {
      const response = await api.get(`/orders/track/${orderNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في تتبع الطلب';
    }
  }
};

export default ordersAPI;
