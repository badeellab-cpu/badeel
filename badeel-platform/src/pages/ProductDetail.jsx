import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  HeartIcon,
  ShoppingCartIcon,
  TagIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
  TruckIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { productsAPI } from '../config/api';
import { addToCart } from '../store/slices/cartSlice';
import { getImageUrl } from '../config/api';
import ExchangeRequestModal from '../components/exchange/ExchangeRequestModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { categories } = useSelector((state) => state.categories);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Fetch product details
  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Try to fetch by slug first, then by ID
      let response;
      try {
        response = await productsAPI.getBySlug(id);
      } catch (slugError) {
        // If slug fails, try ID
        response = await productsAPI.getById(id);
      }
      
      const productData = response.data.data;
      setProduct(productData);
      
      // Fetch related products
      if (productData.category) {
        fetchRelatedProducts(productData.category._id || productData.category, productData._id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('فشل في جلب تفاصيل المنتج');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId, currentProductId) => {
    try {
      const response = await productsAPI.getAll({
        category: categoryId,
        limit: 4,
        status: 'active',
        approvalStatus: 'approved',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      const filtered = response.data.data.products.filter(p => p._id !== currentProductId);
      setRelatedProducts(filtered.slice(0, 4));
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'تم إزالة المنتج من المفضلة' : 'تم إضافة المنتج إلى المفضلة');
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    if (product.type !== 'sale') {
      toast.error('هذا المنتج متاح للتبادل فقط');
      return;
    }

    dispatch(addToCart({ product, quantity }));
  };

  // Handle exchange request
  const handleExchangeRequest = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    if (product.type !== 'exchange') {
      toast.error('هذا المنتج غير متاح للتبادل');
      return;
    }

    setShowExchangeModal(true);
  };

  // Get category name
  const getCategoryName = (category) => {
    if (!category) return 'غير مصنف';
    if (typeof category === 'string') {
      const cat = categories.find(c => c._id === category);
      return cat?.name?.ar || cat?.name || 'غير مصنف';
    }
    return category.name?.ar || category.name || 'غير مصنف';
  };

  // Get condition label
  const getConditionLabel = (condition) => {
    const conditions = {
      'new': 'جديد',
      'like_new': 'كالجديد',
      'like-new': 'كالجديد',
      'good': 'جيد',
      'fair': 'مقبول',
      'poor': 'يحتاج صيانة'
    };
    return conditions[condition] || condition;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        {/* Loading Progress Bar */}
        <div className="loading-bar"></div>
        
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">🔍 جاري تحميل تفاصيل المنتج</h3>
            <p className="text-gray-600">يرجى الانتظار قليلاً...</p>
            
            {/* Loading Steps */}
            <div className="mt-4 space-y-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl max-w-md mx-4"
        >
          <div className="text-8xl mb-6">🔍</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">المنتج غير موجود</h2>
          <p className="text-gray-600 mb-8 text-lg">عذراً، لم نتمكن من العثور على المنتج المطلوب</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/products')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:shadow-xl transition-all duration-300"
          >
            🛍️ العودة للمتجر
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => navigate('/')} 
              className="text-gray-500 hover:text-blue-600 transition-colors font-medium"
            >
              الرئيسية
            </button>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <button 
              onClick={() => navigate('/products')} 
              className="text-gray-500 hover:text-blue-600 transition-colors font-medium"
            >
              المنتجات
            </button>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Optimized Hero Section */}
      <div className="container mx-auto px-4 py-6">
        {/* Balanced Product Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Optimized Images Section */}
            <div className="relative">
              <div className="relative p-4 lg:p-6 bg-gray-50/50">
                {/* Main Image Container */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-md group">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <motion.img
                        key={selectedImageIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        src={getImageUrl(product.images[selectedImageIndex]?.url)}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                        onClick={() => setIsImageModalOpen(true)}
                      />
                      {/* Zoom Button */}
                      <button
                        onClick={() => setIsImageModalOpen(true)}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                      >
                        <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3">
                        {product.type === 'sale' ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm">
                            <CurrencyDollarIcon className="w-3 h-3 ml-1" />
                            للبيع
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white shadow-sm">
                            <ArrowsRightLeftIcon className="w-3 h-3 ml-1" />
                            للتبادل
                          </span>
                        )}
                      </div>
                      
                      {/* Stock Status */}
                      {product.quantity === 0 ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                            نفدت الكمية
                          </div>
                        </div>
                      ) : product.quantity <= 5 && (
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
                          متبقي {product.quantity} فقط
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <PhotoIcon className="w-32 h-32 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {product.images && product.images.length > 1 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-blue-500 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={getImageUrl(image.url)}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 lg:p-6">
              {/* Category Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                  {getCategoryName(product.category)}
                </span>
                {product.condition && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                    {getConditionLabel(product.condition)}
                  </span>
                )}
                {product.brand && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm font-medium">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating?.average > 0 && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating.average)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating.average.toFixed(1)} ({product.rating.count} تقييم)
                  </span>
                </div>
              )}

              {/* Price Section */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                {product.type === 'sale' ? (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">السعر</div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-blue-600">
                        {product.price?.toLocaleString('ar-SA')}
                      </span>
                      <span className="text-gray-600">{product.currency || 'ريال'}</span>
                    </div>
                    {product.quantity > 0 ? (
                      <div className="text-sm text-gray-500">
                        متاح: {product.quantity} {product.unit || 'قطعة'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 mt-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">نفدت الكمية</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    {product.quantity > 0 ? (
                      <>
                        <ArrowsRightLeftIcon className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                        <h3 className="font-bold text-teal-700 mb-1">متاح للتبادل</h3>
                        <div className="text-sm text-gray-500 mb-2">
                          متاح: {product.quantity} {product.unit || 'قطعة'}
                        </div>
                        {product.exchangePreferences?.notes && (
                          <p className="text-sm text-gray-600">
                            {product.exchangePreferences.notes}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold">نفدت الكمية</span>
                        </div>
                        <p className="text-sm text-red-500">غير متاح للتبادل حالياً</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.type === 'sale' && product.quantity > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-gray-600">الكمية:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-4 py-2 font-medium text-gray-900 min-w-[50px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={quantity >= product.quantity}
                    >
                      <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                {product.quantity === 0 ? (
                  <div className="flex-1 bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-3 text-red-600 mb-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg font-bold">نفدت الكمية</span>
                    </div>
                    <p className="text-red-500 text-sm">
                      عذراً، هذا المنتج غير متوفر حالياً. يرجى المحاولة لاحقاً أو تصفح منتجات أخرى مشابهة.
                    </p>
                  </div>
                ) : (
                  <>
                    {product.type === 'sale' ? (
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCartIcon className="w-5 h-5" />
                        أضف إلى السلة
                      </button>
                    ) : (
                      <button
                        onClick={handleExchangeRequest}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowsRightLeftIcon className="w-5 h-5" />
                        طلب تبادل
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={toggleFavorite}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isFavorite ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <TruckIcon className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">الشحن عبر بديل</p>
                    <p className="text-xs text-blue-700">خدمة شحن موثوقة</p>
                  </div>
                </div>
                
                {product.warranty?.available && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">ضمان</p>
                      <p className="text-xs text-blue-700">
                        {product.warranty.duration} {product.warranty.unit === 'months' ? 'شهر' : 'سنة'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">جودة مضمونة</p>
                    <p className="text-xs text-purple-700">منتج أصلي</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <BoltIcon className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">معالجة سريعة</p>
                    <p className="text-xs text-orange-700">خلال 24 ساعة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-t border-gray-100">
            <div className="flex border-b border-gray-100 px-6">
              {['description', 'specifications', 'shipping'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab === 'description' && 'الوصف'}
                  {tab === 'specifications' && 'المواصفات'}
                  {tab === 'shipping' && 'الشحن والتوصيل'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">وصف المنتج</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Specifications Tab */}
              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">المواصفات</h3>
                  <div className="space-y-3">
                    {product.brand && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">العلامة التجارية</span>
                        <span className="font-medium text-gray-900">{product.brand}</span>
                      </div>
                    )}
                    {product.model && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">الموديل</span>
                        <span className="font-medium text-gray-900">{product.model}</span>
                      </div>
                    )}
                    {product.manufacturerCountry && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">بلد المنشأ</span>
                        <span className="font-medium text-gray-900">{product.manufacturerCountry}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">الحالة</span>
                      <span className="font-medium text-gray-900">{getConditionLabel(product.condition)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">الكمية المتاحة</span>
                      <span className="font-medium text-gray-900">
                        {product.quantity} {product.unit || 'قطعة'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'shipping' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">الشحن والتوصيل</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <TruckIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 mb-3 text-xl">الشحن عبر منصة بديل</h4>
                        <div className="space-y-3">
                          <p className="text-blue-800 leading-relaxed">
                            🚚 جميع عمليات الشحن والتوصيل تتم من خلال منصة بديل المعتمدة
                          </p>
                          <p className="text-blue-800 leading-relaxed">
                            📦 نضمن لك وصول المنتج بحالة ممتازة وفي الوقت المحدد
                          </p>

                          <p className="text-blue-800 leading-relaxed">
                            ⚡ خدمة عملاء متاحة 24/7 لمساعدتك في أي استفسار
                          </p>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                          <h5 className="font-semibold text-blue-900 mb-2">مناطق التوصيل:</h5>
                          <p className="text-blue-800 text-sm">
                            📍 جميع مناطق المملكة العربية السعودية
                          </p>
                          <p className="text-blue-800 text-sm mt-1">
                            ⏰ مدة التوصيل: 2-5 أيام عمل حسب المنطقة
                          </p>
                        </div>
                        

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">منتجات مشابهة</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
                  onClick={() => navigate(`/products/${relatedProduct.slug || relatedProduct._id}`)}
                >
                  <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                    {relatedProduct.images && relatedProduct.images.length > 0 ? (
                      <img
                        src={getImageUrl(relatedProduct.images[0].url)}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      {relatedProduct.type === 'sale' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-600 text-white">
                          للبيع
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-600 text-white">
                          للتبادل
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">
                      {relatedProduct.name}
                    </h3>
                    
                    {relatedProduct.type === 'sale' && relatedProduct.price && (
                      <div className="text-lg font-bold text-blue-600 mb-2">
                        {relatedProduct.price?.toLocaleString('ar-SA')} {relatedProduct.currency || 'ريال'}
                      </div>
                    )}
                    
                    {/* Rating */}
                    {relatedProduct.rating && relatedProduct.rating.average > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(relatedProduct.rating.average)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({relatedProduct.rating.count || 0})
                        </span>
                      </div>
                    )}
                    
                    {/* Lab Name */}
                    <div className="text-xs text-gray-500">
                      {relatedProduct.lab?.labName || 'مختبر غير محدد'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View More Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                عرض المزيد من المنتجات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && product.images && product.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="w-8 h-8" />
              </button>
              
              <img
                src={getImageUrl(product.images[selectedImageIndex].url)}
                alt={product.name}
                className="w-full h-full object-contain rounded-lg"
              />
              
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronRightIcon className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exchange Request Modal */}
      <ExchangeRequestModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        targetProduct={product}
      />
    </div>
  );
};

export default ProductDetail;
