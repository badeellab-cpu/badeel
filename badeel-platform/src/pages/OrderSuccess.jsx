import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { clearCart } from '../store/slices/cartSlice';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowLeftIcon,
  PrinterIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import paymentService from '../services/paymentService';
import ordersAPI from '../services/ordersAPI';
import LoadingScreen from '../components/common/LoadingScreen';

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Fetch order details and handle payment confirmation
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // First, get order details
        const response = await ordersAPI.getOrder(id);
        setOrder(response.order);
        
        // Check if we have a payment_id from Moyasar redirect
        const paymentId = searchParams.get('payment_id') || searchParams.get('id') || searchParams.get('tap_id');
        console.log('URL params:', Object.fromEntries(searchParams));
        console.log('Payment ID from URL:', paymentId);
        console.log('Order payment status:', response.order.payment?.status);
        
        if (paymentId && response.order.payment?.method === 'card' && response.order.payment?.status === 'pending') {
          // Confirm payment with backend
          try {
            console.log('Confirming payment with ID:', paymentId);
            const confirmResponse = await paymentService.confirmPayment(id, paymentId);
            console.log('Confirmation response:', confirmResponse);
            
            if (confirmResponse.success) {
              setPaymentConfirmed(true);
              dispatch(clearCart());
              toast.success('تم تأكيد الدفع بنجاح!');
              // Refresh order details
              const updatedOrder = await ordersAPI.getOrder(id);
              setOrder(updatedOrder.order);
            }
          } catch (error) {
            console.error('Payment confirmation error:', error);
            // Still check payment status in case it was already confirmed
            checkPaymentStatus();
          }
        } else if (response.order.payment?.status === 'paid' || response.order.status === 'confirmed') {
          // Payment already confirmed
          setPaymentConfirmed(true);
          dispatch(clearCart());
        } else if (response.order.payment?.method === 'card' && response.order.payment?.status === 'pending') {
          // No payment_id but order is pending - try to confirm without payment ID
          // This handles cases where Moyasar doesn't send payment_id in URL
          console.log('No payment ID in URL, trying to confirm order directly');
          try {
            const confirmResponse = await paymentService.confirmPayment(id, null);
            if (confirmResponse.success && confirmResponse.order.payment?.status === 'paid') {
              setPaymentConfirmed(true);
              dispatch(clearCart());
              toast.success('تم تأكيد الدفع بنجاح!');
              setOrder(confirmResponse.order);
            } else {
              // Still pending, start polling
              checkPaymentStatus();
            }
          } catch (error) {
            console.error('Error checking order status:', error);
            checkPaymentStatus();
          }
        } else if (response.order.payment?.method === 'cod') {
          // Cash on delivery - clear cart
          dispatch(clearCart());
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('فشل في جلب تفاصيل الطلب');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id, navigate, searchParams, dispatch]);

  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      setCheckingPayment(true);
      const response = await paymentService.getPaymentStatus(id);
      setPaymentStatus(response.payment.status);
      
      // If payment is still pending, check again after 5 seconds
      if (response.payment.status === 'pending') {
        setTimeout(() => {
          checkPaymentStatus();
        }, 5000);
      } else if (response.payment.status === 'paid') {
        // Refresh order details to get updated status
        const orderResponse = await ordersAPI.getOrder(id);
        setOrder(orderResponse.order);
        dispatch(clearCart()); // Clear cart when payment is confirmed
        toast.success('تم تأكيد الدفع بنجاح!');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">الطلب غير موجود</h2>
          <Link to="/" className="text-brand-blue hover:underline">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (order.payment?.method === 'cod') {
      return <BanknotesIcon className="w-24 h-24 text-blue-600" />;
    }
    
    switch (order.payment?.status) {
      case 'paid':
        return <CheckCircleIconSolid className="w-24 h-24 text-green-600" />;
      case 'pending':
        return <ClockIcon className="w-24 h-24 text-yellow-600 animate-pulse" />;
      case 'failed':
        return <XCircleIcon className="w-24 h-24 text-red-600" />;
      default:
        return <DocumentTextIcon className="w-24 h-24 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    if (order.payment?.method === 'cod') {
      return {
        title: 'تم تأكيد طلبك بنجاح!',
        subtitle: 'سيتم التواصل معك لتأكيد التوصيل',
        color: 'text-blue-600'
      };
    }
    
    switch (order.payment?.status) {
      case 'paid':
        return {
          title: 'تم الدفع بنجاح!',
          subtitle: 'شكراً لك، تم استلام طلبك وسيتم شحنه قريباً',
          color: 'text-green-600'
        };
      case 'pending':
        return {
          title: 'جاري معالجة الدفع...',
          subtitle: 'يرجى الانتظار، نتحقق من حالة الدفع',
          color: 'text-yellow-600'
        };
      case 'failed':
        return {
          title: 'فشلت عملية الدفع',
          subtitle: 'عذراً، لم تتم عملية الدفع بنجاح',
          color: 'text-red-600'
        };
      default:
        return {
          title: 'تم استلام طلبك',
          subtitle: 'جاري معالجة طلبك',
          color: 'text-gray-600'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 ml-2" />
            العودة للرئيسية
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            {/* Status Header */}
            <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-8 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-block mb-4"
              >
                {getStatusIcon()}
              </motion.div>
              <h1 className={`text-3xl font-bold mb-2 ${statusInfo.color}`}>
                {statusInfo.title}
              </h1>
              <p className="text-blue-100 text-lg">
                {statusInfo.subtitle}
              </p>
              {checkingPayment && (
                <div className="mt-4 flex items-center justify-center">
                  <ArrowPathIcon className="w-5 h-5 animate-spin ml-2" />
                  <span className="text-sm">جاري التحقق من حالة الدفع...</span>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="p-8">
              {/* Order Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 ml-2 text-gray-600" />
                    معلومات الطلب
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم الطلب:</span>
                      <span className="font-mono font-medium">{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التاريخ:</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الحالة:</span>
                      <span className={`font-medium ${
                        order.status === 'confirmed' ? 'text-green-600' :
                        order.status === 'pending' ? 'text-yellow-600' :
                        order.status === 'cancelled' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {order.status === 'confirmed' ? 'مؤكد' :
                         order.status === 'pending' ? 'قيد المعالجة' :
                         order.status === 'cancelled' ? 'ملغي' :
                         order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    {order.payment?.method === 'cod' ? (
                      <>
                        <BanknotesIcon className="w-5 h-5 ml-2 text-gray-600" />
                        معلومات الدفع
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="w-5 h-5 ml-2 text-gray-600" />
                        معلومات الدفع
                      </>
                    )}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <span>{order.payment?.method === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المبلغ الإجمالي:</span>
                      <span className="font-bold text-lg text-brand-blue">
                        {order.totalAmount?.toLocaleString('ar-SA')} ريال
                      </span>
                    </div>
                    {order.payment?.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم المعاملة:</span>
                        <span className="font-mono text-xs">{order.payment.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPinIcon className="w-5 h-5 ml-2 text-blue-600" />
                  عنوان التوصيل
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shippingAddress?.fullName}</p>
                  <p className="text-gray-600">{order.shippingAddress?.address}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress?.city}, {order.shippingAddress?.region} {order.shippingAddress?.postalCode}
                  </p>
                  <div className="flex items-center space-x-4 space-x-reverse mt-3">
                    <span className="flex items-center text-gray-600">
                      <PhoneIcon className="w-4 h-4 ml-1" />
                      {order.shippingAddress?.phone}
                    </span>
                    <span className="flex items-center text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 ml-1" />
                      {order.shippingAddress?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingBagIcon className="w-5 h-5 ml-2 text-gray-600" />
                  المنتجات المطلوبة
                </h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center bg-gray-50 p-4 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString('ar-SA')} ريال
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <PrinterIcon className="w-5 h-5 ml-2" />
                  طباعة الفاتورة
                </button>
                {order.payment?.status === 'failed' && (
                  <button
                    onClick={() => navigate('/checkout')}
                    className="flex items-center px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blueSecondary transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5 ml-2" />
                    إعادة المحاولة
                  </button>
                )}
                <Link
                  to="/products"
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all"
                >
                  <ShoppingBagIcon className="w-5 h-5 ml-2" />
                  متابعة التسوق
                </Link>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <TruckIcon className="w-12 h-12 text-brand-blue mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              الشحن عبر منصة بديل
            </h3>
            <p className="text-gray-600">
              سيتم شحن طلبك خلال 2-5 أيام عمل وستصلك رسالة SMS بتفاصيل الشحنة
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;
