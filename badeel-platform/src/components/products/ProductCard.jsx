import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  HeartIcon,
  ShoppingCartIcon,
  ArrowsRightLeftIcon as SwapHorizontalIcon,
  EyeIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon as LocationMarkerIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { addToCart } from '../../store/slices/cartSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { getImageUrl } from '../../config/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, variant = 'default' }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    if (product.type === 'sale' && product.quantity > 0) {
      dispatch(addToCart({ product, quantity: 1 }));
    } else if (product.quantity === 0) {
      toast.error('المنتج غير متوفر حالياً');
    }
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'تم إزالة من المفضلة' : 'تم إضافة إلى المفضلة');
  };

  const getTypeColor = () => {
    switch (product.type) {
      case 'sale':
        return 'from-brand-blue to-brand-blueSecondary';
      case 'exchange':
        return 'from-teal-500 to-green-500';
      case 'asset':
        return 'from-gray-600 to-gray-800';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = () => {
    switch (product.type) {
      case 'sale':
        return ShoppingCartIcon;
      case 'exchange':
        return SwapHorizontalIcon;
      default:
        return EyeIcon;
    }
  };

  const getTypeLabel = () => {
    switch (product.type) {
      case 'sale':
        return 'للبيع';
      case 'exchange':
        return 'للتبادل';
      case 'asset':
        return 'أصول';
      default:
        return '';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  const getConditionLabel = (condition) => {
    const conditions = {
      new: 'جديد',
      like_new: 'كالجديد',
      good: 'جيد',
      fair: 'مقبول',
    };
    return conditions[condition] || condition;
  };

  const TypeIcon = getTypeIcon();

  if (variant === 'list') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
      >
        <Link to={`/products/${product.slug || product._id}`} className="flex">
          <div className="relative w-48 h-48">
            <img
              src={imageError ? '/placeholder-product.jpg' : getImageUrl(product.images?.[0])}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className={`absolute top-2 left-2 px-2 py-1 bg-gradient-to-r ${getTypeColor()} text-white text-xs rounded-full`}>
              {getTypeLabel()}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h3>
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isFavorite ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <LocationMarkerIcon className="w-4 h-4" />
                {product.lab?.city || 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {getConditionLabel(product.condition)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              {product.type === 'sale' && (
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
              {product.type === 'exchange' && (
                <span className="text-lg font-semibold text-brand-blue">
                  متاح للتبادل
                </span>
              )}
              {product.quantity === 0 ? (
                <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">نفدت الكمية</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="px-4 py-2 rounded-lg font-semibold transition-all bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white hover:shadow-lg"
                >
                  أضف للسلة
                </button>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
    >
      <Link to={`/products/${product.slug || product._id}`}>
        <div className="relative h-64 overflow-hidden">
          <img
            src={imageError ? '/placeholder-product.jpg' : getImageUrl(product.images?.[0])}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Type Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 bg-gradient-to-r ${getTypeColor()} text-white text-sm rounded-full flex items-center gap-1`}>
            <TypeIcon className="w-4 h-4" />
            {getTypeLabel()}
          </div>
          
          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {/* Quick Actions - Show on hover */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {product.quantity === 0 ? (
              <div className="flex-1 px-4 py-2 bg-red-500/90 backdrop-blur-sm rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">نفدت الكمية</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg font-semibold hover:bg-white transition-all"
              >
                إضافة للسلة
              </button>
            )}
            <Link
              to={`/products/${product.slug || product._id}`}
              className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all"
            >
              <EyeIcon className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Stock Badge */}
          {product.quantity === 0 ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
              <div className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">
                نفدت الكمية
              </div>
            </div>
          ) : product.quantity <= 5 && (
            <div className="absolute top-4 right-16 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              متبقي {product.quantity} فقط
            </div>
          )}
        </div>
        
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-brand-blue transition-colors">
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
          
          {/* Meta Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <LocationMarkerIcon className="w-4 h-4" />
              {product.lab?.city || 'غير محدد'}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
              {getConditionLabel(product.condition)}
            </span>
          </div>
          
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                ({product.reviewsCount || 0})
              </span>
            </div>
          )}
          
          {/* Price/Exchange */}
          <div className="flex justify-between items-center">
            {product.quantity === 0 ? (
              <div className="flex items-center gap-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">نفدت الكمية</span>
              </div>
            ) : product.type === 'sale' ? (
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-500 line-through mr-2">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            ) : product.type === 'exchange' ? (
              <span className="text-lg font-semibold text-brand-blue">
                متاح للتبادل
              </span>
            ) : (
              <span className="text-lg font-semibold text-purple-600">
                أصول ثابتة
              </span>
            )}
            
            {/* Lab Name */}
            <Link
              to={`/labs/${product.lab?._id}`}
              className="text-sm text-gray-600 hover:text-brand-blue transition-colors"
            >
              {product.lab?.name || 'مختبر غير محدد'}
            </Link>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;