import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { getMe } from './store/slices/authSlice';
import { initializeCart } from './store/slices/cartSlice';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

// Public Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Labs from './pages/Labs';
import LabProfile from './pages/LabProfile';
import Exchange from './pages/Exchange';
import About from './pages/About';
import Contact from './pages/Contact';
import SearchResults from './pages/SearchResults';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';


// Cart & Checkout
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminLabs from './pages/admin/Labs';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminExchanges from './pages/admin/Exchanges';
import AdminWallets from './pages/admin/Wallets';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';

// Lab Pages
import LabLayout from './components/lab/LabLayout';
import LabDashboard from './pages/lab/Dashboard';
import LabProducts from './pages/lab/Products';

import LabExchangeOrders from './pages/lab/ExchangeOrders';
import LabExchangeRequests from './pages/lab/ExchangeRequests';
import LabOrders from './pages/lab/Orders';
import LabWallet from './pages/lab/Wallet';
import LabReports from './pages/lab/Reports';

// Error Pages
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize cart from localStorage
      store.dispatch(initializeCart());
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await store.dispatch(getMe()).unwrap();
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      }
      
      setLoading(false);
    };

    initializeApp();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Admin Routes - Separate Layout */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/labs" element={<AdminLabs />} />
                    <Route path="/products" element={<AdminProducts />} />
                    <Route path="/categories" element={<AdminCategories />} />
                    <Route path="/orders" element={<AdminOrders />} />
                    <Route path="/exchanges" element={<AdminExchanges />} />
                    <Route path="/wallets" element={<AdminWallets />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/settings" element={<AdminSettings />} />
                    <Route path="/reports" element={<AdminReports />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Lab Routes - Separate Layout */}
            <Route path="/lab/*" element={
              <ProtectedRoute allowedRoles={['lab']}>
                <LabLayout>
                  <Routes>
                    <Route path="/" element={<LabDashboard />} />
                    <Route path="/products" element={<LabProducts />} />
                    <Route path="/exchange-orders" element={<LabExchangeOrders />} />
                    <Route path="/exchange-requests" element={<LabExchangeRequests />} />
                    <Route path="/orders" element={<LabOrders />} />
                    <Route path="/wallet" element={<LabWallet />} />
                    <Route path="/reports" element={<LabReports />} />
                  </Routes>
                </LabLayout>
              </ProtectedRoute>
            } />

            {/* Main Site Layout */}
            <Route path="/*" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 pt-20">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/labs" element={<Labs />} />
                    <Route path="/labs/:id" element={<LabProfile />} />
                    <Route path="/exchange" element={<Exchange />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/search" element={<SearchResults />} />
                    
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    
                    {/* Cart & Checkout */}
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="/order-success/:id" element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    } />
                    
                    {/* User Dashboard Routes - Removed (system is only for labs) */}
                    
                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                padding: '16px',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;