import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  UserIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  ShoppingBagIcon as ShoppingBagIconSolid,
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  TruckIcon as TruckIconSolid
} from '@heroicons/react/24/solid';
import { adminAPI, getImageUrl, exchangesAPI } from '../../config/api';
import LoadingScreen from '../../components/common/LoadingScreen';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [shippingData, setShippingData] = useState({
    carrier: '',
    trackingNumber: '',
    estimatedDelivery: '',
    notes: ''
  });

  // Filters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    type: 'all', // 'all', 'order', 'exchange'
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Load orders
  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        type: filters.type === 'all' ? undefined : filters.type,
        status: filters.status || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await adminAPI.getConfirmedOrders(params);
      setOrders(response.data.data.orders);
      setStatistics(response.data.data.statistics);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  // Handle view order details
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    
    // إذا كان تبادل، حمّل تفاصيله الأخيرة من API لضمان تحديث الشحن
    if (order.type === 'exchange') {
      try {
        const res = await exchangesAPI.getById(order._id);
        const data = res.data?.data || res.data;
        if (data) {
          setSelectedOrder((prev) => ({
            ...prev,
            shipping: data.shipping || prev.shipping,
            status: data.status || prev.status,
            updatedAt: data.updatedAt || prev.updatedAt
          }));
        }
      } catch (error) {
        console.log('Failed to refresh exchange data:', error);
      }
    }
  };

  // Handle shipping update
  const handleUpdateShipping = (order) => {
    setSelectedOrder(order);
    // Prevent shipping update for accepted ExchangeRequests (no shipping structure yet)
    // إذا كان طلب تبادل مقبول (ExchangeRequest) أنشئ تبادلاً وحدث الشحن من خلال مسار خاص
    if (order.isExchangeRequest) {
      setShippingData({
        carrier: '',
        trackingNumber: '',
        estimatedDelivery: '',
        notes: ''
      });
      setShowShippingModal(true);
      return;
    }
    // Prefill from any existing shipping fields (top-level or nested for exchanges)
    const carrier =
      order.shipping?.carrier ||
      order.shipping?.requesterShipping?.carrier ||
      order.shipping?.receiverShipping?.carrier ||
      '';

    const trackingNumber =
      order.shipping?.trackingNumber ||
      order.shipping?.requesterShipping?.trackingNumber ||
      order.shipping?.receiverShipping?.trackingNumber ||
      '';

    const estimatedDeliveryDate = order.shipping?.estimatedDelivery
      ? new Date(order.shipping.estimatedDelivery).toISOString().split('T')[0]
      : '';

    setShippingData({
      carrier,
      trackingNumber,
      estimatedDelivery: estimatedDeliveryDate,
      notes: ''
    });
    setShowShippingModal(true);
  };

  // Submit shipping update
  const handleShippingSubmit = async () => {
    if (!selectedOrder) return;

    try {
      if (selectedOrder.isExchangeRequest) {
        await adminAPI.updateAcceptedExchangeRequestShipping(selectedOrder._id, {
          carrier: shippingData.carrier,
          trackingNumber: shippingData.trackingNumber,
          estimatedDelivery: shippingData.estimatedDelivery,
          notes: shippingData.notes
        });
      } else if (selectedOrder.type === 'exchange') {
        await adminAPI.updateExchangeDelivery(selectedOrder._id, {
          requesterCarrier: shippingData.carrier,
          requesterTrackingNumber: shippingData.trackingNumber,
          receiverCarrier: shippingData.carrier,
          receiverTrackingNumber: shippingData.trackingNumber,
          estimatedDelivery: shippingData.estimatedDelivery || undefined,
          applyToBoth: true,
          target: 'both',
          overwrite: true,
          notes: shippingData.notes
        });
      } else {
        await adminAPI.updateOrderShipping(selectedOrder._id, shippingData);
      }
      
      toast.success('تم تحديث معلومات الشحن بنجاح');
      setShowShippingModal(false);
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في تحديث معلومات الشحن');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      if (selectedOrder.type === 'exchange') {
        await exchangesAPI.updateStatus(selectedOrder._id, newStatus, {
          notes: `تم تغيير الحالة إلى ${getStatusText(newStatus)}`
        });
      } else {
        // Use ordersAPI for orders, not adminAPI.updateOrderShipping
        const { ordersAPI } = await import('../../config/api');
        await ordersAPI.updateStatus(selectedOrder._id, newStatus, {
          notes: `تم تغيير الحالة إلى ${getStatusText(newStatus)}`
        });
      }
      
      toast.success('تم تحديث حالة الطلب بنجاح');
      setShowDetailsModal(false);
      setShowStatusModal(false);
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في تحديث حالة الطلب');
    }
  };

  // Handle status update with confirmation
  const handleConfirmedStatusUpdate = (newStatus) => {
    if (['completed', 'cancelled'].includes(newStatus)) {
      const confirmMessage = newStatus === 'completed' 
        ? 'هل أنت متأكد من إكمال هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.';
      
      if (window.confirm(confirmMessage)) {
        handleStatusUpdate(newStatus);
      }
    } else {
      handleStatusUpdate(newStatus);
    }
  };

  // Handle status change from table
  const handleQuickStatusUpdate = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  // Get status text
  const getStatusText = (status) => {
    const statusTexts = {
      confirmed: 'مؤكد',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      in_progress: 'جاري التنفيذ',
      delivered: 'تم التسليم',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    };
    return statusTexts[status] || status;
  };

  // Get status badge
  const getStatusBadge = (status, type) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'في الانتظار', icon: ClockIcon },
      confirmed: { color: 'blue', text: 'مؤكد', icon: CheckCircleIcon },
      accepted: { color: 'green', text: 'مقبول', icon: CheckCircleIconSolid },
      processing: { color: 'indigo', text: 'قيد المعالجة', icon: ClockIcon },
      shipped: { color: 'blue', text: 'تم الشحن', icon: TruckIconSolid },
      in_progress: { color: 'blue', text: 'جاري التنفيذ', icon: TruckIcon },
      delivered: { color: 'emerald', text: 'تم التسليم', icon: CheckCircleIconSolid },
      completed: { color: 'green', text: 'مكتمل', icon: CheckCircleIconSolid },
      cancelled: { color: 'red', text: 'ملغي', icon: XCircleIcon },
      refunded: { color: 'gray', text: 'مُسترد', icon: ArrowPathIcon }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon className="w-3 h-3 ml-1" />
        {config.text}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type) => {
    if (type === 'exchange') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ArrowsRightLeftIconSolid className="w-3 h-3 ml-1" />
          تبادل
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <ShoppingBagIconSolid className="w-3 h-3 ml-1" />
        شراء
      </span>
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 20, stiffness: 300 }
    }
  };

  if (loading && orders.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShoppingBagIcon className="h-8 w-8 ml-3 text-blue-600" />
                إدارة الطلبات المؤكدة
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                إدارة طلبات الشراء والتبادل المؤكدة ومتابعة حالة الشحن
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowPathIcon className="h-5 w-5 ml-2" />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6"
      >
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-blueSecondary opacity-5"></div>
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{statistics.totalConfirmed || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blueSecondary">
                <ShoppingBagIconSolid className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-5"></div>
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">طلبات الشراء</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{statistics.byType?.orders || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <ShoppingBagIconSolid className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-blueSecondary opacity-5"></div>
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">التبادلات</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{statistics.byType?.exchanges || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blueSecondary">
                <ArrowsRightLeftIconSolid className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-5"></div>
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">تم الشحن</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{statistics.byStatus?.shipped || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600">
                <TruckIconSolid className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-5"></div>
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">مكتمل</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{statistics.byStatus?.completed || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600">
                <CheckCircleIconSolid className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث برقم الطلب..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">جميع الأنواع</option>
              <option value="order">طلبات الشراء</option>
              <option value="exchange">التبادلات</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">جميع الحالات</option>
              <option value="confirmed">مؤكد</option>
              <option value="accepted">مقبول</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="in_progress">جاري التنفيذ</option>
              <option value="delivered">تم التسليم</option>
              <option value="completed">مكتمل</option>
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="updatedAt">تاريخ التحديث</option>
              <option value="status">الحالة</option>
            </select>

            {/* Sort Order */}
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="desc">الأحدث أولاً</option>
              <option value="asc">الأقدم أولاً</option>
            </select>

            {/* Items per page */}
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value={10}>10 عناصر</option>
              <option value={20}>20 عنصر</option>
              <option value={50}>50 عنصر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3 text-gray-600">جاري التحميل...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طلبات</h3>
            <p className="mt-1 text-sm text-gray-500">لا توجد طلبات مؤكدة في الوقت الحالي</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المشتري/الطالب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البائع/المستقبل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(order.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.buyer?.lab?.labName}</div>
                        <div className="text-sm text-gray-500">{order.buyer?.user?.name || order.buyer?.lab?.contactPerson?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.seller?.lab?.labName}</div>
                        <div className="text-sm text-gray-500">{order.seller?.user?.name || order.seller?.lab?.contactPerson?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.type === 'exchange' ? (
                          <span className="text-blue-600 font-medium">تبادل</span>
                        ) : (
                          `${order.totalAmount?.toLocaleString()} ${order.currency}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status, order.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="عرض التفاصيل"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(order)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="تغيير الحالة"
                            >
                              <Cog6ToothIcon className="h-4 w-4" />
                            </button>
                          )}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateShipping(order)}
                              className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                              title="تحديث الشحن"
                            >
                              <TruckIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      عرض{' '}
                      <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                      {' '}إلى{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>
                      {' '}من{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}نتيجة
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        السابق
                      </button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handleFilterChange('page', page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        التالي
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-blueSecondary text-white p-6 rounded-t-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-5">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="1" fill="currentColor" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#pattern)" />
                  </svg>
                </div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      {selectedOrder.type === 'exchange' ? (
                        <ArrowsRightLeftIconSolid className="h-6 w-6 ml-2" />
                      ) : (
                        <ShoppingBagIconSolid className="h-6 w-6 ml-2" />
                      )}
                      تفاصيل {selectedOrder.type === 'exchange' ? 'التبادل' : 'الطلب'}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 ml-2 text-blue-600" />
                      معلومات أساسية
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الطلب:</span>
                        <span className="font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      {selectedOrder.isExchangeRequest && selectedOrder.extra?.offerType === 'custom_offer' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">نوع العرض:</span>
                          <span className="font-medium">عرض مخصص</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">النوع:</span>
                        {getTypeBadge(selectedOrder.type)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحالة:</span>
                        {getStatusBadge(selectedOrder.status, selectedOrder.type)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ الإنشاء:</span>
                        <span className="font-medium">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      {selectedOrder.type !== 'exchange' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">المبلغ الإجمالي:</span>
                          <span className="font-medium text-green-600">
                            {selectedOrder.totalAmount?.toLocaleString()} {selectedOrder.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TruckIcon className="h-5 w-5 ml-2 text-blue-600" />
                      معلومات الشحن
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">شركة الشحن:</span>
                        <span className="font-medium">
                          {selectedOrder.shipping?.requesterShipping?.carrier || selectedOrder.shipping?.receiverShipping?.carrier || selectedOrder.shipping?.carrier || 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم التتبع:</span>
                        <span className="font-medium">
                          {selectedOrder.shipping?.requesterShipping?.trackingNumber || selectedOrder.shipping?.receiverShipping?.trackingNumber || selectedOrder.shipping?.trackingNumber || 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ التسليم المتوقع:</span>
                        <span className="font-medium">
                          {selectedOrder.shipping?.estimatedDelivery ? 
                            new Date(selectedOrder.shipping.estimatedDelivery).toLocaleDateString('ar-SA') : 
                            'غير محدد'
                          }
                        </span>
                      </div>
                      {selectedOrder.type === 'exchange' && selectedOrder.exchangeProducts && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-800 mb-2">تفاصيل التبادل</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 border">
                              <p className="text-xs text-gray-500 mb-1">يستلم من:</p>
                              <p className="text-sm font-medium text-gray-900">{selectedOrder.seller?.lab?.labName}</p>
                              <p className="text-xs text-gray-500 mt-1">المنتج:</p>
                              <p className="text-sm text-gray-800">{selectedOrder.exchangeProducts.receiver?.product?.name} × {selectedOrder.exchangeProducts.receiver?.quantity}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border">
                              <p className="text-xs text-gray-500 mb-1">يسلّم إلى:</p>
                              <p className="text-sm font-medium text-gray-900">{selectedOrder.buyer?.lab?.labName}</p>
                              <p className="text-xs text-gray-500 mt-1">المنتج:</p>
                              <p className="text-sm text-gray-800">{selectedOrder.exchangeProducts.requester?.product?.name} × {selectedOrder.exchangeProducts.requester?.quantity}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parties Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <UserIcon className="h-5 w-5 ml-2 text-green-600" />
                      {selectedOrder.type === 'exchange' ? 'الطالب' : 'المشتري'}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center">
                        <BuildingStorefrontIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span className="font-medium">{selectedOrder.buyer?.lab?.labName}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span>{selectedOrder.buyer?.user?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span>{selectedOrder.buyer?.user?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span>{selectedOrder.buyer?.user?.phone}</span>
                      </div>
                      {selectedOrder.buyer?.lab?.address && (
                        <div className="flex items-start mt-3 pt-3 border-t border-gray-200">
                          <MapPinIcon className="h-4 w-4 ml-2 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">عنوان الاستلام:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {typeof selectedOrder.buyer.lab.address === 'object' ? 
                                `${selectedOrder.buyer.lab.address.street || ''}, ${selectedOrder.buyer.lab.address.city || ''}, ${selectedOrder.buyer.lab.address.region || ''}` :
                                selectedOrder.buyer.lab.address
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BuildingStorefrontIcon className="h-5 w-5 ml-2 text-blue-600" />
                      {selectedOrder.type === 'exchange' ? 'المستقبل' : 'البائع'}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center">
                        <BuildingStorefrontIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span className="font-medium">{selectedOrder.seller?.lab?.labName}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span>{selectedOrder.seller?.user?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span>{selectedOrder.seller?.user?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 ml-2 text-gray-400" />
                        <span>{selectedOrder.seller?.user?.phone}</span>
                      </div>
                      {selectedOrder.seller?.lab?.address && (
                        <div className="flex items-start mt-3 pt-3 border-t border-gray-200">
                          <MapPinIcon className="h-4 w-4 ml-2 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">عنوان التسليم:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {typeof selectedOrder.seller.lab.address === 'object' ? 
                                `${selectedOrder.seller.lab.address.street || ''}, ${selectedOrder.seller.lab.address.city || ''}, ${selectedOrder.seller.lab.address.region || ''}` :
                                selectedOrder.seller.lab.address
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Address (for Orders) */}
                {selectedOrder.type !== 'exchange' && selectedOrder.shippingAddress && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPinIcon className="h-5 w-5 ml-2 text-amber-600" />
                      عنوان الشحن
                    </h3>
                    <div className="bg-amber-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">الاسم الكامل:</span>
                          <span className="font-medium">{selectedOrder.shippingAddress.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الهاتف:</span>
                          <span className="font-medium">{selectedOrder.shippingAddress.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">المدينة:</span>
                          <span className="font-medium">{selectedOrder.shippingAddress.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">المنطقة:</span>
                          <span className="font-medium">{selectedOrder.shippingAddress.region}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-gray-600">العنوان الكامل:</span>
                        <p className="text-gray-800 mt-1">{selectedOrder.shippingAddress.address}</p>
                        {selectedOrder.shippingAddress.additionalInfo && (
                          <p className="text-gray-600 text-sm mt-1">
                            معلومات إضافية: {selectedOrder.shippingAddress.additionalInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 ml-2 text-indigo-600" />
                    العناصر
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            {item.product?.images?.[0] && (
                              <img
                                src={getImageUrl(item.product.images[0])}
                                alt={item.name || item.product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.name || item.product?.name}
                              </h4>
                              <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                            </div>
                          </div>
                          {selectedOrder.type !== 'exchange' && (
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {item.total?.toLocaleString()} {selectedOrder.currency}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.price?.toLocaleString()} × {item.quantity}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Custom Offer Details */}
                  {selectedOrder.isExchangeRequest && selectedOrder.extra?.offerType === 'custom_offer' && selectedOrder.extra?.customOffer && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">تفاصيل العرض المخصص</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">الاسم:</span>
                          <span className="font-medium">{selectedOrder.extra.customOffer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الكمية:</span>
                          <span className="font-medium">{selectedOrder.extra.customOffer.quantity || 1}</span>
                        </div>
                        {selectedOrder.extra.customOffer.estimatedValue && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">القيمة التقديرية:</span>
                            <span className="font-medium">{selectedOrder.extra.customOffer.estimatedValue} {selectedOrder.currency}</span>
                          </div>
                        )}
                        {selectedOrder.extra.customOffer.condition && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">الحالة:</span>
                            <span className="font-medium">{selectedOrder.extra.customOffer.condition}</span>
                          </div>
                        )}
                      </div>
                      {selectedOrder.extra.customOffer.description && (
                        <div className="mt-3">
                          <span className="text-gray-600">الوصف:</span>
                          <p className="text-gray-800 mt-1 whitespace-pre-wrap">{selectedOrder.extra.customOffer.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إغلاق
                </button>
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleQuickStatusUpdate(selectedOrder);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-95 transition-colors flex items-center"
                  >
                    <Cog6ToothIcon className="h-4 w-4 ml-2" />
                    تغيير الحالة
                  </button>
                )}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleUpdateShipping(selectedOrder);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:opacity-95 transition-colors flex items-center"
                  >
                    <TruckIcon className="h-4 w-4 ml-2" />
                    تحديث الشحن
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shipping Update Modal */}
      <AnimatePresence>
        {showShippingModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShippingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-brand-blue to-brand-blueSecondary text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center">
                      <TruckIcon className="h-5 w-5 ml-2" />
                      تحديث معلومات الشحن
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShippingModal(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {selectedOrder.type === 'exchange' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 ml-2" />
                      <p className="text-sm text-blue-800">
                        سيتم تطبيق معلومات الشحن على كلا الطرفين في التبادل
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شركة الشحن *
                  </label>
                  <select
                    value={shippingData.carrier}
                    onChange={(e) => setShippingData(prev => ({ ...prev, carrier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">اختر شركة الشحن</option>
                    <option value="aramex">أرامكس</option>
                    <option value="smsa">سمسا</option>
                    <option value="saudi_post">البريد السعودي</option>
                    <option value="ups">UPS</option>
                    <option value="dhl">DHL</option>
                    <option value="fedex">FedEx</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم التتبع *
                  </label>
                  <input
                    type="text"
                    value={shippingData.trackingNumber}
                    onChange={(e) => setShippingData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل رقم التتبع"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ التسليم المتوقع
                  </label>
                  <input
                    type="date"
                    value={shippingData.estimatedDelivery}
                    onChange={(e) => setShippingData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات إضافية
                  </label>
                  <textarea
                    value={shippingData.notes}
                    onChange={(e) => setShippingData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="أضف أي ملاحظات حول الشحن..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleShippingSubmit}
                  disabled={!shippingData.carrier || !shippingData.trackingNumber}
                  className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <CheckCircleIcon className="h-4 w-4 ml-2" />
                  حفظ التحديثات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}
      <AnimatePresence>
        {showStatusModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowStatusModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-brand-blue to-brand-blueSecondary text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center">
                      <Cog6ToothIcon className="h-5 w-5 ml-2" />
                      تغيير حالة الطلب
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 ml-2" />
                    <p className="text-sm text-blue-800">
                      الحالة الحالية: <strong>{getStatusText(selectedOrder.status)}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    اختر الحالة الجديدة:
                  </label>
                  <div className="space-y-2">
                    {selectedOrder.type === 'exchange' ? (
                      <>
                        {selectedOrder.status === 'accepted' && (
                          <button
                            onClick={() => handleStatusUpdate('confirmed')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-right"
                          >
                            <span>مؤكد</span>
                            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                          </button>
                        )}
                        {['accepted', 'confirmed'].includes(selectedOrder.status) && (
                          <button
                            onClick={() => handleStatusUpdate('in_progress')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-right"
                          >
                            <span>جاري التنفيذ</span>
                            <TruckIcon className="h-5 w-5 text-blue-600" />
                          </button>
                        )}
                        {['accepted', 'confirmed', 'in_progress'].includes(selectedOrder.status) && (
                          <button
                            onClick={() => handleConfirmedStatusUpdate('completed')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-right"
                          >
                            <span>مكتمل</span>
                            <CheckCircleIconSolid className="h-5 w-5 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleConfirmedStatusUpdate('cancelled')}
                          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-right"
                        >
                          <span>ملغي</span>
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <>
                        {selectedOrder.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate('processing')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-right"
                          >
                            <span>قيد المعالجة</span>
                            <ClockIcon className="h-5 w-5 text-blue-600" />
                          </button>
                        )}
                        {['confirmed', 'processing'].includes(selectedOrder.status) && (
                          <button
                            onClick={() => handleStatusUpdate('shipped')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-right"
                          >
                            <span>تم الشحن</span>
                            <TruckIconSolid className="h-5 w-5 text-purple-600" />
                          </button>
                        )}
                        {['confirmed', 'processing', 'shipped'].includes(selectedOrder.status) && (
                          <button
                            onClick={() => handleStatusUpdate('delivered')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-right"
                          >
                            <span>تم التسليم</span>
                            <CheckCircleIconSolid className="h-5 w-5 text-emerald-600" />
                          </button>
                        )}
                        {['confirmed', 'processing', 'shipped', 'delivered'].includes(selectedOrder.status) && (
                          <button
                            onClick={() => handleConfirmedStatusUpdate('completed')}
                            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-right"
                          >
                            <span>مكتمل</span>
                            <CheckCircleIconSolid className="h-5 w-5 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleConfirmedStatusUpdate('cancelled')}
                          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-right"
                        >
                          <span>ملغي</span>
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;