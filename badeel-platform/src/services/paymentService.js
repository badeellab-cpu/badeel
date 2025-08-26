import api from '../config/api';

const paymentService = {
  // Create payment for order
  createPayment: async (orderData) => {
    try {
      const response = await api.post('/payments/create-payment', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في إنشاء عملية الدفع';
    }
  },

  // Confirm payment after Moyasar callback
  confirmPayment: async (orderId, paymentId) => {
    try {
      const response = await api.post('/payments/confirm', {
        orderId,
        paymentId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في تأكيد عملية الدفع';
    }
  },

  // Get payment status
  getPaymentStatus: async (orderId) => {
    try {
      const response = await api.get(`/payments/status/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'فشل في الحصول على حالة الدفع';
    }
  },

  // Load Moyasar script dynamically
  loadMoyasarScript: () => {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      if (window.Moyasar) {
        resolve(window.Moyasar);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.moyasar.com/mpf/1.10.0/moyasar.js';
      script.async = true;
      script.onload = () => resolve(window.Moyasar);
      script.onerror = () => reject(new Error('Failed to load Moyasar script'));
      document.head.appendChild(script);
    });
  },

  // Ensure Moyasar CSS is loaded to avoid distorted UI
  ensureMoyasarStyles: () => {
    if (document.querySelector('link[data-moyasar="css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.moyasar.com/mpf/1.10.0/moyasar.css';
    link.setAttribute('data-moyasar', 'css');
    document.head.appendChild(link);
  },

  // Initialize Moyasar payment form
  initializeMoyasar: async (elementSelector, options) => {
    try {
      await paymentService.loadMoyasarScript();
      paymentService.ensureMoyasarStyles();
      
      // Configure default handlers if not provided
      const defaultOptions = {
        language: 'ar',
        manual_payment: false, // Let Moyasar handle the redirect
        on_failure: (error) => {
          console.error('Moyasar payment failed:', error);
        }
      };
      
      // Initialize Moyasar with the provided options
      window.Moyasar.init({
        element: elementSelector,
        ...defaultOptions,
        ...options
      });
    } catch (error) {
      console.error('Failed to initialize Moyasar:', error);
      throw new Error('فشل في تحميل نموذج الدفع');
    }
  }
};

export default paymentService;
