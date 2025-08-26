import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  DocumentTextIcon,
  PhotoIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';
import exchangeAPI from '../../services/exchangeAPI';
import { getImageUrl } from '../../config/api';

const ExchangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: ''
  });

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        type: filters.type === 'all' ? undefined : filters.type,
        status: filters.status || undefined
      };

      const response = await exchangeAPI.getExchangeRequests(params);
      setRequests(response.data || []);
    } catch (error) {
      toast.error(error.message || 'فشل في تحميل طلبات التبادل');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request) => {
    try {
      const response = await exchangeAPI.getExchangeRequest(request._id);

      setSelectedRequest(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('فشل في تحميل تفاصيل الطلب');
    }
  };

  const handleRespond = async (action, extra = {}) => {
    if (!selectedRequest) return;
    try {
      await exchangeAPI.respondToExchangeRequest(selectedRequest._id, { action, ...extra });
      toast.success('تم تحديث حالة الطلب');
      setShowDetailsModal(false);
      loadRequests();
    } catch (error) {
      toast.error(error || 'فشل في تحديث حالة الطلب');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIconSolid className="w-5 h-5 text-yellow-500" />;
      case 'viewed':
        return <EyeIcon className="w-5 h-5 text-blue-500" />;
      case 'accepted':
        return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIconSolid className="w-5 h-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'في الانتظار',
      viewed: 'تم العرض',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      counter_offer: 'عرض مضاد',
      withdrawn: 'مسحوب',
      expired: 'منتهي الصلاحية'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center">
          <div className="p-3 bg-gradient-to-br from-brand-blue to-brand-blueSecondary rounded-xl text-white ml-4">
            <ArrowsRightLeftIconSolid className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">طلبات التبادل</h1>
            <p className="text-gray-600 mt-1">إدارة طلبات التبادل المرسلة والمستقبلة</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'الكل' },
              { value: 'sent', label: 'المرسلة' },
              { value: 'received', label: 'المستقبلة' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setFilters(prev => ({ ...prev, type: type.value }))}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filters.type === type.value
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="viewed">تم العرض</option>
            <option value="accepted">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الطلبات...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowsRightLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات تبادل</h3>
            <p className="text-gray-600">لا توجد طلبات تبادل</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((request) => (
              <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{request.requestNumber}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>{request.targetProduct?.product?.name}</span>
                        <span className="mx-2">•</span>
                        <span>الكمية: {request.targetProduct?.requestedQuantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">تفاصيل طلب التبادل</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">المنتج المطلوب</h4>
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(selectedRequest.targetProduct?.product?.images?.[0]?.url)}
                        alt={selectedRequest.targetProduct?.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h5 className="font-medium">{selectedRequest.targetProduct?.product?.name}</h5>
                        <p className="text-sm text-gray-600">الكمية: {selectedRequest.targetProduct?.requestedQuantity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-3">المنتج المعروض</h4>
                    {selectedRequest.offerType === 'existing_product' ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(selectedRequest.offeredProduct?.product?.images?.[0]?.url)}
                          alt={selectedRequest.offeredProduct?.product?.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h5 className="font-medium">{selectedRequest.offeredProduct?.product?.name}</h5>
                          <p className="text-sm text-gray-600">الكمية: {selectedRequest.offeredProduct?.quantity}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">{selectedRequest.customOffer?.name}</h5>
                          <p className="text-sm text-gray-600">عرض مخصص • الكمية: {selectedRequest.customOffer?.quantity || 1}</p>
                          {selectedRequest.customOffer?.condition && (
                            <p className="text-xs text-gray-500 mt-1">الحالة: {
                              selectedRequest.customOffer.condition === 'new' ? 'جديد' :
                              selectedRequest.customOffer.condition === 'like-new' ? 'مثل الجديد' :
                              selectedRequest.customOffer.condition === 'good' ? 'جيد' :
                              selectedRequest.customOffer.condition === 'fair' ? 'مقبول' : 'ضعيف'
                            }</p>
                          )}
                          {selectedRequest.customOffer?.description && (
                            <p className="text-xs text-gray-500 mt-1">{selectedRequest.customOffer.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                            {selectedRequest.customOffer?.brand && (
                              <span className="px-2 py-1 bg-white rounded border">العلامة: {selectedRequest.customOffer.brand}</span>
                            )}
                            {selectedRequest.customOffer?.model && (
                              <span className="px-2 py-1 bg-white rounded border">الموديل: {selectedRequest.customOffer.model}</span>
                            )}
                            {selectedRequest.customOffer?.estimatedValue > 0 && (
                              <span className="px-2 py-1 bg-white rounded border">القيمة التقديرية: {selectedRequest.customOffer.estimatedValue} ريال</span>
                            )}
                          </div>
                          {Array.isArray(selectedRequest.customOffer?.specifications) && selectedRequest.customOffer.specifications.length > 0 && (
                            <div className="mt-3">
                              <h6 className="text-xs font-semibold text-gray-700 mb-1">المواصفات:</h6>
                              <ul className="list-disc pr-5 text-xs text-gray-600 space-y-1">
                                {selectedRequest.customOffer.specifications.map((spec, idx) => (
                                  <li key={idx}>{spec.name}{spec.value ? `: ${spec.value}` : ''}{spec.unit ? ` ${spec.unit}` : ''}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRequest.message && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">رسالة</h4>
                    <p className="text-gray-700">{selectedRequest.message}</p>
                  </div>
                )}

                {/* Actions for receiver */}
                {((selectedRequest?.isReceiver ?? true) && (selectedRequest?.canRespond ?? ['pending','viewed'].includes(selectedRequest?.status))) && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleRespond('accept')}
                      className="px-4 py-2 bg-brand-green text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      قبول الطلب
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('سبب الرفض (اختياري):');
                        handleRespond('reject', { rejectionReason: reason || '' });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      رفض
                    </button>
                    <button
                      onClick={() => {
                        const message = prompt('اكتب تفاصيل العرض المضاد:');
                        if (!message) return;
                        handleRespond('counter_offer', { counterOffer: { message } });
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg"
                    >
                      عرض مضاد
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExchangeRequests;