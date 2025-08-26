import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  mobileMenuOpen: false,
  cartDrawerOpen: false,
  searchModalOpen: false,
  notificationsOpen: false,
  theme: localStorage.getItem('theme') || 'light',
  loading: false,
  pageTransition: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleCartDrawer: (state) => {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
    setCartDrawerOpen: (state, action) => {
      state.cartDrawerOpen = action.payload;
    },
    toggleSearchModal: (state) => {
      state.searchModalOpen = !state.searchModalOpen;
    },
    setSearchModalOpen: (state, action) => {
      state.searchModalOpen = action.payload;
    },
    toggleNotifications: (state) => {
      state.notificationsOpen = !state.notificationsOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPageTransition: (state, action) => {
      state.pageTransition = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleCartDrawer,
  setCartDrawerOpen,
  toggleSearchModal,
  setSearchModalOpen,
  toggleNotifications,
  setTheme,
  setLoading,
  setPageTransition,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectUI = (state) => state.ui;
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectCartDrawerOpen = (state) => state.ui.cartDrawerOpen;