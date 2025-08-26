import api from '../config/api';

const productsAPI = {
  // Get my products (for lab users)
  getMyProducts: async (params = {}) => {
    try {
      const response = await api.get('/products/my-products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب المنتجات';
    }
  },

  // Get all products
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب المنتجات';
    }
  },

  // Get single product
  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب تفاصيل المنتج';
    }
  },

  // Create product
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في إنشاء المنتج';
    }
  },

  // Update product
  updateProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في تحديث المنتج';
    }
  },

  // Delete product
  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في حذف المنتج';
    }
  },

  // Search products
  searchProducts: async (query, filters = {}) => {
    try {
      const response = await api.get('/search', { 
        params: { 
          q: query,
          ...filters 
        } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في البحث';
    }
  },

  // Get related products
  getRelatedProducts: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}/related`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب المنتجات المشابهة';
    }
  },

  // Toggle favorite
  toggleFavorite: async (productId) => {
    try {
      const response = await api.post(`/products/${productId}/favorite`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في إضافة/إزالة المفضلة';
    }
  },

  // Get favorites
  getFavorites: async (params = {}) => {
    try {
      const response = await api.get('/products/favorites', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في جلب المفضلات';
    }
  }
};

export default productsAPI;
