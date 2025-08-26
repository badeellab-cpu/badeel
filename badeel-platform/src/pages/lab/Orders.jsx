import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import {
  ShoppingBagIcon as ShoppingBagIconSolid,
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  TruckIcon as TruckIconSolid
} from '@heroicons/react/24/solid';
import { ordersAPI, exchangesAPI, getImageUrl } from '../../config/api';
import LoadingScreen from '../../components/common/LoadingScreen';

const LabOrders = () => {
  const [orders, setOrders] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'all') {
        const [myOrders, asSellerOrders, myExchangeRequests, exchangesOnMyProducts] = await Promise.all([
          ordersAPI.getMyOrders(),
          ordersAPI.getAsSeller(),
          exchangesAPI.getMyRequests(),
          exchangesAPI.getOnMyProducts()
        ]);
        
        const buyerOrders = (myOrders.data?.data?.orders || myOrders.data?.orders || []).map(order => ({
          ...order,
          role: 'buyer',
          type: 'purchase'
        }));
        
        const sellerOrders = (asSellerOrders.data?.data?.orders || asSellerOrders.data?.orders || []).map(order => ({
          ...order,
          role: 'seller',
          type: 'purchase'
        }));

        const requesterExchanges = (myExchangeRequests.data?.data?.exchanges || myExchangeRequests.data?.exchanges || []).map(exchange => ({
          ...exchange,
          role: 'requester',
          type: 'exchange'
        }));
        
        const receiverExchanges = (exchangesOnMyProducts.data?.data?.exchanges || exchangesOnMyProducts.data?.exchanges || []).map(exchange => ({
          ...exchange,
          role: 'receiver',
          type: 'exchange'
        }));

        setOrders([...buyerOrders, ...sellerOrders]);
        setExchanges([...requesterExchanges, ...receiverExchanges]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  // Handle view order details
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    
    if (order.type === 'exchange') {
      try {
        const res = await exchangesAPI.getById(order._id);
        const data = res.data?.data || res.data;
        if (data) {
          setSelectedOrder(prev => ({
            ...prev,
            shipping: data.shipping || prev.shipping,
            status: data.status || prev.status
          }));
        }
      } catch (error) {
        console.log('Failed to refresh exchange data:', error);
      }
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'في الانتظار', icon: ClockIcon },
      confirmed: { color: 'blue', text: 'مؤكد', icon: CheckCircleIcon },
      accepted: { color: 'green', text: 'مقبول', icon: CheckCircleIconSolid },
      processing: { color: 'indigo', text: 'قيد المعالجة', icon: ClockIcon },
      shipped: { color: 'blue', text: 'تم الشحن', icon: TruckIconSolid },
      in_progress: { color: 'blue', text: 'جاري التنفيذ', icon: TruckIcon },
      delivered: { color: 'emerald', text: 'تم التسليم', icon: CheckCircleIconSolid },
      completed: { color: 'green', text: 'مكتمل', icon: CheckCircleIconSolid },
      cancelled: { color: 'red', text: 'ملغي', icon: XCircleIcon }
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
  const getTypeBadge = (type, role) => {
    if (type === 'exchange') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ArrowsRightLeftIconSolid className="w-3 h-3 ml-1" />
          {role === 'requester' ? 'تبادل (طالب)' : 'تبادل (مستقبل)'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <ShoppingBagIconSolid className="w-3 h-3 ml-1" />
        {role === 'buyer' ? 'شراء' : 'بيع'}
      </span>
    );
  };

  // Combine and filter all items
  const getFilteredItems = () => {
    const allItems = [
      ...orders.map(order => ({ ...order, itemType: 'order' })),
      ...exchanges.map(exchange => ({ ...exchange, itemType: 'exchange' }))
    ];

    let filtered = allItems;

    if (filters.search) {
      filtered = filtered.filter(item => 
        (item.orderNumber && item.orderNumber.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.exchangeNumber && item.exchangeNumber.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShoppingBagIcon className="h-8 w-8 ml-3 text-blue-600" />
                الطلبات
          </h1>
          <p className="mt-1 text-sm text-gray-500">
                إدارة جميع طلبات الشراء والبيع والتبادل الخاصة بك
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowPathIcon className="h-5 w-5 ml-2" />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث برقم الطلب..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="accepted">مقبول</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="in_progress">جاري التنفيذ</option>
              <option value="delivered">تم التسليم</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طلبات</h3>
            <p className="mt-1 text-sm text-gray-500">لا توجد طلبات في الوقت الحالي</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطرف الآخر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const orderNumber = item.orderNumber || item.exchangeNumber;
                  const otherParty = item.role === 'buyer' || item.role === 'requester' 
                    ? (item.seller?.lab?.labName || item.receiver?.lab?.labName)
                    : (item.buyer?.lab?.labName || item.requester?.lab?.labName);

                  return (
                    <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(item.type, item.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{otherParty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.type === 'exchange' ? (
                          <span className="text-blue-600 font-medium">تبادل</span>
                        ) : (
                          `${item.totalAmount?.toLocaleString()} ${item.currency || 'SAR'}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewOrder(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="عرض التفاصيل"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                      {selectedOrder.orderNumber || selectedOrder.exchangeNumber}
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
                        <span className="font-medium">{selectedOrder.orderNumber || selectedOrder.exchangeNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">النوع:</span>
                        {getTypeBadge(selectedOrder.type, selectedOrder.role)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحالة:</span>
                        {getStatusBadge(selectedOrder.status)}
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
                            {selectedOrder.totalAmount?.toLocaleString()} {selectedOrder.currency || 'SAR'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TruckIcon className="h-5 w-5 ml-2 text-blue-600" />
                      معلومات الشحن والتتبع
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">شركة الشحن:</span>
                        <span className="font-medium">
                          {selectedOrder.shipping?.requesterShipping?.carrier || 
                           selectedOrder.shipping?.receiverShipping?.carrier || 
                           selectedOrder.shipping?.carrier || 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم التتبع:</span>
                        <span className="font-medium">
                          {selectedOrder.shipping?.requesterShipping?.trackingNumber || 
                           selectedOrder.shipping?.receiverShipping?.trackingNumber || 
                           selectedOrder.shipping?.trackingNumber || 'غير محدد'}
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
                      {selectedOrder.shipping?.requesterShipping?.shippedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">تاريخ الشحن:</span>
                          <span className="font-medium">
                            {new Date(selectedOrder.shipping.requesterShipping.shippedAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracking Information */}
                {(selectedOrder.shipping?.requesterShipping?.trackingNumber || 
                  selectedOrder.shipping?.receiverShipping?.trackingNumber || 
                  selectedOrder.shipping?.trackingNumber) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <TruckIconSolid className="h-5 w-5 ml-2" />
                      معلومات التتبع
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">حالة الشحن</p>
                        <div className="flex items-center">
                          {getStatusBadge(selectedOrder.status)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">رقم التتبع</p>
                        <p className="text-lg font-mono text-blue-600">
                          {selectedOrder.shipping?.requesterShipping?.trackingNumber || 
                           selectedOrder.shipping?.receiverShipping?.trackingNumber || 
                           selectedOrder.shipping?.trackingNumber}
                        </p>
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
                      {selectedOrder.type === 'exchange' ? (
                        <>
                          {selectedOrder.requesterProduct && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-center space-x-3 space-x-reverse">
                                {selectedOrder.requesterProduct?.product?.images?.[0] && (
                                  <img
                                    src={getImageUrl(selectedOrder.requesterProduct.product.images[0])}
                                    alt={selectedOrder.requesterProduct.product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {selectedOrder.requesterProduct?.product?.name}
                                  </h4>
                                  <p className="text-sm text-gray-500">الكمية: {selectedOrder.requesterProduct?.quantity}</p>
                                  <p className="text-xs text-blue-600 font-medium">منتج الطالب</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedOrder.receiverProduct && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-green-400">
                              <div className="flex items-center space-x-3 space-x-reverse">
                                {selectedOrder.receiverProduct?.product?.images?.[0] && (
                                  <img
                                    src={getImageUrl(selectedOrder.receiverProduct.product.images[0])}
                                    alt={selectedOrder.receiverProduct.product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {selectedOrder.receiverProduct?.product?.name}
                                  </h4>
                                  <p className="text-sm text-gray-500">الكمية: {selectedOrder.receiverProduct?.quantity}</p>
                                  <p className="text-xs text-green-600 font-medium">منتج المستقبل</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        selectedOrder.items?.map((item, index) => (
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
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {item.total?.toLocaleString()} {selectedOrder.currency || 'SAR'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.price?.toLocaleString()} × {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
      </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabOrders;
