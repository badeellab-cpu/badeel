import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentTextIcon,
  GiftIcon,
  TagIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  CreditCardIcon as CreditCardIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  TruckIcon as TruckIconSolid
} from '@heroicons/react/24/solid';
import { selectCartItems, selectCartTotal, selectCartItemsCount, updateQuantity, removeFromCart, clearCart } from '../store/slices/cartSlice';
import { getImageUrl } from '../config/api';
import paymentService from '../services/paymentService';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const cartItemsCount = useSelector(selectCartItemsCount);
  const { user } = useSelector((state) => state.auth);

  // Form states
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    additionalInfo: '',
    paymentMethod: 'cod',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    orderNotes: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      navigate('/products');
    }
  }, [cartItems, navigate]);

  // Calculate estimated delivery
  useEffect(() => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 2);
    setEstimatedDelivery(deliveryDate);
  }, []);

  // Calculate totals
  const subtotal = cartTotal;
  const shippingFee = subtotal > 500 ? 0 : 25;
  const discountAmount = appliedCoupon ? 
    appliedCoupon.type === 'percentage' ? 
      (subtotal * appliedCoupon.discount / 100) : 
      appliedCoupon.discount 
    : 0;
  const finalTotal = subtotal + shippingFee - discountAmount;

  // Apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('يرجى إدخال كود الخصم');
      return;
    }
    
    const validCoupons = {
      'BADEEL10': { discount: 10, type: 'percentage' },
      'SAVE50': { discount: 50, type: 'fixed' },
      'WELCOME15': { discount: 15, type: 'percentage' }
    };
    
    const coupon = validCoupons[couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon });
      toast.success('تم تطبيق كود الخصم بنجاح!');
      setCouponCode('');
    } else {
      toast.error('كود الخصم غير صحيح');
    }
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('يرجى إكمال جميع البيانات المطلوبة');
      return;
    }
    
    if (!formData.address || !formData.city) {
      toast.error('يرجى إكمال عنوان التوصيل');
      return;
    }

    // لا نطلب بيانات البطاقة هنا لأن ميسر سيتكفل بجمعها بأمان داخل النموذج المضمن

    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          additionalInfo: formData.additionalInfo
        },
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        orderNotes: formData.orderNotes,
        couponCode: appliedCoupon?.code
      };

      // Create payment
      const response = await paymentService.createPayment(orderData);

      if (formData.paymentMethod === 'cod') {
        // Cash on delivery - order confirmed directly
        dispatch(clearCart());
        toast.success('تم تأكيد طلبك بنجاح!');
        navigate(`/order-success/${response.order._id}`, { 
          state: { 
            orderData: response.order
          }
        });
      } else if (formData.paymentMethod === 'card') {
        // Handle card payment with Moyasar
        const { order, payment } = response;
        
        // إظهار المودال أولاً للتأكد من وجود العنصر في DOM
        setShowPaymentModal(true);

        // انتظر دورة رندر لإضافة العنصر ثم فعّل ميسر
        setTimeout(async () => {
          // تفريغ الحاوية قبل التهيئة
          const container = document.querySelector('.mysr-form');
          if (container) container.innerHTML = '';

          await paymentService.initializeMoyasar('.mysr-form', {
          publishable_api_key: payment.publishable_api_key || 'pk_test_jMJ9G9hod66VrmMqBjPv5GQxZX5d6LW8MKerNuYh',
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          callback_url: `${window.location.origin}/order-success/${order._id}`,
          methods: ['creditcard'],
          metadata: payment.metadata || {},
          on_completed: async (paymentResult) => {
            // Payment completed successfully by Moyasar
            console.log('Moyasar payment completed:', paymentResult);
            
            // Don't clear cart here - wait for confirmation
            // Moyasar will redirect to callback_url automatically
            // If it doesn't, manually redirect with payment ID
            setTimeout(() => {
              window.location.href = `${window.location.origin}/order-success/${order._id}?payment_id=${paymentResult.id}`;
            }, 1000);
          },
          on_failure: (error) => {
            console.error('Payment failed:', error);
            toast.error('فشلت عملية الدفع. يرجى المحاولة مرة أخرى.');
            setIsProcessing(false);
          }
        });
        }, 0);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(error.message || 'حدث خطأ أثناء معالجة طلبك');
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/30 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-blue/10 to-brand-blueSecondary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-tr from-brand-green/8 to-brand-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-64 h-64 bg-gradient-to-tl from-indigo-200/20 to-blue-200/10 rounded-full blur-2xl"></div>
      </div>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-br from-brand-blue to-brand-blueSecondary rounded-lg ml-3">
                  <ShoppingCartIcon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                إتمام الطلب
              </h1>
              <p className="text-gray-600 mt-1">
                {cartItemsCount} منتج • {finalTotal.toLocaleString('ar-SA')} ريال
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Review */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <ShoppingCartIcon className="h-6 w-6 ml-3" />
                  مراجعة منتجات السلة
                </h2>
                <p className="text-blue-100 mt-1">تأكد من صحة المنتجات والكميات</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={getImageUrl(item.product.images[0].url)}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{item.product.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-lg font-bold text-brand-blue">
                            {item.product.price.toLocaleString('ar-SA')} ريال
                          </span>
                          {item.product.lab?.labName && (
                            <span className="text-xs text-gray-500 mr-3">
                              {item.product.lab.labName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity - 1 }))}
                            className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <MinusIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="px-4 py-2 font-medium text-gray-900 min-w-[50px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity + 1 }))}
                            className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            disabled={item.quantity >= item.product.quantity}
                          >
                            <PlusIcon className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <button
                          onClick={() => dispatch(removeFromCart(item.product._id))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {(item.product.price * item.quantity).toLocaleString('ar-SA')} ريال
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} × {item.product.price.toLocaleString('ar-SA')}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center mb-3">
                    <GiftIcon className="w-5 h-5 text-yellow-600 ml-2" />
                    <h3 className="font-semibold text-yellow-800">كود الخصم</h3>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <CheckCircleIconSolid className="w-5 h-5 text-green-600 ml-2" />
                        <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                        <span className="text-sm text-green-600 mr-2">
                          (خصم {appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : `${appliedCoupon.discount} ريال`})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          toast.success('تم إلغاء كود الخصم');
                        }}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="أدخل كود الخصم"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blueSecondary transition-colors font-medium"
                      >
                        تطبيق
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <UserIcon className="h-6 w-6 ml-3" />
                  بياناتك الشخصية
                </h2>
                <p className="text-blue-100 mt-1">أدخل بياناتك للتواصل معك</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الأول <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="أحمد"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الأخير <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="محمد"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        placeholder="ahmed@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        placeholder="05xxxxxxxx"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">حماية بياناتك</p>
                      <p>نحن نحمي بياناتك الشخصية ولن نشاركها مع أطراف ثالثة. سيتم استخدامها فقط لمعالجة طلبك والتواصل معك.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <MapPinIcon className="h-6 w-6 ml-3" />
                  عنوان التوصيل
                </h2>
                <p className="text-blue-100 mt-1">حدد عنوان التوصيل المطلوب</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان التفصيلي <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="الشارع، رقم المبنى، رقم الشقة..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المدينة <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      required
                    >
                      <option value="">اختر المدينة</option>
                      <option value="riyadh">الرياض</option>
                      <option value="jeddah">جدة</option>
                      <option value="dammam">الدمام</option>
                      <option value="mecca">مكة المكرمة</option>
                      <option value="medina">المدينة المنورة</option>
                      <option value="khobar">الخبر</option>
                      <option value="taif">الطائف</option>
                      <option value="tabuk">تبوك</option>
                      <option value="abha">أبها</option>
                      <option value="hail">حائل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الرقم البريدي
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="12345"
                    />
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <TruckIconSolid className="w-6 h-6 text-blue-600 ml-2" />
                    <h3 className="font-semibold text-blue-900">معلومات التوصيل</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 text-blue-600 ml-2" />
                      <span className="text-sm text-blue-800">
                        مدة التوصيل: 2-5 أيام عمل
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ShieldCheckIconSolid className="w-4 h-4 text-blue-600 ml-2" />
                      <span className="text-sm text-blue-800">
                        شحن آمن ومضمون
                      </span>
                    </div>
                  </div>
                  {estimatedDelivery && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>التوصيل المتوقع:</strong>{' '}
                        {estimatedDelivery.toLocaleDateString('ar-SA', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <CreditCardIcon className="h-6 w-6 ml-3" />
                  طريقة الدفع
                </h2>
                <p className="text-blue-100 mt-1">اختر طريقة الدفع المناسبة</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="sr-only"
                    />
                    <label
                      htmlFor="cod"
                      className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        formData.paymentMethod === 'cod'
                          ? 'border-brand-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                        الأكثر استخداماً
                      </div>
                      <BanknotesIcon className={`w-8 h-8 mb-2 ${
                        formData.paymentMethod === 'cod' ? 'text-brand-blue' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium text-sm text-center ${
                        formData.paymentMethod === 'cod' ? 'text-brand-blue' : 'text-gray-700'
                      }`}>
                        الدفع عند الاستلام
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">
                        ادفع عند وصول الطلب
                      </span>
                      {formData.paymentMethod === 'cod' && (
                        <CheckCircleIconSolid className="absolute top-2 left-2 w-5 h-5 text-brand-blue" />
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="radio"
                      id="card"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="sr-only"
                    />
                    <label
                      htmlFor="card"
                      className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        formData.paymentMethod === 'card'
                          ? 'border-brand-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCardIconSolid className={`w-8 h-8 mb-2 ${
                        formData.paymentMethod === 'card' ? 'text-brand-blue' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium text-sm text-center ${
                        formData.paymentMethod === 'card' ? 'text-brand-blue' : 'text-gray-700'
                      }`}>
                        بطاقة ائتمان
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">
                        فيزا أو ماستركارد
                      </span>
                      {formData.paymentMethod === 'card' && (
                        <CheckCircleIconSolid className="absolute top-2 left-2 w-5 h-5 text-brand-blue" />
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="radio"
                      id="bank"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === 'bank'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="sr-only"
                    />
                    <label
                      htmlFor="bank"
                      className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        formData.paymentMethod === 'bank'
                          ? 'border-brand-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DocumentTextIcon className={`w-8 h-8 mb-2 ${
                        formData.paymentMethod === 'bank' ? 'text-brand-blue' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium text-sm text-center ${
                        formData.paymentMethod === 'bank' ? 'text-brand-blue' : 'text-gray-700'
                      }`}>
                        تحويل بنكي
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">
                        تحويل مباشر من البنك
                      </span>
                      {formData.paymentMethod === 'bank' && (
                        <CheckCircleIconSolid className="absolute top-2 left-2 w-5 h-5 text-brand-blue" />
                      )}
                    </label>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <LockClosedIcon className="w-5 h-5 text-green-600 mt-0.5 ml-2 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">معاملة آمنة ومحمية</p>
                      <p>جميع المعلومات محمية بتشفير SSL وتتم معالجة المدفوعات عبر بوابات دفع آمنة معتمدة.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Button */}
            <div className="flex items-center justify-center">
              <motion.button
                onClick={handleSubmitOrder}
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-12 py-4 bg-gradient-to-r from-brand-blue via-brand-blueSecondary to-brand-blue text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg shadow-lg disabled:opacity-50 flex items-center overflow-hidden group"
              >
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative flex items-center">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent ml-3"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-6 h-6 ml-3" />
                      تأكيد الطلب والدفع
                    </>
                  )}
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </motion.button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <DocumentTextIcon className="h-6 w-6 ml-3" />
                    ملخص الطلب
                  </h3>
                  <p className="text-gray-300 mt-1">{cartItemsCount} منتج</p>
                </div>

                <div className="p-6">
                  {/* Order Items Summary */}
                  <div className="space-y-3 mb-6">
                    {cartItems.slice(0, 3).map((item) => (
                      <div key={item.product._id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={getImageUrl(item.product.images[0].url)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingCartIcon className="w-6 h-6 text-gray-400 m-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × {item.product.price.toLocaleString('ar-SA')} ريال
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {(item.product.price * item.quantity).toLocaleString('ar-SA')} ريال
                        </div>
                      </div>
                    ))}
                    {cartItems.length > 3 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        و {cartItems.length - 3} منتج آخر...
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">المجموع الفرعي:</span>
                      <span className="font-medium">{subtotal.toLocaleString('ar-SA')} ريال</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        الشحن:
                        {shippingFee === 0 && (
                          <span className="mr-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            مجاني
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        {shippingFee === 0 ? 'مجاني' : `${shippingFee} ريال`}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-green-600">
                        <span className="flex items-center">
                          <TagIcon className="w-4 h-4 ml-1" />
                          خصم ({appliedCoupon.code}):
                        </span>
                        <span className="font-medium">
                          -{discountAmount.toLocaleString('ar-SA')} ريال
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>المجموع الكلي:</span>
                        <span className="text-brand-blue">
                          {finalTotal.toLocaleString('ar-SA')} ريال
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free Shipping Progress */}
                  {shippingFee > 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center mb-2">
                        <TruckIcon className="w-4 h-4 text-yellow-600 ml-2" />
                        <span className="text-sm font-medium text-yellow-800">
                          أضف {(500 - subtotal).toLocaleString('ar-SA')} ريال للحصول على شحن مجاني!
                        </span>
                      </div>
                      <div className="w-full bg-yellow-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <ShieldCheckIconSolid className="w-5 h-5 text-green-600 ml-2" />
                      <span className="text-xs text-green-800 font-medium">دفع آمن</span>
                    </div>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <TruckIconSolid className="w-5 h-5 text-blue-600 ml-2" />
                      <span className="text-xs text-blue-800 font-medium">شحن سريع</span>
                    </div>
                  </div>

                  {/* Special Offers */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center mb-2">
                      <SparklesIcon className="w-5 h-5 text-purple-600 ml-2" />
                      <span className="text-sm font-medium text-purple-800">عروض خاصة</span>
                    </div>
                    <ul className="space-y-1 text-xs text-purple-700">
                      <li>• ضمان الاسترداد خلال 14 يوم</li>
                      <li>• خدمة عملاء 24/7</li>
                      <li>• تتبع الشحنة مجاناً</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-blue border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">جاري معالجة طلبك</h3>
              <p className="text-gray-600 mb-4">يرجى عدم إغلاق الصفحة أو الضغط على زر الرجوع</p>
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moyasar Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
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
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCardIcon className="w-8 h-8 ml-3" />
                    <h2 className="text-2xl font-bold">إتمام عملية الدفع</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setIsProcessing(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Moyasar Form Container */}
                <div className="mb-6">
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 shadow-sm">
                    <div className="mysr-form"></div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t">
                  <div className="flex items-center text-gray-600">
                    <LockClosedIcon className="w-5 h-5 ml-2 text-green-600" />
                    <span className="text-sm">دفع آمن 100%</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ShieldCheckIcon className="w-5 h-5 ml-2 text-blue-600" />
                    <span className="text-sm">معتمد من ميسر</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CreditCardIconSolid className="w-5 h-5 ml-2 text-purple-600" />
                    <span className="text-sm">جميع البطاقات مقبولة</span>
                  </div>
                </div>

                {/* Test Cards Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 ml-2" />
                    بطاقات تجريبية
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• بطاقة نجاح: <span className="font-mono">4111 1111 1111 1111</span></p>
                    <p>• بطاقة فشل: <span className="font-mono">4000 0000 0000 0002</span></p>
                    <p>• تاريخ الانتهاء: أي تاريخ مستقبلي</p>
                    <p>• CVV: أي 3 أرقام</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
