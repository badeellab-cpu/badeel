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
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { productsAPI, categoriesAPI } from '../../config/api';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { getImageUrl } from '../../config/api';

const LabProducts = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  
  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
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

  // Fetch products
  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all' && filterStatus !== 'pending' && filterStatus !== 'active' && filterStatus !== 'inactive') {
        // Don't send invalid status values
      } else if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await productsAPI.getMyProducts(params);
      setProducts(response.data.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('فشل في جلب المنتجات');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Safely get localized category name
  const getCategoryName = (category) => {
    if (!category) return 'غير مصنف';
    // In some API responses category may be an ID string
    if (typeof category === 'string') return 'غير مصنف';
    const name = category.name ?? category;
    if (typeof name === 'string') return name;
    if (name?.ar) return name.ar;
    if (name?.en) return name.en;
    return 'غير مصنف';
  };

  // Fetch categories
  useEffect(() => {
    dispatch(fetchCategories({ isActive: true, limit: 100 }));
    fetchMyProducts();
  }, [dispatch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMyProducts();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType, filterStatus]);

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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

  // Handle product submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    
    if (!formData.category) {
      toast.error('يرجى اختيار فئة المنتج');
      return;
    }
    
    if (!formData.description?.trim()) {
      toast.error('يرجى إدخال وصف المنتج');
      return;
    }
    
    if (formData.description.trim().length < 10) {
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
      // Prepare clean data for submission
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        unit: formData.unit || 'قطعة',
        condition: formData.condition,
        brand: formData.brand?.trim() || '',
        model: formData.model?.trim() || '',
        manufacturerCountry: formData.manufacturerCountry?.trim() || ''
      };

      // Add price for sale items
      if (formData.type === 'sale') {
        submitData.price = parseFloat(formData.price);
        submitData.currency = formData.currency || 'SAR';
      }

      // Add exchange preferences for exchange items
      if (formData.type === 'exchange') {
        submitData.exchangePreferences = {
          acceptedCategories: [], // Will be set later when receiving exchange offers
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
        toast.success('تم إنشاء المنتج بنجاح وسيتم مراجعته من قبل الإدارة');
      }
      
      fetchMyProducts();
      closeModal();
    } catch (error) {
      console.error('Error submitting product:', error);
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Multiple validation errors
          const errorMessages = errorData.errors.map(err => err.message || err.msg).join(', ');
          toast.error(`خطأ في البيانات: ${errorMessages}`);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error('يرجى التحقق من البيانات المدخلة');
        }
        
        // Log full error for debugging
        console.error('Validation Error Details:', errorData);
      } else {
        toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء حفظ المنتج');
      }
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
      category: product.category._id,
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

  // Handle delete product
  const handleDelete = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }
    
    try {
      await productsAPI.delete(productId);
      toast.success('تم حذف المنتج بنجاح');
      fetchMyProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حذف المنتج');
    }
  };

  // Get status badge
  const getStatusBadge = (product) => {
    const statusConfig = {
      pending: { icon: ClockIcon, text: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
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

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
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
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
            
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
      ))}
    </div>
  );

  // Render table view
  const renderTableView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المنتج
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الفئة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                السعر
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكمية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {product.images && product.images.length > 0 ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={getImageUrl(product.images[0].url)}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <PhotoIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{getCategoryName(product.category)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTypeBadge(product.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.type === 'sale' ? (
                    <span className="text-sm font-medium text-gray-900">
                      {product.price} {product.currency}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {product.quantity} {product.unit}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(product)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => window.open(`/products/${product.slug}`, '_blank')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
                    {editingProduct ? 'قم بتحديث معلومات المنتج' : 'أضف منتجك للمنصة ليراه المختبرات الأخرى'}
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
                {/* Progress Steps */}
                <div className="md:col-span-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <span className="mr-2 text-sm font-medium text-gray-700">المعلومات الأساسية</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <span className="mr-2 text-sm font-medium text-gray-400">التفاصيل الإضافية</span>
                    </div>
                  </div>
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
                          {category.name?.ar || category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">اختر الفئة التي تناسب منتجك من القائمة المعتمدة</p>
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
                            الصيغ المدعومة: PNG, JPG, GIF
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CubeIcon className="h-8 w-8 ml-3 text-blue-600" />
                منتجات المختبر
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                إدارة جميع منتجات المختبر المعروضة في المنصة
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

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setSortBy(sort);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">الأحدث أولاً</option>
            <option value="createdAt-asc">الأقدم أولاً</option>
            <option value="price-asc">السعر: من الأقل للأعلى</option>
            <option value="price-desc">السعر: من الأعلى للأقل</option>
            <option value="name-asc">الاسم: أ - ي</option>
            <option value="name-desc">الاسم: ي - أ</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-gray-500">
            عرض {products.length} منتج
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
        >
          <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500 mb-6">ابدأ بإضافة منتجك الأول للمنصة</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            إضافة منتج جديد
          </button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        renderGridView()
      ) : (
        renderTableView()
      )}

      {/* Add Product Modal */}
      {renderModal()}
    </div>
  );
};

export default LabProducts;
