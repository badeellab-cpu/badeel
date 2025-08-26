import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  EnvelopeIcon as MailIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon as EyeOffIcon,
  PhoneIcon,
  DocumentTextIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Logo from '../../components/common/Logo';
import { register as registerUser, selectIsAuthenticated, selectAuth } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { loading, error } = useSelector(selectAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationFile, setRegistrationFile] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add user data
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phone', data.phone);
      formData.append('role', 'lab');
      
      // Add lab data - use name as lab name
      formData.append('labName', data.name);
      formData.append('address', data.address);
      formData.append('postalCode', data.postalCode);
      formData.append('registrationNumber', data.registrationNumber);
      formData.append('licenseNumber', data.licenseNumber);
      
      // Add file (mandatory for public registration)
      if (registrationFile) {
        formData.append('registrationFile', registrationFile);
      } else {
        toast.error('يرجى إرفاق ملف التسجيل');
        return;
      }

      const result = await dispatch(registerUser(formData)).unwrap();
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form
      reset();
      setRegistrationFile(null);
      
    } catch (err) {
      toast.error(err || 'فشل التسجيل');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('يرجى اختيار ملف PDF أو صورة');
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
        e.target.value = '';
        return;
      }
      
      setRegistrationFile(file);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="xl" animated={true} />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            تسجيل مختبر جديد
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            انضم إلى منصة بديل للمعدات الطبية
          </p>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-6 shadow-xl rounded-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 ml-2 text-blue-600" />
                  المعلومات الأساسية
                </h4>
                
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المختبر *
                  </label>
                  <input
                    {...register('name', {
                      required: 'الاسم مطلوب',
                      minLength: {
                        value: 3,
                        message: 'الاسم يجب أن يكون 3 أحرف على الأقل',
                      },
                      maxLength: {
                        value: 100,
                        message: 'الاسم يجب أن يكون أقل من 100 حرف',
                      },
                    })}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أدخل الاسم"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني *
                  </label>
                  <input
                    {...register('email', {
                      required: 'البريد الإلكتروني مطلوب',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'البريد الإلكتروني غير صالح',
                      },
                    })}
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الجوال *
                  </label>
                  <input
                    {...register('phone', {
                      required: 'رقم الجوال مطلوب',
                      pattern: {
                        value: /^05\d{8}$/,
                        message: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام',
                      },
                    })}
                    type="tel"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="05xxxxxxxx"
                    maxLength="10"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان *
                  </label>
                  <textarea
                    {...register('address', {
                      required: 'العنوان مطلوب',
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows="3"
                    placeholder="العنوان الكامل"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                  )}
                </div>

                {/* Postal Code Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرمز البريدي *
                  </label>
                  <input
                    {...register('postalCode', {
                      required: 'الرمز البريدي مطلوب',
                      pattern: {
                        value: /^\d{5}$/,
                        message: 'الرمز البريدي يجب أن يتكون من 5 أرقام',
                      },
                    })}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345"
                    maxLength="5"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>

              {/* Legal & Security Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 ml-2 text-green-600" />
                  المعلومات القانونية والأمنية
                </h4>

                {/* Registration Number Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم التسجيل *
                  </label>
                  <input
                    {...register('registrationNumber', {
                      required: 'رقم التسجيل مطلوب',
                      pattern: {
                        value: /^\d{10}$/,
                        message: 'رقم التسجيل يجب أن يتكون من 10 أرقام',
                      },
                    })}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                    maxLength="10"
                  />
                  {errors.registrationNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>
                  )}
                </div>

                {/* License Number Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم ترخيص وزارة الصحة *
                  </label>
                  <input
                    {...register('licenseNumber', {
                      required: 'رقم ترخيص وزارة الصحة مطلوب',
                    })}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أدخل رقم ترخيص وزارة الصحة"
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.licenseNumber.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'كلمة المرور مطلوبة',
                        minLength: {
                          value: 8,
                          message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="كلمة مرور قوية"
                      minLength="8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'تأكيد كلمة المرور مطلوب',
                        validate: (value) =>
                          value === password || 'كلمة المرور وتأكيدها غير متطابقتين',
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="تأكيد كلمة المرور"
                      minLength="8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Registration File */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    إرفاق ملف التسجيل *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !registrationFile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    يُقبل ملفات PDF أو الصور (أقل من 5 ميجابايت)
                  </p>
                  {registrationFile && (
                    <div className="mt-2 flex items-center text-green-600">
                      <CheckCircleIcon className="h-4 w-4 ml-1" />
                      <span className="text-sm">{registrationFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-brand-blue to-brand-blueSecondary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 ml-2" />
                  إرسال طلب التسجيل
                </>
              )}
            </motion.button>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                لديك حساب بالفعل؟{' '}
                <Link
                  to="/login"
                  className="font-medium text-brand-blue hover:text-brand-blueSecondary"
                >
                  سجل الدخول
                </Link>
              </span>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                تم إرسال طلب التسجيل بنجاح!
              </h3>
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p className="flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 ml-1 text-yellow-500" />
                  حسابك الآن تحت المراجعة
                </p>
                <p>
                  ستصلك رسالة على البريد الإلكتروني خلال يوم إلى يومين كحد أقصى لإعلامك بنتيجة المراجعة.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 ml-1 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">
                      لا يمكنك تسجيل الدخول حتى يتم الموافقة على حسابك من قبل الإدارة.
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                متابعة إلى تسجيل الدخول
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Register;