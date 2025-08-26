import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  ArrowsRightLeftIcon,
  PhotoIcon,
  PlusIcon,
  MinusIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import exchangeAPI from '../../services/exchangeAPI';
import productsAPI from '../../services/productsAPI';
import { getImageUrl } from '../../config/api';

const ExchangeRequestModal = ({ isOpen, onClose, targetProduct }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [formData, setFormData] = useState({
    requestedQuantity: 1,
    offerType: 'existing_product',
    offeredProductId: '',
    offeredQuantity: 1,
    customOffer: {
      name: '',
      description: '',
      condition: 'good',
      estimatedValue: 0,
      quantity: 1,
      images: [],
      specifications: [],
      brand: '',
      model: '',
      warranty: {
        available: false,
        duration: 0,
        unit: 'months',
        description: ''
      }
    },
    message: ''
  });

  // Load my exchange products
  useEffect(() => {
    if (isOpen) {
      loadMyProducts();
    }
  }, [isOpen]);

  const loadMyProducts = async () => {
    try {
      const response = await productsAPI.getMyProducts({ 
        type: 'exchange',
        status: 'active',
        limit: 50 
      });
      // response here is the API wrapper: { success, message, data: { products, pagination } }
      const products = response?.data?.products || response?.products || [];
      setMyProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCustomOfferChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customOffer: {
        ...prev.customOffer,
        [field]: value
      }
    }));
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      customOffer: {
        ...prev.customOffer,
        specifications: [
          ...prev.customOffer.specifications,
          { name: '', value: '', unit: '' }
        ]
      }
    }));
  };

  const removeSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      customOffer: {
        ...prev.customOffer,
        specifications: prev.customOffer.specifications.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSpecification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customOffer: {
        ...prev.customOffer,
        specifications: prev.customOffer.specifications.map((spec, i) => 
          i === index ? { ...spec, [field]: value } : spec
        )
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const requestData = {
        targetProductId: targetProduct._id,
        requestedQuantity: formData.requestedQuantity,
        offerType: formData.offerType,
        message: formData.message
      };

      if (formData.offerType === 'existing_product') {
        requestData.offeredProductId = formData.offeredProductId;
        requestData.offeredQuantity = formData.offeredQuantity;
      } else {
        requestData.customOffer = formData.customOffer;
      }

      await exchangeAPI.createExchangeRequest(requestData);
      toast.success('تم إرسال طلب التبادل بنجاح!');
      onClose();
      
      // Reset form
      setFormData({
        requestedQuantity: 1,
        offerType: 'existing_product',
        offeredProductId: '',
        offeredQuantity: 1,
        customOffer: {
          name: '',
          description: '',
          condition: 'good',
          estimatedValue: 0,
          quantity: 1,
          images: [],
          specifications: [],
          brand: '',
          model: '',
          warranty: {
            available: false,
            duration: 0,
            unit: 'months',
            description: ''
          }
        },
        message: ''
      });
      setStep(1);
    } catch (error) {
      toast.error(error.message || 'فشل في إرسال طلب التبادل');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = myProducts.find(p => p._id === formData.offeredProductId);

  if (!isOpen || !targetProduct) return null;

  return (
    <AnimatePresence>
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
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-blue to-brand-blueSecondary p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-lg ml-3">
                  <ArrowsRightLeftIconSolid className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">طلب تبادل</h2>
                  <p className="text-blue-100 text-sm">
                    الخطوة {step} من 3
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= stepNum 
                      ? 'bg-brand-blue text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step > stepNum ? (
                      <CheckCircleIconSolid className="w-5 h-5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      step > stepNum ? 'bg-brand-blue' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Target Product & Quantity */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    المنتج المطلوب للتبادل
                  </h3>
                  <p className="text-gray-600">
                    تأكد من تفاصيل المنتج والكمية المطلوبة
                  </p>
                </div>

                {/* Target Product Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-4">
                    <img
                      src={getImageUrl(targetProduct.images?.[0]?.url)}
                      alt={targetProduct.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {targetProduct.name}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        {targetProduct.description?.slice(0, 100)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          الكمية المتوفرة: {targetProduct.quantity}
                        </span>
                        <span className="text-sm text-gray-500">
                          الحالة: {targetProduct.condition === 'new' ? 'جديد' : 
                                   targetProduct.condition === 'like-new' ? 'مثل الجديد' :
                                   targetProduct.condition === 'good' ? 'جيد' :
                                   targetProduct.condition === 'fair' ? 'مقبول' : 'ضعيف'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requested Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية المطلوبة
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleInputChange('requestedQuantity', Math.max(1, formData.requestedQuantity - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={targetProduct.quantity}
                      value={formData.requestedQuantity}
                      onChange={(e) => handleInputChange('requestedQuantity', parseInt(e.target.value) || 1)}
                      className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                    <button
                      onClick={() => handleInputChange('requestedQuantity', Math.min(targetProduct.quantity, formData.requestedQuantity + 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">
                      من أصل {targetProduct.quantity}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Your Offer */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ما تريد تقديمه في المقابل؟
                  </h3>
                  <p className="text-gray-600">
                    اختر منتج من مختبرك أو قدم عرض مخصص
                  </p>
                </div>

                {/* Offer Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleInputChange('offerType', 'existing_product')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.offerType === 'existing_product'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <SparklesIcon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold">منتج من مختبري</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        اختر منتج متوفر للتبادل
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleInputChange('offerType', 'custom_offer')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.offerType === 'custom_offer'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold">عرض مخصص</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        صف منتج أو خدمة أخرى
                      </p>
                    </div>
                  </button>
                </div>

                {/* Existing Product Selection */}
                {formData.offerType === 'existing_product' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      اختر منتج من مختبرك
                    </label>
                    
                    {myProducts.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          لا توجد منتجات متاحة للتبادل في مختبرك
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                        {myProducts.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleInputChange('offeredProductId', product._id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              formData.offeredProductId === product._id
                                ? 'border-brand-blue bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={getImageUrl(product.images?.[0]?.url)}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 text-sm">
                                  {product.name}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">
                                  متوفر: {product.quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Offered Quantity */}
                    {selectedProduct && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الكمية المعروضة
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleInputChange('offeredQuantity', Math.max(1, formData.offeredQuantity - 1))}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct.quantity}
                            value={formData.offeredQuantity}
                            onChange={(e) => handleInputChange('offeredQuantity', parseInt(e.target.value) || 1)}
                            className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          />
                          <button
                            onClick={() => handleInputChange('offeredQuantity', Math.min(selectedProduct.quantity, formData.offeredQuantity + 1))}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-500">
                            من أصل {selectedProduct.quantity}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Offer Form */}
                {formData.offerType === 'custom_offer' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          اسم المنتج/الخدمة *
                        </label>
                        <input
                          type="text"
                          value={formData.customOffer.name}
                          onChange={(e) => handleCustomOfferChange('name', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          placeholder="أدخل اسم ما تريد تقديمه"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الحالة
                        </label>
                        <select
                          value={formData.customOffer.condition}
                          onChange={(e) => handleCustomOfferChange('condition', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        >
                          <option value="new">جديد</option>
                          <option value="like-new">مثل الجديد</option>
                          <option value="good">جيد</option>
                          <option value="fair">مقبول</option>
                          <option value="poor">ضعيف</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الوصف *
                      </label>
                      <textarea
                        value={formData.customOffer.description}
                        onChange={(e) => handleCustomOfferChange('description', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        placeholder="اوصف المنتج أو الخدمة بالتفصيل"
                      />
                    </div>

                    {/* Custom Offer Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الكمية المعروضة (للعرض المخصص)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCustomOfferChange('quantity', Math.max(1, (formData.customOffer.quantity || 1) - 1))}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={formData.customOffer.quantity}
                          onChange={(e) => handleCustomOfferChange('quantity', parseInt(e.target.value) || 1)}
                          className="w-24 text-center border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        />
                        <button
                          onClick={() => handleCustomOfferChange('quantity', (formData.customOffer.quantity || 1) + 1)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          العلامة التجارية
                        </label>
                        <input
                          type="text"
                          value={formData.customOffer.brand}
                          onChange={(e) => handleCustomOfferChange('brand', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الموديل
                        </label>
                        <input
                          type="text"
                          value={formData.customOffer.model}
                          onChange={(e) => handleCustomOfferChange('model', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          القيمة التقديرية (ريال)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.customOffer.estimatedValue}
                          onChange={(e) => handleCustomOfferChange('estimatedValue', parseInt(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Specifications */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          المواصفات
                        </label>
                        <button
                          type="button"
                          onClick={addSpecification}
                          className="text-sm text-brand-blue hover:text-brand-blueSecondary flex items-center"
                        >
                          <PlusIcon className="w-4 h-4 ml-1" />
                          إضافة مواصفة
                        </button>
                      </div>
                      
                      {formData.customOffer.specifications.map((spec, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="المواصفة"
                            value={spec.name}
                            onChange={(e) => updateSpecification(index, 'name', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="القيمة"
                            value={spec.value}
                            onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="الوحدة"
                            value={spec.unit}
                            onChange={(e) => updateSpecification(index, 'unit', e.target.value)}
                            className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecification(index)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Message & Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    مراجعة الطلب وإضافة رسالة
                  </h3>
                  <p className="text-gray-600">
                    راجع تفاصيل طلب التبادل وأضف رسالة اختيارية
                  </p>
                </div>

                {/* Exchange Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <ArrowsRightLeftIcon className="w-5 h-5 ml-2 text-brand-blue" />
                    ملخص التبادل
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* What you want */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <h5 className="font-medium text-gray-900 mb-3">ما تريده:</h5>
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(targetProduct.images?.[0]?.url)}
                          alt={targetProduct.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-sm">{targetProduct.name}</p>
                          <p className="text-xs text-gray-500">
                            الكمية: {formData.requestedQuantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* What you offer */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <h5 className="font-medium text-gray-900 mb-3">ما تقدمه:</h5>
                      {formData.offerType === 'existing_product' && selectedProduct ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(selectedProduct.images?.[0]?.url)}
                            alt={selectedProduct.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-sm">{selectedProduct.name}</p>
                            <p className="text-xs text-gray-500">
                              الكمية: {formData.offeredQuantity}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{formData.customOffer.name}</p>
                            <p className="text-xs text-gray-500">
                              عرض مخصص - {formData.customOffer.condition === 'new' ? 'جديد' : 
                                           formData.customOffer.condition === 'like-new' ? 'مثل الجديد' :
                                           formData.customOffer.condition === 'good' ? 'جيد' :
                                           formData.customOffer.condition === 'fair' ? 'مقبول' : 'ضعيف'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رسالة إضافية (اختيارية)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="أضف أي تفاصيل إضافية أو شروط خاصة لطلب التبادل..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/1000 حرف
                  </p>
                </div>

                {/* Important Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 ml-2 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-amber-800 mb-1">ملاحظة مهمة</h5>
                      <p className="text-sm text-amber-700">
                        سيتم إرسال طلب التبادل إلى المختبر المالك للمنتج. 
                        يمكنه قبول الطلب أو رفضه أو تقديم عرض مضاد. 
                        ستحصل على إشعار بالرد خلال 7 أيام.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  السابق
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                إلغاء
              </button>
              
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && formData.requestedQuantity < 1) ||
                    (step === 2 && formData.offerType === 'existing_product' && !formData.offeredProductId) ||
                    (step === 2 && formData.offerType === 'custom_offer' && (!formData.customOffer.name || !formData.customOffer.description))
                  }
                  className="px-6 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:opacity-95 transition-all disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 ml-2" />
                      إرسال الطلب
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExchangeRequestModal;
