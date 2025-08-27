import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const loadCartFromStorage = () => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(),
    totalAmount: 0,
    totalItems: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product._id === product._id);
      
      if (existingItem) {
        if (existingItem.quantity + quantity <= product.quantity) {
          existingItem.quantity += quantity;
          toast.success('تم تحديث الكمية في السلة');
        } else {
          toast.error('الكمية المطلوبة غير متوفرة');
          return;
        }
      } else {
        if (quantity <= product.quantity) {
          state.items.push({ product, quantity });
          toast.success('تم إضافة المنتج إلى السلة');
        } else {
          toast.error('الكمية المطلوبة غير متوفرة');
          return;
        }
      }
      
      // Update totals
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      
      // Save to localStorage
      saveCartToStorage(state.items);
    },
    
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.product._id !== productId);
      
      // Update totals
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      
      // Save to localStorage
      saveCartToStorage(state.items);
      toast.success('تم إزالة المنتج من السلة');
    },
    
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.product._id === productId);
      
      if (item) {
        if (quantity <= item.product.quantity && quantity > 0) {
          item.quantity = quantity;
          
          // Update totals
          state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
          state.totalAmount = state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
          
          // Save to localStorage
          saveCartToStorage(state.items);
          toast.success('تم تحديث الكمية');
        } else if (quantity > item.product.quantity) {
          toast.error('الكمية المطلوبة غير متوفرة');
        }
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      localStorage.removeItem('cart');
      // Removed toast to avoid showing notifications when cart is cleared
    },
    
    initializeCart: (state) => {
      // Recalculate totals from items
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  initializeCart 
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalAmount;
export const selectCartItemsCount = (state) => state.cart.totalItems;
export const selectIsInCart = (productId) => (state) => 
  state.cart.items.some(item => item.product._id === productId);