import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ShoppingCartIcon,
  ArrowsRightLeftIcon as SwapHorizontalIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'تمت الموافقة على منتجك',
      message: 'تمت الموافقة على منتج "جهاز أشعة محمول" وهو الآن متاح للعرض',
      icon: CheckCircleIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      time: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      link: '/products/my-products'
    },
    {
      id: 2,
      type: 'order',
      title: 'طلب جديد',
      message: 'لديك طلب جديد من مختبر النور الطبي',
      icon: ShoppingCartIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
      link: '/orders'
    },
    {
      id: 3,
      type: 'exchange',
      title: 'طلب تبادل جديد',
      message: 'تلقيت طلب تبادل على منتج "جهاز تحليل الدم"',
      icon: SwapHorizontalIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      time: new Date(Date.now() - 1000 * 60 * 60 * 5),
      read: true,
      link: '/exchanges'
    },
    {
      id: 4,
      type: 'wallet',
      title: 'تحويل مالي',
      message: 'تم استلام 5,000 ريال في محفظتك',
      icon: CurrencyDollarIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
      link: '/wallet'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6 text-brand-blue" />
        ) : (
          <BellIcon className="w-6 h-6 text-gray-700" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-brand-blue hover:text-brand-blueSecondary"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 ${notification.bgColor} rounded-full flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${notification.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <Link
                                to={notification.link}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="block"
                              >
                                <p className="font-semibold text-gray-900 text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDistanceToNow(notification.time, { 
                                    addSuffix: true,
                                    locale: ar 
                                  })}
                                </p>
                              </Link>
                            </div>

                            {/* Actions */}
                            <div className="flex items-start">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-brand-blue rounded-full ml-2" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <XCircleIcon className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-sm text-brand-blue hover:text-brand-blueSecondary font-medium"
                  >
                    عرض جميع الإشعارات
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;