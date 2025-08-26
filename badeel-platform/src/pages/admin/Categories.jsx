import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TagIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { categoriesAPI } from '../../config/api';
import toast from 'react-hot-toast';
import LoadingScreen from '../../components/common/LoadingScreen';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, left: 0 });
  const [formData, setFormData] = useState({
    name: { ar: '', en: '' },
    description: { ar: '', en: '' },
    parent: '',
    order: 0,
    isActive: true,
    isFeatured: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Fetch categories data
  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Build params without including undefined keys
      const params = {
        page: currentPage,
        limit: 10,
        sortBy: 'order',
        sortOrder: 'asc'
      };
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      const response = await categoriesAPI.getAll(params);
      
      if (response.data.success) {
        setCategories(response.data.data.categories);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('حدث خطأ في جلب بيانات الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchCategories();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle actions
  const handleView = (category) => {
    setSelectedCategory(category);
    setShowDetailsModal(true);
    setActionMenuOpen(null);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      parent: category.parent?._id || '',
      order: category.order || 0,
      isActive: category.isActive,
      isFeatured: category.isFeatured || false
    });
    setShowEditModal(true);
    setActionMenuOpen(null);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
    setActionMenuOpen(null);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await categoriesAPI.delete(selectedCategory._id);
      toast.success('تم حذف الفئة بنجاح');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ في حذف الفئة');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);

    try {
      if (showEditModal) {
        await categoriesAPI.update(selectedCategory._id, formData);
        toast.success('تم تحديث الفئة بنجاح');
        setShowEditModal(false);
      } else {
        await categoriesAPI.create(formData);
        toast.success('تم إنشاء الفئة بنجاح');
        setShowAddModal(false);
      }
      
      setSelectedCategory(null);
      fetchCategories();
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || 'حدث خطأ في حفظ الفئة');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: { ar: '', en: '' },
      description: { ar: '', en: '' },
      parent: '',
      order: 0,
      isActive: true,
      isFeatured: false
    });
    setFormErrors({});
  };

  const handleToggleStatus = async (category) => {
    try {
      await categoriesAPI.toggleStatus(category._id);
      toast.success(`تم ${category.isActive ? 'إلغاء تفعيل' : 'تفعيل'} الفئة بنجاح`);
      fetchCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('حدث خطأ في تغيير حالة الفئة');
    }
  };

  if (loading && categories.length === 0) {
    return <LoadingScreen />;
  }

  const toggleActionMenu = (event, id) => {
    if (actionMenuOpen === id) {
      setActionMenuOpen(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 192; // w-48
    const left = rect.left + window.scrollX - (menuWidth - rect.width);
    const top = rect.bottom + window.scrollY + 8;
    setActionMenuPos({ top, left });
    setActionMenuOpen(id);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <TagIcon className="h-8 w-8 ml-3 text-blue-600" />
                إدارة الفئات
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                إدارة فئات المنتجات والخدمات
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة فئة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في الفئات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">مفعلة</option>
                <option value="inactive">غير مفعلة</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم بالعربية
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم بالإنجليزية
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    لا توجد فئات
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <motion.tr
                    key={category._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name?.ar || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {category.name?.en || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {category.description?.ar || 'لا يوجد وصف'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {category.isActive ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 ml-1" />
                            مفعلة
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 ml-1" />
                            غير مفعلة
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => toggleActionMenu(e, category._id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      <AnimatePresence>
                        {actionMenuOpen === category._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ top: actionMenuPos.top, left: actionMenuPos.left, position: 'fixed' }}
                            className="w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                          >
                            <button
                              onClick={() => handleView(category)}
                              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <EyeIcon className="h-4 w-4 ml-2" />
                              عرض
                            </button>
                            <button
                              onClick={() => handleEdit(category)}
                              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <PencilIcon className="h-4 w-4 ml-2" />
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4 ml-2" />
                              حذف
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                عرض {((currentPage - 1) * pagination.limit) + 1} إلى{' '}
                {Math.min(currentPage * pagination.limit, pagination.total)} من{' '}
                {pagination.total} فئة
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  السابق
                </button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} من {pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                  disabled={currentPage === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">تفاصيل الفئة</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم بالعربية
                    </label>
                    <p className="text-sm text-gray-900">{selectedCategory.name?.ar || 'غير محدد'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم بالإنجليزية
                    </label>
                    <p className="text-sm text-gray-900">{selectedCategory.name?.en || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوصف بالعربية
                    </label>
                    <p className="text-sm text-gray-900">{selectedCategory.description?.ar || 'لا يوجد وصف'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوصف بالإنجليزية
                    </label>
                    <p className="text-sm text-gray-900">{selectedCategory.description?.en || 'No description'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCategory.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCategory.isActive ? 'مفعلة' : 'غير مفعلة'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showEditModal ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الاسم بالعربية *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name.ar}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          name: { ...prev.name, ar: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="اسم الفئة بالعربية"
                      />
                      {formErrors['name.ar'] && (
                        <p className="text-red-500 text-xs mt-1">{formErrors['name.ar']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الاسم بالإنجليزية *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name.en}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          name: { ...prev.name, en: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Category name in English"
                      />
                      {formErrors['name.en'] && (
                        <p className="text-red-500 text-xs mt-1">{formErrors['name.en']}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الوصف بالعربية
                      </label>
                      <textarea
                        value={formData.description.ar}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          description: { ...prev.description, ar: e.target.value }
                        }))}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="وصف الفئة بالعربية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الوصف بالإنجليزية
                      </label>
                      <textarea
                        value={formData.description.en}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          description: { ...prev.description, en: e.target.value }
                        }))}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Category description in English"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الترتيب
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center space-x-4 space-x-reverse">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">مفعلة</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">مميزة</span>
                    </label>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {formLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    )}
                    {showEditModal ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 ml-2" />
                  <h3 className="text-lg font-semibold text-gray-900">تأكيد الحذف</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  هل أنت متأكد من حذف الفئة "{selectedCategory.name?.ar}"؟ 
                  هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {deleteLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    )}
                    حذف
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
};

export default AdminCategories;