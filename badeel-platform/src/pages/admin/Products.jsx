import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  CubeIcon, 
  PlusIcon, 
  PhotoIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArrowPathRoundedSquareIcon,
  BuildingStorefrontIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, StarIcon } from '@heroicons/react/24/solid';
import { productsAPI, categoriesAPI, labsAPI, adminAPI } from '../../config/api';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { getImageUrl } from '../../config/api';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  
  // States
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, pending
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    lab: '',
    type: 'sale',
    quantity: 1,
    unit: 'قطعة',
    price: '',
    currency: 'SAR',
    condition: 'new',
    brand: '',
    model: '',
    manufacturerCountry: '',
    specifications: [],
    tags: [],

    exchangePreferences: {
      preferredCategories: [],
      preferredProducts: [],
      notes: ''
    }
  });

  // Fetch all products (admin can see all)
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const params = { 
        limit: 100,
        status: 'all', // Admin can see all statuses
        approvalStatus: 'all' // Admin can see all approval statuses
      };
      if (searchTerm) params.search = searchTerm;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterLab !== 'all') params.lab = filterLab;
      
      const response = await adminAPI.getAllProducts(params);
      const allProducts = response.data.data.products || [];
      
      // Separate pending products
      const pending = allProducts.filter(p => p.approvalStatus === 'pending');
      const others = allProducts.filter(p => p.approvalStatus !== 'pending');
      
      setPendingProducts(pending);
      setProducts(others);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data);
      toast.error('فشل في جلب المنتجات');
      setProducts([]);
      setPendingProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all labs
  const fetchLabs = async () => {
    try {
      const response = await labsAPI.getAll({ limit: 100 });
      // Filter labs with approved users
      const approvedLabs = (response.data.data.labs || []).filter(lab => 
        lab.user && lab.user.status === 'approved'
      );
      setLabs(approvedLabs);
      console.log('Fetched labs:', approvedLabs.length);
    } catch (error) {
      console.error('Error fetching labs:', error);
      setLabs([]);
    }
  };

  // Safely get localized category name
  const getCategoryName = (category) => {
    if (!category) return 'غير مصنف';
    if (typeof category === 'string') return 'غير مصنف';
    const name = category.name ?? category;
    if (typeof name === 'string') return name;
    if (name?.ar) return name.ar;
    if (name?.en) return name.en;
    return 'غير مصنف';
  };

  // Initial fetch
  useEffect(() => {
    dispatch(fetchCategories({ isActive: true, limit: 100 }));
    fetchLabs();
    fetchAllProducts();
  }, [dispatch]);

  // Refetch on filter changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAllProducts();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType, filterStatus, filterLab]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle product submission (Admin creates for a lab)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.lab) {
      toast.error('يرجى اختيار المختبر');
      return;
    }
    
    if (!formData.name?.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    
    if (!formData.category) {
      toast.error('يرجى اختيار فئة المنتج');
      return;
    }
    
    if (!formData.description?.trim() || formData.description.trim().length < 10) {
      toast.error('وصف المنتج يجب أن يكون على الأقل 10 أحرف');
      return;
    }
    
    if (formData.type === 'sale' && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast.error('يرجى إدخال سعر صحيح للمنتج');
      return;
    }
    
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      toast.error('يرجى إدخال كمية صحيحة');
      return;
    }
    
    if (!uploadedImage && !editingProduct) {
      toast.error('يرجى إضافة صورة للمنتج');
      return;
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        unit: formData.unit || 'قطعة',
        condition: formData.condition || 'new',
        brand: formData.brand?.trim() || '',
        model: formData.model?.trim() || '',
        manufacturerCountry: formData.manufacturerCountry?.trim() || ''
      };

      // Only add assignedLab when creating new product (not editing)
      if (!editingProduct) {
        submitData.assignedLab = formData.lab;
      }

      // Add price for sale items
      if (formData.type === 'sale') {
        submitData.price = parseFloat(formData.price);
        submitData.currency = formData.currency || 'SAR';
      }

      // Add exchange preferences for exchange items
      if (formData.type === 'exchange') {
        submitData.exchangePreferences = {
          acceptedCategories: [],
          acceptedConditions: ['new', 'like_new', 'good', 'fair', 'poor'],
          preferredBrands: [],
          notes: formData.exchangePreferences.notes?.trim() || '',
          autoAccept: false
        };
      }

      // Add image if available
      if (uploadedImage) {
        submitData.images = [uploadedImage];
      }
      
      let response;
      if (editingProduct) {
        response = await productsAPI.update(editingProduct._id, submitData);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        response = await productsAPI.create(submitData);
        toast.success('تم إنشاء المنتج بنجاح');
      }
      
      fetchAllProducts();
      closeModal();
    } catch (error) {
      console.error('Error submitting product:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const firstError = errorData.errors[0];
          toast.error(firstError.message || firstError.msg || 'خطأ في البيانات');
        } else {
          toast.error(errorData.error || errorData.message || 'يرجى التحقق من البيانات');
        }
      } else {
        toast.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ المنتج');
      }
    }
  };

  // Handle approve product
  const handleApprove = async (productId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا المنتج؟')) {
      return;
    }
    
    try {
      await productsAPI.approve(productId, {});
      toast.success('تمت الموافقة على المنتج بنجاح');
      fetchAllProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('حدث خطأ أثناء الموافقة على المنتج');
    }
  };

  // Handle reject product
  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('يرجى إدخال سبب الرفض (على الأقل 10 أحرف)');
      return;
    }
    
    try {
      await productsAPI.reject(selectedProduct._id, { reason: rejectReason.trim() });
      toast.success('تم رفض المنتج');
      setIsRejectModalOpen(false);
      setSelectedProduct(null);
      setRejectReason('');
      fetchAllProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('حدث خطأ أثناء رفض المنتج');
    }
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }
    
    try {
      await productsAPI.delete(productId);
      toast.success('تم حذف المنتج بنجاح');
      fetchAllProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حذف المنتج');
    }
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      lab: '',
      type: 'sale',
      quantity: 1,
      unit: 'قطعة',
      price: '',
      currency: 'SAR',
      condition: 'new',
      brand: '',
      model: '',
      manufacturerCountry: '',
      specifications: [],
      tags: [],
      exchangePreferences: {
        preferredCategories: [],
        preferredProducts: [],
        notes: ''
      }
    });
    setImagePreview(null);
    setUploadedImage(null);
  };

  // Handle edit product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category._id || product.category,
      lab: product.lab?._id || product.lab,
      type: product.type,
      quantity: product.quantity,
      unit: product.unit,
      price: product.price || '',
      currency: product.currency || 'SAR',
      condition: product.condition,
      brand: product.brand || '',
      model: product.model || '',
      manufacturerCountry: product.manufacturerCountry || '',
      specifications: product.specifications || [],
      tags: product.tags || [],
      exchangePreferences: product.exchangePreferences || {
        preferredCategories: [],
        preferredProducts: [],
        notes: ''
      }
    });
    if (product.images && product.images.length > 0) {
      setImagePreview(getImageUrl(product.images[0].url));
    }
    setIsModalOpen(true);
  };

  // Get status badge
  const getStatusBadge = (product) => {
    const statusConfig = {
      pending: { icon: ClockIcon, text: 'قيد المراجعة', color: 'bg-blue-100 text-blue-800' },
      active: { icon: CheckCircleIcon, text: 'نشط', color: 'bg-green-100 text-green-800' },
      inactive: { icon: XCircleIcon, text: 'غير نشط', color: 'bg-gray-100 text-gray-800' },
      rejected: { icon: ExclamationTriangleIcon, text: 'مرفوض', color: 'bg-red-100 text-red-800' },
      sold: { icon: CheckCircleIcon, text: 'مباع', color: 'bg-blue-100 text-blue-800' },
      exchanged: { icon: ArrowPathRoundedSquareIcon, text: 'تم تبديله', color: 'bg-purple-100 text-purple-800' },
      draft: { icon: DocumentTextIcon, text: 'مسودة', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[product.status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 ml-1" />
        {config.text}
      </span>
    );
  };

  // Get approval badge
  const getApprovalBadge = (product) => {
    const approvalConfig = {
      pending: { icon: ClockIcon, text: 'بانتظار المراجعة', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      approved: { icon: ShieldCheckIcon, text: 'معتمد', color: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { icon: ShieldExclamationIcon, text: 'مرفوض', color: 'bg-red-100 text-red-800 border-red-300' }
    };
    
    const config = approvalConfig[product.approvalStatus] || approvalConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-4 h-4 ml-1" />
        {config.text}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const typeConfig = {
      sale: { icon: CurrencyDollarIcon, text: 'للبيع', color: 'bg-blue-100 text-blue-800' },
      exchange: { icon: ArrowPathRoundedSquareIcon, text: 'للتبادل', color: 'bg-purple-100 text-purple-800' },
      asset: { icon: BuildingStorefrontIcon, text: 'أصل', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = typeConfig[type] || typeConfig.sale;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 ml-1" />
        {config.text}
      </span>
    );
  };

  // Render pending product card
  const renderPendingCard = (product) => (
    <motion.div
      key={product._id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-sm border-2 border-blue-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Pending Badge */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white px-4 py-3 text-center relative">
        <div className="flex items-center justify-center">
          <div className="p-1 bg-white/20 rounded-full ml-2">
            <ClockIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-sm">بانتظار المراجعة</span>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-transparent to-blue-600/20"></div>
      </div>

      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <img
            src={getImageUrl(product.images[0].url)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <PhotoIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getTypeBadge(product.type)}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
        
        {/* Lab Info */}
        <div className="flex items-center mb-3 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-blue-100">
          <div className="p-1 bg-blue-100 rounded-full ml-2">
            <BuildingOfficeIcon className="h-3 w-3 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-blue-800">
            {product.lab?.labName || 'مختبر غير محدد'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            {getCategoryName(product.category)}
          </span>
          <span className="text-xs text-gray-500">
            الكمية: {product.quantity} {product.unit}
          </span>
        </div>

        {product.type === 'sale' && (
          <div className="text-lg font-bold text-blue-600 mb-3">
            {product.price} {product.currency}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <button
            onClick={() => {
              setSelectedProduct(product);
              setIsViewModalOpen(true);
            }}
            className="flex-1 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white py-2.5 px-4 rounded-lg hover:opacity-95 transition-all duration-200 flex items-center justify-center text-sm font-medium shadow-sm"
          >
            <EyeIcon className="h-4 w-4 ml-1" />
            مراجعة
          </button>
          <button
            onClick={() => handleApprove(product._id)}
            className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <CheckCircleIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(product);
              setIsRejectModalOpen(true);
            }}
            className="p-2.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <XCircleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Render regular product card
  const renderProductCard = (product) => (
    <motion.div
      key={product._id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <img
            src={getImageUrl(product.images[0].url)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <PhotoIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 space-y-2">
          {getStatusBadge(product)}
          {getTypeBadge(product.type)}
        </div>
        <div className="absolute top-2 left-2">
          {getApprovalBadge(product)}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
        
        {/* Lab Info */}
        <div className="flex items-center mb-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <div className="p-1 bg-gray-200 rounded-full ml-2">
            <BuildingOfficeIcon className="h-3 w-3 text-gray-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {product.lab?.labName || 'مختبر غير محدد'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            {getCategoryName(product.category)}
          </span>
          <span className="text-xs text-gray-500">
            الكمية: {product.quantity} {product.unit}
          </span>
        </div>

        {product.type === 'sale' && (
          <div className="text-lg font-bold text-blue-600 mb-3">
            {product.price} {product.currency}
          </div>
        )}

        {/* Rating */}
        {product.rating?.average > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating.average)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 mr-2">
              ({product.rating.count} تقييم)
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={() => handleEdit(product)}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <PencilIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">تعديل</span>
          </button>
          <button
            onClick={() => window.open(`/products/${product.slug}`, '_blank')}
            className="flex items-center text-gray-600 hover:text-gray-700 transition-colors"
          >
            <EyeIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">عرض</span>
          </button>
          <button
            onClick={() => handleDelete(product._id)}
            className="flex items-center text-red-600 hover:text-red-700 transition-colors"
          >
            <TrashIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">حذف</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Render modal
  const renderModal = () => (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
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
                    {editingProduct ? (
                      <>
                        <PencilIcon className="h-7 w-7 ml-3" />
                        تعديل المنتج
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-7 w-7 ml-3" />
                        إضافة منتج جديد
                      </>
                    )}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {editingProduct ? 'قم بتحديث معلومات المنتج' : 'أضف منتج جديد لأحد المختبرات'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lab Selection (Admin Only) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingProduct ? 'المختبر المالك' : 'اختر المختبر'} <span className="text-red-500">*</span>
                  </label>
                  {editingProduct ? (
                    <div className="relative">
                      <div className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-500 ml-2" />
                          {editingProduct.lab?.labName || 'مختبر غير محدد'}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <InformationCircleIcon className="inline h-3 w-3 ml-1" />
                        لا يمكن تغيير المختبر المالك للمنتج
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        name="lab"
                        value={formData.lab}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-10 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        required
                      >
                        <option value="">-- اختر المختبر --</option>
                        {labs.map((lab) => (
                          <option key={lab._id} value={lab._id}>
                            {lab.labName}
                          </option>
                        ))}
                      </select>
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                      <p className="text-xs text-gray-500 mt-1">
                        <InformationCircleIcon className="inline h-3 w-3 ml-1" />
                        سيتم إضافة المنتج للمختبر المحدد
                      </p>
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر فئة المنتج <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                      required
                    >
                      <option value="">-- اختر الفئة المناسبة --</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {getCategoryName(category)}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="مثال: جهاز تحليل الدم الآلي"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Product Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف المنتج <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="اكتب وصفاً تفصيلياً للمنتج..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Product Image */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    صورة المنتج {!editingProduct && <span className="text-red-500">*</span>}
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start space-x-6 space-x-reverse">
                      {imagePreview ? (
                        <div className="relative group">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-40 w-40 object-cover rounded-xl shadow-lg border-2 border-blue-100"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setUploadedImage(null);
                              }}
                              className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transform hover:scale-110 transition-all"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="h-40 w-40 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                          <PhotoIcon className="h-14 w-14 text-blue-400 group-hover:text-blue-600 transition-colors" />
                          <span className="text-xs text-blue-600 mt-2 font-medium">اضغط لاختيار صورة</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">إرشادات الصورة:</h4>
                        <ul className="space-y-1 text-xs text-gray-600">
                          <li className="flex items-start">
                            <CheckCircleIconSolid className="h-4 w-4 text-green-500 ml-1 mt-0.5 flex-shrink-0" />
                            استخدم صورة واضحة وعالية الجودة
                          </li>
                          <li className="flex items-start">
                            <CheckCircleIconSolid className="h-4 w-4 text-green-500 ml-1 mt-0.5 flex-shrink-0" />
                            الحجم الأقصى: 5 ميجابايت
                          </li>
                          <li className="flex items-start">
                            <CheckCircleIconSolid className="h-4 w-4 text-green-500 ml-1 mt-0.5 flex-shrink-0" />
                            يُفضل نسبة 1:1 (مربعة)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    نوع المنتج <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.type === 'sale' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="sale"
                        checked={formData.type === 'sale'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <CurrencyDollarIcon className={`h-8 w-8 mx-auto mb-2 ${
                          formData.type === 'sale' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.type === 'sale' ? 'text-blue-900' : 'text-gray-700'
                        }`}>للبيع</span>
                      </div>
                      {formData.type === 'sale' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircleIconSolid className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                    </label>
                    
                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.type === 'exchange' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="exchange"
                        checked={formData.type === 'exchange'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <ArrowPathRoundedSquareIcon className={`h-8 w-8 mx-auto mb-2 ${
                          formData.type === 'exchange' ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.type === 'exchange' ? 'text-purple-900' : 'text-gray-700'
                        }`}>للتبادل</span>
                      </div>
                      {formData.type === 'exchange' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircleIconSolid className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </label>
                    
                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.type === 'asset' ? 'border-gray-600 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="type"
                        value="asset"
                        checked={formData.type === 'asset'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <BuildingStorefrontIcon className={`h-8 w-8 mx-auto mb-2 ${
                          formData.type === 'asset' ? 'text-gray-700' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.type === 'asset' ? 'text-gray-900' : 'text-gray-700'
                        }`}>أصل</span>
                      </div>
                      {formData.type === 'asset' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircleIconSolid className="h-5 w-5 text-gray-700" />
                        </div>
                      )}
                    </label>
                  </div>
                  {formData.type === 'asset' && (
                    <p className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded-lg">
                      <InformationCircleIcon className="inline h-3 w-3 ml-1" />
                      الأصول لا تظهر في المتجر ولا تحتاج موافقة حتى يتم تغيير نوعها
                    </p>
                  )}
                </div>

                {/* Price (only for sale) */}
                {formData.type === 'sale' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      السعر <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2 space-x-reverse">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={formData.type === 'sale'}
                      />
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SAR">ريال</option>
                        <option value="USD">دولار</option>
                        <option value="EUR">يورو</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية المتوفرة <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2 space-x-reverse">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="قطعة"
                      className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    حالة المنتج
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">جديد</option>
                    <option value="like_new">كالجديد</option>
                    <option value="good">جيد</option>
                    <option value="fair">مقبول</option>
                    <option value="poor">يحتاج صيانة</option>
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العلامة التجارية
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="مثال: Siemens"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموديل
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="مثال: XN-1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    بلد المنشأ
                  </label>
                  <input
                    type="text"
                    name="manufacturerCountry"
                    value={formData.manufacturerCountry}
                    onChange={handleInputChange}
                    placeholder="مثال: ألمانيا"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>



                {/* Exchange Preferences (only for exchange) */}
                {formData.type === 'exchange' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات التبادل
                    </label>
                    <textarea
                      name="exchangePreferences.notes"
                      value={formData.exchangePreferences.notes}
                      onChange={handleInputChange}
                      placeholder="اكتب ما تريد تبديله مقابل هذا المنتج..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 space-x-reverse mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render product view modal
  const renderViewModal = () => (
    <AnimatePresence>
      {isViewModalOpen && selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsViewModalOpen(false)}
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
                    <EyeIcon className="h-7 w-7 ml-3" />
                    تفاصيل المنتج
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    مراجعة تفاصيل المنتج قبل اتخاذ القرار
                  </p>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">صورة المنتج</h3>
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img
                        src={getImageUrl(selectedProduct.images[0].url)}
                        alt={selectedProduct.name}
                        className="w-full h-80 object-cover"
                      />
                    ) : (
                      <div className="w-full h-80 flex items-center justify-center">
                        <PhotoIcon className="h-20 w-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات المنتج</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">اسم المنتج</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.name}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">الوصف</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">الفئة</label>
                          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {getCategoryName(selectedProduct.category)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">النوع</label>
                          <div className="mt-1">
                            {getTypeBadge(selectedProduct.type)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">الكمية</label>
                          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {selectedProduct.quantity} {selectedProduct.unit}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">الحالة</label>
                          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {selectedProduct.condition === 'new' ? 'جديد' :
                             selectedProduct.condition === 'like_new' ? 'كالجديد' :
                             selectedProduct.condition === 'good' ? 'جيد' :
                             selectedProduct.condition === 'fair' ? 'مقبول' :
                             selectedProduct.condition === 'poor' ? 'يحتاج صيانة' : selectedProduct.condition}
                          </p>
                        </div>
                      </div>

                      {selectedProduct.type === 'sale' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">السعر</label>
                          <p className="mt-1 text-lg font-bold text-blue-600 bg-blue-50 p-3 rounded-lg">
                            {selectedProduct.price} {selectedProduct.currency}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">المختبر</label>
                        <div className="mt-1 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-600 ml-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {selectedProduct.lab?.labName || 'مختبر غير محدد'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedProduct.brand && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">العلامة التجارية</label>
                            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.brand}</p>
                          </div>
                          {selectedProduct.model && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">الموديل</label>
                              <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.model}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedProduct.manufacturerCountry && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">بلد المنشأ</label>
                          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.manufacturerCountry}</p>
                        </div>
                      )}



                      {selectedProduct.type === 'exchange' && selectedProduct.exchangePreferences?.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">ملاحظات التبادل</label>
                          <p className="mt-1 text-sm text-gray-900 bg-purple-50 p-3 rounded-lg">
                            {selectedProduct.exchangePreferences.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 -m-6 mt-8 p-6 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium"
                  >
                    إغلاق
                  </button>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setIsRejectModalOpen(true);
                      }}
                      className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center font-medium"
                    >
                      <XCircleIcon className="h-5 w-5 ml-1 text-gray-500" />
                      رفض المنتج
                    </button>
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleApprove(selectedProduct._id);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all duration-200 flex items-center shadow-lg font-medium"
                    >
                      <CheckCircleIcon className="h-5 w-5 ml-1" />
                      الموافقة على المنتج
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render reject modal
  const renderRejectModal = () => (
    <AnimatePresence>
      {isRejectModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsRejectModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <div className="p-3 bg-white/10 rounded-lg ml-4">
                  <ShieldExclamationIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">رفض المنتج</h3>
                  <p className="text-gray-200 text-sm mt-1">يرجى ذكر سبب رفض المنتج للمختبر</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  سبب الرفض <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: المنتج لا يتوافق مع معايير الجودة المطلوبة..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  سيتم إرسال هذا السبب للمختبر لمساعدته في تحسين المنتج
                </p>
              </div>
              
              <div className="bg-gray-50 -m-6 p-6 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center font-medium shadow-lg"
                  >
                    <XCircleIcon className="h-5 w-5 ml-1" />
                    تأكيد الرفض
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CubeIcon className="h-8 w-8 ml-3 text-blue-600" />
                إدارة المنتجات
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                مراجعة وإدارة جميع منتجات المختبرات في المنصة
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة منتج جديد
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المنتجات</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.length + pendingProducts.length}
              </p>
            </div>
            <CubeIcon className="h-10 w-10 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">بانتظار المراجعة</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingProducts.length}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">منتجات نشطة</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المختبرات</p>
              <p className="text-2xl font-bold text-blue-600">
                {labs.length}
              </p>
            </div>
            <BuildingOfficeIcon className="h-10 w-10 text-blue-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CubeIcon className="h-5 w-5 ml-2" />
                جميع المنتجات
                <span className="mr-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {products.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 ml-2" />
                طلبات المراجعة
                {pendingProducts.length > 0 && (
                  <span className="mr-2 bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs animate-pulse">
                    {pendingProducts.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأنواع</option>
              <option value="sale">للبيع</option>
              <option value="exchange">للتبادل</option>
              <option value="asset">أصل</option>
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>

            {/* Filter by Lab */}
            <select
              value={filterLab}
              onChange={(e) => setFilterLab(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">جميع المختبرات</option>
              {labs.map(lab => (
                <option key={lab._id} value={lab._id}>
                  {lab.labName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'pending' ? (
            pendingProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
              >
                <ShieldCheckIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات مراجعة</h3>
                <p className="text-gray-500">جميع المنتجات تمت مراجعتها</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pendingProducts.map(product => renderPendingCard(product))}
              </div>
            )
          ) : (
            products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
              >
                <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500 mb-6">ابدأ بإضافة أول منتج للمنصة</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 ml-2" />
                  إضافة منتج جديد
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => renderProductCard(product))}
              </div>
            )
          )}
        </>
      )}

      {/* Add Product Modal */}
      {renderModal()}

      {/* View Product Modal */}
      {renderViewModal()}

      {/* Reject Modal */}
      {renderRejectModal()}
    </div>
  );
};

export default AdminProducts;