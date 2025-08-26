import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingStorefrontIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { labsAPI, getImageUrl } from '../../config/api';
import toast from 'react-hot-toast';

const AdminLabs = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedLab, setSelectedLab] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    // User info
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Address
    address: '',
    postalCode: '',
    
    // Legal info
    registrationNumber: '',
    licenseNumber: '',
    
    // Files
    registrationFile: null,
    skipFiles: false
  });
  const [addFormErrors, setAddFormErrors] = useState({});
  const [addFormLoading, setAddFormLoading] = useState(false);

  // Fetch labs data
  const fetchLabs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const response = await labsAPI.getAll(params);
      
      if (response.data.success) {
        setLabs(response.data.data.labs);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
      toast.error('حدث خطأ في جلب بيانات المختبرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [currentPage, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchLabs();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Add lab handlers
  const handleAddLab = () => {
    setAddFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      postalCode: '',
      registrationNumber: '',
      licenseNumber: '',
      registrationFile: null,
      skipFiles: false
    });
    setAddFormErrors({});
    setShowAddModal(true);
  };

  const validateAddForm = () => {
    const errors = {};
    
    // Required fields
    if (!addFormData.name.trim()) errors.name = 'الاسم مطلوب';
    if (!addFormData.email.trim()) errors.email = 'البريد الإلكتروني مطلوب';
    if (!addFormData.phone.trim()) errors.phone = 'رقم الجوال مطلوب';
    if (!addFormData.password.trim()) errors.password = 'كلمة المرور مطلوبة';
    if (!addFormData.confirmPassword.trim()) errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    if (!addFormData.address.trim()) errors.address = 'العنوان مطلوب';
    if (!addFormData.postalCode.trim()) errors.postalCode = 'الرمز البريدي مطلوب';
    if (!addFormData.registrationNumber.trim()) errors.registrationNumber = 'رقم السجل التجاري مطلوب';
    if (!addFormData.licenseNumber.trim()) errors.licenseNumber = 'رقم ترخيص وزارة الصحة مطلوب';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (addFormData.email && !emailRegex.test(addFormData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    // Phone validation
    const phoneRegex = /^05\d{8}$/;
    if (addFormData.phone && !phoneRegex.test(addFormData.phone)) {
      errors.phone = 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    }
    
    // Postal code validation
    const postalCodeRegex = /^\d{5}$/;
    if (addFormData.postalCode && !postalCodeRegex.test(addFormData.postalCode)) {
      errors.postalCode = 'الرمز البريدي يجب أن يتكون من 5 أرقام';
    }
    
    // Registration number validation
    const regNumberRegex = /^\d{10}$/;
    if (addFormData.registrationNumber && !regNumberRegex.test(addFormData.registrationNumber)) {
      errors.registrationNumber = 'رقم السجل التجاري يجب أن يتكون من 10 أرقام';
    }
    
    // Password validation
    if (addFormData.password && addFormData.password.length < 8) {
      errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    
    // Confirm password validation
    if (addFormData.password !== addFormData.confirmPassword) {
      errors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقتين';
    }
    
    // File validation (only if not skipping)
    if (!addFormData.skipFiles) {
      if (!addFormData.registrationFile) errors.registrationFile = 'ملف السجل التجاري مطلوب';
    }
    
    return errors;
  };

  const handleAddFormSubmit = async () => {
    const errors = validateAddForm();
    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    try {
      setAddFormLoading(true);
      
      // Prepare form data for submission
      const formData = new FormData();
      
      // User data
      formData.append('name', addFormData.name);
      formData.append('email', addFormData.email);
      formData.append('phone', addFormData.phone);
      formData.append('password', addFormData.password);
      formData.append('role', 'lab');
      
      // Lab data - use name as lab name for simplicity
      formData.append('labName', addFormData.name);
      formData.append('address', addFormData.address);
      formData.append('postalCode', addFormData.postalCode);
      formData.append('registrationNumber', addFormData.registrationNumber);
      formData.append('licenseNumber', addFormData.licenseNumber);
      
      // Files (if not skipping)
      if (!addFormData.skipFiles && addFormData.registrationFile) {
        formData.append('registrationFile', addFormData.registrationFile);
      }
      
      // Mark as admin created and auto-approve
      formData.append('adminCreated', 'true');
      formData.append('autoApprove', 'true');

      const response = await labsAPI.create(formData);
      
      if (response.data.success) {
        toast.success('تم إنشاء المختبر بنجاح');
        setShowAddModal(false);
        fetchLabs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating lab:', error);
      const message = error.response?.data?.message || 'حدث خطأ في إنشاء المختبر';
      toast.error(message);
    } finally {
      setAddFormLoading(false);
    }
  };



  // Lab action handlers
  const handleLabAction = async (lab, type) => {
    setSelectedLab(lab);
    setActionType(type);
    setActionReason('');
    
    if (type === 'approve' || type === 'activate') {
      // For approve/activate, show confirmation modal without reason input
      setShowActionModal(true);
    } else {
      // For reject/suspend, show modal with reason input
      setShowActionModal(true);
    }
  };

  const executeLabAction = async () => {
    if (!selectedLab) return;
    
    if ((actionType === 'reject' || actionType === 'suspend') && !actionReason.trim()) {
      toast.error('يرجى إدخال سبب الإجراء');
      return;
    }

    try {
      setActionLoading(true);
      
      let response;
      switch (actionType) {
        case 'approve':
          response = await labsAPI.approve(selectedLab._id);
          break;
        case 'reject':
          response = await labsAPI.reject(selectedLab._id, { reason: actionReason });
          break;
        case 'suspend':
          response = await labsAPI.suspend(selectedLab._id, { reason: actionReason });
          break;
        case 'activate':
          response = await labsAPI.activate(selectedLab._id);
          break;
        default:
          throw new Error('نوع إجراء غير صحيح');
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setShowActionModal(false);
        setSelectedLab(null);
        setActionReason('');
        fetchLabs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error executing lab action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return CheckCircleIcon;
      case 'pending':
        return ClockIcon;
      case 'rejected':
        return XCircleIcon;
      case 'suspended':
        return PauseIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'مفعل';
      case 'pending':
        return 'تحت المراجعة';
      case 'rejected':
        return 'مرفوض';
      case 'suspended':
        return 'معلق';
      default:
        return 'غير محدد';
    }
  };

  // Get lab statistics for cards
  const getLabStats = () => {
    const stats = {
      total: labs.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      suspended: 0
    };

    labs.forEach(lab => {
      if (lab.user?.status) {
        stats[lab.user.status] = (stats[lab.user.status] || 0) + 1;
      }
    });

    return stats;
  };

  const labStats = getLabStats();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BuildingStorefrontIcon className="h-8 w-8 ml-3 text-blue-600" />
                إدارة المختبرات
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                إدارة طلبات التسجيل والمختبرات المسجلة
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setStatusFilter('pending')}
                className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <ClockIcon className="h-5 w-5 ml-2" />
                المراجعة ({labStats.pending})
              </button>
              <button 
                onClick={handleAddLab}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة مختبر
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في المختبرات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="approved">مفعل</option>
                <option value="pending">تحت المراجعة</option>
                <option value="rejected">مرفوض</option>
                <option value="suspended">معلق</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingStorefrontIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">إجمالي المختبرات</p>
              <p className="text-2xl font-bold text-gray-900">{labStats.total}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">مفعل</p>
              <p className="text-2xl font-bold text-gray-900">{labStats.approved}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">تحت المراجعة</p>
              <p className="text-2xl font-bold text-gray-900">{labStats.pending}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">مرفوض</p>
              <p className="text-2xl font-bold text-gray-900">{labStats.rejected}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <PauseIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">معلق</p>
              <p className="text-2xl font-bold text-gray-900">{labStats.suspended}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Labs Table */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">قائمة المختبرات</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المختبر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المالك
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم ترخيص الصحة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ المحفظة (ر.س)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : labs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    لا توجد مختبرات متاحة
                  </td>
                </tr>
              ) : (
                labs.map((lab) => {
                  const userStatus = lab.user?.status || 'pending';
                  const StatusIcon = getStatusIcon(userStatus);
                  return (
                    <motion.tr key={lab._id} variants={itemVariants} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BuildingStorefrontIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">{lab.labName}</div>
                            <div className="text-sm text-gray-500">{lab.user?.phone || 'غير محدد'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lab.user?.name || 'غير محدد'}</div>
                        <div className="text-sm text-gray-500">{lab.user?.email || 'غير محدد'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[220px] truncate" title={lab.address || ''}>
                        {lab.address || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lab.licenseNumber || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof lab.walletBalance === 'number' ? lab.walletBalance.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userStatus)}`}>
                          <StatusIcon className="h-4 w-4 ml-1" />
                          {getStatusText(userStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lab.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {setSelectedLab(lab); setShowDetailsModal(true);}}
                            className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                          <EyeIcon className="h-4 w-4 ml-1" />
                          عرض
                        </button>
                          
                          {userStatus === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleLabAction(lab, 'approve')}
                                className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <HandThumbUpIcon className="h-4 w-4 ml-1" />
                                موافقة
                              </button>
                              <button 
                                onClick={() => handleLabAction(lab, 'reject')}
                                className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <HandThumbDownIcon className="h-4 w-4 ml-1" />
                                رفض
                              </button>
                            </>
                          )}
                          
                          {userStatus === 'approved' && (
                            <button 
                              onClick={() => handleLabAction(lab, 'suspend')}
                              className="flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              <PauseIcon className="h-4 w-4 ml-1" />
                              تعليق
                            </button>
                          )}
                          
                          {(userStatus === 'suspended' || userStatus === 'rejected') && (
                            <button 
                              onClick={() => handleLabAction(lab, 'activate')}
                              className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <PlayIcon className="h-4 w-4 ml-1" />
                              تفعيل
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                عرض {((pagination.currentPage - 1) * pagination.limit) + 1} إلى {Math.min(pagination.currentPage * pagination.limit, pagination.total)} من {pagination.total} مختبر
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        pagination.currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Lab Details Modal */}
      {showDetailsModal && selectedLab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">تفاصيل المختبر</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    <BuildingStorefrontIcon className="h-5 w-5 ml-2 text-blue-600" />
                    المعلومات الأساسية
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">اسم المختبر</label>
                      <p className="text-sm text-gray-900">{selectedLab.labName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">رقم السجل التجاري</label>
                      <p className="text-sm text-gray-900">{selectedLab.registrationNumber || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">رقم الترخيص</label>
                      <p className="text-sm text-gray-900">{selectedLab.licenseNumber || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">الحالة</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLab.user?.status)}`}>
                        {getStatusText(selectedLab.user?.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    <UserIcon className="h-5 w-5 ml-2 text-green-600" />
                    معلومات المالك
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">الاسم</label>
                      <p className="text-sm text-gray-900">{selectedLab.user?.name || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                      <p className="text-sm text-gray-900">{selectedLab.user?.email || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">رقم الجوال</label>
                      <p className="text-sm text-gray-900">{selectedLab.user?.phone || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">تاريخ التسجيل</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedLab.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    <MapPinIcon className="h-5 w-5 ml-2 text-red-600" />
                    معلومات العنوان
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">العنوان</label>
                      <p className="text-sm text-gray-900">{selectedLab.address || 'غير محدد'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">الرمز البريدي</label>
                      <p className="text-sm text-gray-900">{selectedLab.postalCode || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 ml-2 text-purple-600" />
                    معلومات إضافية
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">التخصصات</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLab.specializations?.length > 0 ? (
                          selectedLab.specializations.map((spec, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {spec}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">غير محدد</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">الوصف</label>
                      <p className="text-sm text-gray-900">{selectedLab.description || 'غير محدد'}</p>
                    </div>

                    {/* License file (with graceful fallback to registrationFile) */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">ملف الترخيص</label>
                      {(selectedLab.licenseFile || selectedLab.registrationFile) ? (
                        <a
                          href={getImageUrl(selectedLab.licenseFile || selectedLab.registrationFile)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          عرض الملف
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">لا يوجد</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">التحقق</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLab.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedLab.isVerified ? 'محقق' : 'غير محقق'}
                      </span>
                    </div>

                    {/* removed duplicate file blocks */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedLab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'approve' && 'موافقة على المختبر'}
                  {actionType === 'reject' && 'رفض المختبر'}
                  {actionType === 'suspend' && 'تعليق المختبر'}
                  {actionType === 'activate' && 'تفعيل المختبر'}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  هل أنت متأكد من {' '}
                  {actionType === 'approve' && 'الموافقة على'}
                  {actionType === 'reject' && 'رفض'}
                  {actionType === 'suspend' && 'تعليق'}
                  {actionType === 'activate' && 'تفعيل'}
                  {' '} مختبر <strong>{selectedLab.labName}</strong>؟
                </p>
              </div>

              {(actionType === 'reject' || actionType === 'suspend') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سبب {actionType === 'reject' ? 'الرفض' : 'التعليق'} (مطلوب)
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder={`أدخل سبب ${actionType === 'reject' ? 'الرفض' : 'التعليق'}...`}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={executeLabAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    actionType === 'approve' || actionType === 'activate'
                      ? 'bg-green-600 hover:bg-green-700'
                      : actionType === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading ? 'جاري المعالجة...' : 'تأكيد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">إضافة مختبر جديد</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleAddFormSubmit(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 flex items-center">
                      <UserIcon className="h-5 w-5 ml-2 text-blue-600" />
                      المعلومات الأساسية
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الاسم *
                      </label>
                      <input
                        type="text"
                        value={addFormData.name}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="أدخل الاسم"
                      />
                      {addFormErrors.name && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        البريد الإلكتروني *
                      </label>
                      <input
                        type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="email@example.com"
                      />
                      {addFormErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        رقم الجوال *
                      </label>
                      <input
                        type="tel"
                        value={addFormData.phone}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="05xxxxxxxx"
                        maxLength="10"
                      />
                      {addFormErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        العنوان *
                      </label>
                      <textarea
                        value={addFormData.address}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, address: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows="3"
                        placeholder="العنوان الكامل"
                      />
                      {addFormErrors.address && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.address}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الرمز البريدي *
                      </label>
                      <input
                        type="text"
                        value={addFormData.postalCode}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12345"
                        maxLength="5"
                      />
                      {addFormErrors.postalCode && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.postalCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Legal & Security Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 ml-2 text-green-600" />
                      المعلومات القانونية والأمنية
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        رقم التسجيل *
                      </label>
                      <input
                        type="text"
                        value={addFormData.registrationNumber}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.registrationNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234567890"
                        maxLength="10"
                      />
                      {addFormErrors.registrationNumber && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.registrationNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        رقم ترخيص وزارة الصحة *
                      </label>
                      <input
                        type="text"
                        value={addFormData.licenseNumber}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="أدخل رقم ترخيص وزارة الصحة"
                      />
                      {addFormErrors.licenseNumber && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.licenseNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        كلمة المرور *
                      </label>
                      <input
                        type="password"
                        value={addFormData.password}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="كلمة مرور قوية"
                        minLength="8"
                      />
                      {addFormErrors.password && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تأكيد كلمة المرور *
                      </label>
                      <input
                        type="password"
                        value={addFormData.confirmPassword}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="تأكيد كلمة المرور"
                        minLength="8"
                      />
                      {addFormErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{addFormErrors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Skip Files Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="skipFiles"
                        checked={addFormData.skipFiles}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, skipFiles: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="skipFiles" className="mr-2 text-sm text-gray-700">
                        تخطي رفع ملف التسجيل (امتياز الإدارة)
                      </label>
                    </div>

                    {!addFormData.skipFiles && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          إرفاق ملف التسجيل *
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setAddFormData(prev => ({ ...prev, registrationFile: e.target.files[0] }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            addFormErrors.registrationFile ? 'border-red-500' : 'border-gray-300'
                          }`}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        {addFormErrors.registrationFile && (
                          <p className="text-red-500 text-xs mt-1">{addFormErrors.registrationFile}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={addFormLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addFormLoading ? 'جاري الإنشاء...' : 'إنشاء المختبر'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLabs;