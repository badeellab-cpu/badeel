import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import exchangesReducer from './slices/exchangesSlice';
import walletReducer from './slices/walletSlice';
import labsReducer from './slices/labsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    cart: cartReducer,
    orders: ordersReducer,
    exchanges: exchangesReducer,
    wallet: walletReducer,
    labs: labsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;