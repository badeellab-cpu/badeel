import api from '../config/api';

const exchangeAPI = {
  // Exchange Requests
  createExchangeRequest: async (requestData) => {
    try {
      const response = await api.post('/exchange-requests', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في إرسال طلب التبادل';
    }
  },

  getExchangeRequests: async (params = {}) => {
    try {
      const response = await api.get('/exchange-requests', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب طلبات التبادل';
    }
  },

  getExchangeRequest: async (requestId) => {
    try {
      const response = await api.get(`/exchange-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب تفاصيل طلب التبادل';
    }
  },

  respondToExchangeRequest: async (requestId, responseData) => {
    try {
      const response = await api.put(`/exchange-requests/${requestId}/respond`, responseData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في الرد على طلب التبادل';
    }
  },

  withdrawExchangeRequest: async (requestId, reason) => {
    try {
      const response = await api.put(`/exchange-requests/${requestId}/withdraw`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في سحب طلب التبادل';
    }
  },

  getExchangeRequestStats: async () => {
    try {
      const response = await api.get('/exchange-requests/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب إحصائيات طلبات التبادل';
    }
  },

  // Exchanges
  getExchanges: async (params = {}) => {
    try {
      const response = await api.get('/exchanges', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب عمليات التبادل';
    }
  },

  getExchange: async (exchangeId) => {
    try {
      const response = await api.get(`/exchanges/${exchangeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب تفاصيل التبادل';
    }
  },

  updateExchangeStatus: async (exchangeId, status, data = {}) => {
    try {
      const response = await api.put(`/exchanges/${exchangeId}/status`, { status, ...data });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في تحديث حالة التبادل';
    }
  },

  addExchangeMessage: async (exchangeId, message, attachments = []) => {
    try {
      const response = await api.post(`/exchanges/${exchangeId}/messages`, {
        message,
        attachments
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في إرسال الرسالة';
    }
  },

  markMessagesAsRead: async (exchangeId) => {
    try {
      const response = await api.put(`/exchanges/${exchangeId}/messages/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في تحديث حالة الرسائل';
    }
  },

  rateExchange: async (exchangeId, rating, comment) => {
    try {
      const response = await api.post(`/exchanges/${exchangeId}/rate`, {
        rating,
        comment
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في تقييم التبادل';
    }
  },

  reportDispute: async (exchangeId, reason, evidence = []) => {
    try {
      const response = await api.post(`/exchanges/${exchangeId}/dispute`, {
        reason,
        evidence
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في الإبلاغ عن المشكلة';
    }
  },

  getExchangeStats: async () => {
    try {
      const response = await api.get('/exchanges/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب إحصائيات التبادل';
    }
  }
};

export default exchangeAPI;
