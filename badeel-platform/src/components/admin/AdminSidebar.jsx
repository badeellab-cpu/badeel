import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  BanknotesIcon,
  UsersIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  TagIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { logout } from '../../store/slices/authSlice';
import Logo from '../common/Logo';

const AdminSidebar = ({ isOpen, setIsOpen, isDesktop }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      name: 'لوحة التحكم',
      path: '/admin',
      icon: ChartBarIcon,
      exact: true
    },
    {
      name: 'المختبرات',
      path: '/admin/labs',
      icon: BuildingStorefrontIcon
    },
    {
      name: 'المنتجات',
      path: '/admin/products',
      icon: CubeIcon
    },
    {
      name: 'الفئات',
      path: '/admin/categories',
      icon: TagIcon
    },
    {
      name: 'الطلبات',
      path: '/admin/orders',
      icon: ShoppingBagIcon
    },
    {
      name: 'التبادلات',
      path: '/admin/exchanges',
      icon: ArrowPathIcon
    },
    {
      name: 'المحافظ',
      path: '/admin/wallets',
      icon: BanknotesIcon
    },
    {
      name: 'المستخدمين',
      path: '/admin/users',
      icon: UsersIcon
    },
    {
      name: 'التقارير',
      path: '/admin/reports',
      icon: DocumentChartBarIcon
    },
    {
      name: 'الإعدادات',
      path: '/admin/settings',
      icon: Cog6ToothIcon
    }
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '100%' }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  // Show overlay only on mobile when sidebar is open
  const showOverlay = !isDesktop && isOpen;
  
  // Sidebar should be visible when:
  // - Desktop: always visible
  // - Mobile: when isOpen is true
  const sidebarVisible = isDesktop || isOpen;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`
          ${isDesktop ? 'relative' : 'fixed'} 
          top-0 right-0 h-full bg-white shadow-lg z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed && isDesktop ? 'w-20' : 'w-72'}
          ${sidebarVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center">
                <Logo className="h-8 w-auto" />
                <span className="mr-3 text-xl font-bold text-gray-900">
                  لوحة الإدارة
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Collapse button for desktop */}
              {isDesktop && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              )}
              
              {/* Close button for mobile */}
              {!isDesktop && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-blue to-brand-blueSecondary rounded-full flex items-center justify-center">
                  <UserCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {user?.name || 'الإدارة'}
                  </h3>
                  <p className="text-xs text-gray-500">مدير النظام</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <motion.div
              variants={{
                visible: {
                  transition: { staggerChildren: 0.05 }
                }
              }}
              initial="hidden"
              animate="visible"
              className="space-y-2 px-4"
            >
              {menuItems.map((item, index) => {
                const isActive = isActiveRoute(item.path, item.exact);
                return (
                  <motion.div key={item.path} variants={itemVariants}>
                    <Link
                      to={item.path}
                      onClick={() => !isDesktop && setIsOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`h-6 w-6 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      {!isCollapsed && (
                        <span className="mr-3 font-medium">{item.name}</span>
                      )}
                      
                      {isActive && !isCollapsed && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="mr-auto w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              {!isCollapsed && (
                <span className="mr-3 font-medium">تسجيل الخروج</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
