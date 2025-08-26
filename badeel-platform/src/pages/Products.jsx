import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  HeartIcon,
  EyeIcon,
  ShoppingCartIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { productsAPI, categoriesAPI } from '../config/api';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { addToCart } from '../store/slices/cartSlice';
import { getImageUrl } from '../config/api';

const Products = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.auth);
  
  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [currentPriceRange, setCurrentPriceRange] = useState({ min: 0, max: 100000 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [hoveredProductId, setHoveredProductId] = useState(null);

  const limit = 12;

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        // Only include search if at least 2 chars to satisfy backend validator
        ...(searchTerm && searchTerm.trim().length >= 2 ? { search: searchTerm.trim() } : {}),
        sortBy: sortBy,
        sortOrder: sortOrder,
        status: 'active',
        approvalStatus: 'approved',
      };

      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterType !== 'all') params.type = filterType;
      if (filterCondition !== 'all') params.condition = filterCondition;
      if (currentPriceRange.min > 0) params.minPrice = currentPriceRange.min;
      if (currentPriceRange.max < 100000) params.maxPrice = currentPriceRange.max;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products || []);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
      setTotalProducts(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('فشل في جلب المنتجات');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    dispatch(fetchCategories({ isActive: true, limit: 100 }));
    fetchProducts();
  }, [dispatch]);

  // Refetch on filter/sort changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterCategory, filterType, filterCondition, sortBy, sortOrder, page, currentPriceRange]);

  // Toggle favorite
  const toggleFavorite = useCallback((productId) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    setFavorites(prev => {
      if (prev.includes(productId)) {
        toast.success('تم إزالة المنتج من المفضلة');
        return prev.filter(id => id !== productId);
      } else {
        toast.success('تم إضافة المنتج إلى المفضلة');
        return [...prev, productId];
      }
    });
  }, [user, navigate]);

  // Add to cart
  const handleAddToCart = useCallback((product, e) => {
    e?.stopPropagation();
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    if (product.type !== 'sale') {
      toast.error('هذا المنتج متاح للتبادل فقط');
      return;
    }

    dispatch(addToCart({ product, quantity: 1 }));
  }, [user, navigate, dispatch]);



  // Quick view
  const openQuickView = useCallback((product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  }, []);

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

  // Render product card
  const renderProductCard = (product) => (
    <motion.div
      key={product._id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative"
      onMouseEnter={() => setHoveredProductId(product._id)}
      onMouseLeave={() => setHoveredProductId(null)}
    >
      {/* Sale/Exchange Badge */}
      <div className="absolute top-4 left-4 z-10">
        {product.type === 'sale' ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white shadow-lg">
            <CurrencyDollarIcon className="w-3 h-3 ml-1" />
            للبيع
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg">
            <ArrowsRightLeftIcon className="w-3 h-3 ml-1" />
            للتبادل
          </span>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(product._id);
        }}
        className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-200 group/fav"
      >
        {favorites.includes(product._id) ? (
          <HeartIconSolid className="w-5 h-5 text-red-500 group-hover/fav:scale-110 transition-transform" />
        ) : (
          <HeartIcon className="w-5 h-5 text-gray-600 group-hover/fav:text-red-500 group-hover/fav:scale-110 transition-all" />
        )}
      </button>

      {/* Product Image */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {product.images && product.images.length > 0 ? (
          <motion.img
            src={getImageUrl(product.images[0].url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            whileHover={{ scale: 1.1 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-20 h-20 text-gray-300" />
          </div>
        )}

        {/* Stock Alert for Out of Stock */}
        {product.quantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm">
              نفدت الكمية
            </div>
          </div>
        )}

        {/* Quick View Overlay */}
        {product.quantity > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hoveredProductId === product._id ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-4 pointer-events-none"
          >
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: hoveredProductId === product._id ? 0 : 20, opacity: hoveredProductId === product._id ? 1 : 0 }}
              transition={{ delay: 0.1 }}
              onClick={(e) => {
                e.stopPropagation();
                openQuickView(product);
              }}
              className="pointer-events-auto px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-gray-800 hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
            >
              <EyeIcon className="w-4 h-4" />
              عرض سريع
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Category */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-500">{getCategoryName(product.category)}</span>
          {product.condition && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-gray-500">{getConditionLabel(product.condition)}</span>
            </>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Product Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        {product.rating?.average > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating.average)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.rating.count})</span>
          </div>
        )}

        {/* Price/Exchange Info */}
        <div className="flex items-center justify-between mb-4">
          {product.quantity === 0 ? (
            <div className="flex items-center gap-2 text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">نفدت الكمية</span>
            </div>
          ) : product.type === 'sale' ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {product.price?.toLocaleString('ar-SA')}
              </span>
              <span className="text-sm text-gray-500">{product.currency || 'ريال'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ArrowsRightLeftIcon className="w-5 h-5 text-teal-600" />
              <span className="text-lg font-semibold text-teal-600">متاح للتبادل</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TagIcon className="w-4 h-4" />
            <span>{product.quantity} {product.unit || 'قطعة'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {product.quantity === 0 ? (
            <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">غير متوفر</span>
              </div>
            </div>
          ) : product.type === 'sale' ? (
            <>
              <button
                onClick={(e) => handleAddToCart(product, e)}
                className="flex-1 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white px-4 py-2.5 rounded-xl font-medium hover:opacity-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                أضف للسلة
              </button>
              <button
                onClick={() => navigate(`/products/${product.slug || product._id}`)}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <EyeIcon className="w-5 h-5 text-gray-700" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/products/${product.slug || product._id}`)}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2.5 rounded-xl font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
                طلب تبادل
              </button>
              <button
                onClick={() => navigate(`/products/${product.slug || product._id}`)}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <EyeIcon className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4" />
              منصة موثوقة للمختبرات الطبية
            </div>
            <h1 className="text-5xl font-bold mb-6">
              متجر الأجهزة والمستلزمات الطبية
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              اكتشف مجموعة واسعة من الأجهزة والمستلزمات الطبية المتاحة للبيع أو التبادل بين المختبرات المعتمدة
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-1">{totalProducts}+</div>
                <div className="text-blue-100 text-sm">منتج متاح</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-1">{categories.length}+</div>
                <div className="text-blue-100 text-sm">فئة متنوعة</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-blue-100 text-sm">دعم متواصل</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Products Section */}
      <section className="container mx-auto px-4 py-12">
        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن المنتجات (2 أحرف على الأقل)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
              >
                <option value="all">جميع الفئات</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name?.ar || cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
              >
                <option value="all">جميع الأنواع</option>
                <option value="sale">للبيع</option>
                <option value="exchange">للتبادل</option>
              </select>
            </div>

            {/* Sort */}
            <div className="lg:col-span-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort);
                  setSortOrder(order);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
              >
                <option value="createdAt-desc">الأحدث أولاً</option>
                <option value="createdAt-asc">الأقدم أولاً</option>
                <option value="price-asc">السعر: الأقل أولاً</option>
                <option value="price-desc">السعر: الأعلى أولاً</option>
                <option value="name-asc">الاسم: أ - ي</option>
                <option value="name-desc">الاسم: ي - أ</option>
              </select>
            </div>

            {/* View Mode & Advanced Filters */}
            <div className="lg:col-span-2 flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className={`flex-1 p-3 rounded-xl border transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-blue-50 border-blue-500 text-blue-600' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {viewMode === 'grid' ? (
                  <Squares2X2Icon className="w-5 h-5 mx-auto" />
                ) : (
                  <ListBulletIcon className="w-5 h-5 mx-auto" />
                )}
              </button>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex-1 p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            عرض <span className="font-semibold text-gray-900">{products.length}</span> من أصل{' '}
            <span className="font-semibold text-gray-900">{totalProducts}</span> منتج
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-16 text-center"
          >
            <ShoppingBagIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد منتجات</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              لم نتمكن من العثور على منتجات تطابق معايير البحث الخاصة بك.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterType('all');
                setFilterCondition('all');
                setCurrentPriceRange({ min: 0, max: 100000 });
              }}
              className="px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-xl font-medium hover:opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              إعادة تعيين الفلاتر
            </button>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            <AnimatePresence mode="popLayout">
              {products.map((product) => renderProductCard(product))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              السابق
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              التالي
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Products;
