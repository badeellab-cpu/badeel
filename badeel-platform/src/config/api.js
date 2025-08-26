import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || 'حدث خطأ غير متوقع';
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
    } else if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية للقيام بهذا الإجراء');
    } else if (error.response?.status === 404) {
      toast.error('المورد المطلوب غير موجود');
    } else if (error.response?.status === 429) {
      toast.error('تم تجاوز عدد الطلبات المسموح، يرجى المحاولة لاحقاً');
    } else if (error.response?.status >= 500) {
      toast.error('خطأ في الخادم، يرجى المحاولة لاحقاً');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => {
    // Handle FormData vs regular data
    if (data instanceof FormData) {
      return api.post('/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      return api.post('/auth/register', data);
    }
  },
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgotpassword', { email }),
  resetPassword: (token, password) => api.put(`/auth/resetpassword/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
};

// Labs API calls
export const labsAPI = {
  getAll: (params) => api.get('/labs', { params }),
  getById: (id) => api.get(`/labs/${id}`),
  getPending: () => api.get('/labs/pending'),
  create: (data) => {
    return api.post('/auth/register', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  approve: (id, data) => api.put(`/labs/${id}/approve`, data),
  reject: (id, data) => api.put(`/labs/${id}/reject`, data),
  suspend: (id, data) => api.put(`/labs/${id}/suspend`, data),
  activate: (id) => api.put(`/labs/${id}/activate`),
  update: (id, data) => api.put(`/labs/${id}`, data),
  getStatistics: (id) => api.get(`/labs/${id}/statistics`),
  getMyDashboard: () => api.get('/labs/my-dashboard'),
  addNote: (id, note) => api.post(`/labs/${id}/notes`, { note }),
};

// Categories API calls
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getTree: () => api.get('/categories/tree'),
  getFeatured: () => api.get('/categories/featured'),
  getById: (id) => api.get(`/categories/${id}`),
  getBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  toggleStatus: (id) => api.put(`/categories/${id}/toggle-status`),
  toggleFeatured: (id) => api.put(`/categories/${id}/toggle-featured`),
  getStatistics: () => api.get('/categories/statistics'),
  reorder: (data) => api.put('/categories/reorder', data),
};

// Products API calls
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getTrending: () => api.get('/products/trending'),
  // Correct path to match backend route '/products/my-products'
  getMyProducts: (params) => api.get('/products/my-products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images' && data[key]) {
        data[key].forEach(image => formData.append('images', image));
      } else if (key === 'shipping' || key === 'exchangePreferences' || key === 'warranty' || key === 'specifications') {
        // Handle nested objects and arrays
        formData.append(key, JSON.stringify(data[key]));
      } else if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    return api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images' && data[key]) {
        data[key].forEach(image => formData.append('images', image));
      } else if (key === 'shipping' || key === 'exchangePreferences' || key === 'warranty' || key === 'specifications') {
        // Handle nested objects and arrays
        formData.append(key, JSON.stringify(data[key]));
      } else if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/products/${id}`),
  approve: (id, data) => api.put(`/products/${id}/approve`, data),
  reject: (id, data) => api.put(`/products/${id}/reject`, data),
  toggleFavorite: (id) => api.put(`/products/${id}/favorite`),
  getStatistics: () => api.get('/products/statistics'),
};

// Orders API calls
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getAsSeller: (params) => api.get('/orders/as-seller', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status, data) => api.put(`/orders/${id}/status`, { status, ...data }),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  getStatistics: () => api.get('/orders/statistics'),
};

// Exchanges API calls
export const exchangesAPI = {
  getAll: (params) => api.get('/exchanges', { params }),
  getMyRequests: (params) => api.get('/exchanges/my-requests', { params }),
  getOnMyProducts: (params) => api.get('/exchanges/on-my-products', { params }),
  getById: (id) => api.get(`/exchanges/${id}`),
  create: (data) => api.post('/exchanges', data),
  respond: (id, data) => api.put(`/exchanges/${id}/respond`, data),
  updateStatus: (id, status, data) => api.put(`/exchanges/${id}/status`, { status, ...data }),
  getStatistics: () => api.get('/exchanges/statistics'),
};

// Wallets API calls
export const walletsAPI = {
  getMyWallet: () => api.get('/wallets/my-wallet'),
  getAllWallets: (params) => api.get('/wallets', { params }),
  getWalletById: (id) => api.get(`/wallets/${id}`),
  addFunds: (id, amount, description) => api.post(`/wallets/${id}/add-funds`, { amount, description }),
  deductFunds: (id, amount, description) => api.post(`/wallets/${id}/deduct-funds`, { amount, description }),
  transfer: (data) => api.post('/wallets/transfer', data),
  getTransactions: (params) => api.get('/wallets/transactions', { params }),
  getAllTransactions: (params) => api.get('/wallets/all-transactions', { params }),
  getTransactionById: (id) => api.get(`/wallets/transactions/${id}`),
  getStatistics: () => api.get('/wallets/statistics'),
};

// Admin API calls
export const adminAPI = {
  getDashboard: (period) => api.get('/admin/dashboard', { params: { period } }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getRevenueAnalytics: (params) => api.get('/admin/revenue-analytics', { params }),
  getUserAnalytics: (params) => api.get('/admin/user-analytics', { params }),
  getSystemHealth: () => api.get('/admin/system-health'),
  getAllProducts: (params) => api.get('/admin/products', { params }),
  getConfirmedOrders: (params) => api.get('/admin/confirmed-orders', { params }),
  updateOrderShipping: (id, data) => api.put(`/admin/orders/${id}/shipping`, data),
  updateExchangeDelivery: (id, data) => api.put(`/admin/exchanges/${id}/delivery`, data),
  updateAcceptedExchangeRequestShipping: (id, data) => api.put(`/admin/exchange-requests/${id}/shipping`, data),
};

// Search API calls
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  getSuggestions: (q) => api.get('/search/suggestions', { params: { q } }),
  getPopular: () => api.get('/search/popular'),
};

// Public API calls
export const publicAPI = {
  getHomeData: () => api.get('/public/home'),
  getProductDetails: (slug) => api.get(`/public/products/${slug}`),
  getLabProfile: (id) => api.get(`/public/labs/${id}`),
};

// Helper function to get image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  // Support passing an image object or array item
  if (typeof path === 'object') {
    if (Array.isArray(path)) {
      const first = path[0];
      if (!first) return null;
      path = first.url || first.path || first.src || first;
    } else {
      path = path.url || path.path || path.src || path.toString?.();
    }
  }
  if (typeof path !== 'string') return null;
  if (path.startsWith('http')) return path;
  // Ensure no leading slash duplication
  const normalized = path.replace(/^\/+/, '');
  return `${BASE_URL}/${normalized}`;
};

export default api;