import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  EnvelopeIcon as MailIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon as EyeOffIcon,
  ArrowRightOnRectangleIcon as LoginIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Logo from '../../components/common/Logo';
import { login, selectIsAuthenticated, selectAuth } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { loading, error } = useSelector(selectAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    try {
      const result = await dispatch(login(data)).unwrap();
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else if (result.user.role === 'lab') {
        navigate('/lab');
      } else {
        navigate(from);
      }
    } catch (err) {
      // Handle specific error cases for lab accounts
      const errorMessage = err || 'فشل تسجيل الدخول';
      
      if (errorMessage.includes('قيد المراجعة') || errorMessage.includes('تحت المراجعة')) {
        // Show pending account modal instead of toast
        setShowPendingModal(true);
      } else if (errorMessage.includes('رفض') || errorMessage.includes('rejected')) {
        // Show rejection reason if available
        toast.error(errorMessage, {
          duration: 6000, // Show longer for rejection messages
          style: {
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '500px',
          }
        });
      } else if (errorMessage.includes('تعليق') || errorMessage.includes('suspended')) {
        toast.error('تم تعليق حسابك. يرجى التواصل مع الإدارة للاستفسار');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="xl" animated={true} />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            مرحباً بعودتك
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            سجل الدخول للوصول إلى حسابك
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-6 shadow-xl rounded-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'البريد الإلكتروني غير صالح',
                    },
                  })}
                  type="email"
                  className={`block w-full pr-10 pl-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent`}
                  placeholder="example@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'كلمة المرور مطلوبة',
                    minLength: {
                      value: 6,
                      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`block w-full pr-10 pl-10 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-900">
                  تذكرني
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-brand-blue hover:text-brand-blueSecondary"
              >
                نسيت كلمة المرور؟
              </Link>
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
                  <LoginIcon className="h-5 w-5 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                ليس لديك حساب؟{' '}
                <Link
                  to="/register"
                  className="font-medium text-brand-blue hover:text-brand-blueSecondary"
                >
                  سجل الآن
                </Link>
              </span>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Pending Account Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
          >
            <div className="text-center">
              {/* Close button */}
              <button
                onClick={() => setShowPendingModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                حسابك تحت المراجعة
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>
                  ما زال حسابك قيد المراجعة من قبل فريق الإدارة.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 ml-1 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">
                      ستصلك رسالة على البريد الإلكتروني خلال يوم إلى يومين كحد أقصى لإعلامك بنتيجة المراجعة.
                    </span>
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  * إرسال رسائل البريد الإلكتروني معطل حالياً في وضع التطوير
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  فهمت
                </button>
                <Link
                  to="/register"
                  className="block w-full text-center text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => setShowPendingModal(false)}
                >
                  تسجيل حساب جديد بدلاً من ذلك
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;