import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon as SearchIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as XIcon,
  BellIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  CogIcon,
  HomeIcon,
  BeakerIcon,
  CubeIcon,
  ArrowsRightLeftIcon as SwapHorizontalIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import Logo from '../common/Logo';
import { selectAuth, selectIsAuthenticated, selectIsAdmin, logout } from '../../store/slices/authSlice';
import { selectCartItemsCount } from '../../store/slices/cartSlice';
import { setCartDrawerOpen, setSearchModalOpen, setMobileMenuOpen } from '../../store/slices/uiSlice';
import CartDrawer from '../cart/CartDrawer';
import SearchModal from '../search/SearchModal';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const cartItemsCount = useSelector(selectCartItemsCount);
  
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const navLinks = [
    { name: 'الرئيسية', path: '/', icon: HomeIcon },
    { name: 'المنتجات', path: '/products', icon: CubeIcon },
    { name: 'التبادل', path: '/exchange', icon: SwapHorizontalIcon },
    { name: 'المختبرات', path: '/labs', icon: BeakerIcon },
  ];

  const userMenuItems = [
    { name: 'لوحة التحكم', path: isAdmin ? '/admin' : '/lab', icon: CogIcon },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-100' 
            : 'bg-white/80 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 space-x-reverse">
              <Logo size="md" animated={true} />
              <span className="text-gray-700 text-sm hidden sm:block">منصة تبادل الأجهزة الطبية</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8 space-x-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="group relative"
                >
                  <span className="text-gray-700 hover:text-brand-blue font-medium transition-colors flex items-center gap-2">
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-blue to-brand-blueSecondary transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(setSearchModalOpen(true))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <SearchIcon className="w-6 h-6 text-gray-700" />
              </motion.button>

              {/* Cart */}
              {!isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch(setCartDrawerOpen(true))}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ShoppingCartIcon className="w-6 h-6 text-gray-700" />
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {/* Notifications */}
              {isAuthenticated && <NotificationDropdown />}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-blueSecondary rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0)}
                    </div>
                    <span className="text-gray-700 font-medium hidden sm:block">{user?.name}</span>
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <div className="py-2">
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <item.icon className="w-4 h-4 ml-3" />
                              {item.name}
                            </Link>
                          ))}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogoutIcon className="w-4 h-4 ml-3" />
                            تسجيل الخروج
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 hover:text-brand-blue font-medium transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <XIcon className="w-6 h-6 text-gray-700" />
                ) : (
                  <MenuIcon className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-gray-100"
            >
              <div className="container mx-auto px-4 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Modals */}
      <CartDrawer />
      <SearchModal />
    </>
  );
};

export default Navbar;