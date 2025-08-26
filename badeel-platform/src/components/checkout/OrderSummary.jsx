import React from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  ShieldCheckIcon as ShieldCheckIconSolid,
  TruckIcon as TruckIconSolid
} from '@heroicons/react/24/solid';
import { getImageUrl } from '../../config/api';

const OrderSummary = ({ 
  cartItems, 
  cartItemsCount, 
  subtotal, 
  shippingFee, 
  discountAmount, 
  appliedCoupon, 
  finalTotal 
}) => {
  return (
    <div className="sticky top-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <DocumentTextIcon className="h-6 w-6 ml-3" />
            ملخص الطلب
          </h3>
          <p className="text-gray-300 mt-1">{cartItemsCount} منتج</p>
        </div>

        <div className="p-6">
          {/* Order Items Summary */}
          <div className="space-y-3 mb-6">
            {cartItems.slice(0, 3).map((item) => (
              <div key={item.product._id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={getImageUrl(item.product.images[0].url)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingCartIcon className="w-6 h-6 text-gray-400 m-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × {item.product.price.toLocaleString('ar-SA')} ريال
                  </p>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {(item.product.price * item.quantity).toLocaleString('ar-SA')} ريال
                </div>
              </div>
            ))}
            {cartItems.length > 3 && (
              <div className="text-center text-sm text-gray-500 py-2">
                و {cartItems.length - 3} منتج آخر...
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">المجموع الفرعي:</span>
              <span className="font-medium">{subtotal.toLocaleString('ar-SA')} ريال</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center">
                الشحن:
                {shippingFee === 0 && (
                  <span className="mr-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    مجاني
                  </span>
                )}
              </span>
              <span className="font-medium">
                {shippingFee === 0 ? 'مجاني' : `${shippingFee} ريال`}
              </span>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-green-600">
                <span className="flex items-center">
                  <TagIcon className="w-4 h-4 ml-1" />
                  خصم ({appliedCoupon.code}):
                </span>
                <span className="font-medium">
                  -{discountAmount.toLocaleString('ar-SA')} ريال
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>المجموع الكلي:</span>
                <span className="text-brand-blue">
                  {finalTotal.toLocaleString('ar-SA')} ريال
                </span>
              </div>
            </div>
          </div>

          {/* Free Shipping Progress */}
          {shippingFee > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2">
                <TruckIcon className="w-4 h-4 text-yellow-600 ml-2" />
                <span className="text-sm font-medium text-yellow-800">
                  أضف {(500 - subtotal).toLocaleString('ar-SA')} ريال للحصول على شحن مجاني!
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <ShieldCheckIconSolid className="w-5 h-5 text-green-600 ml-2" />
              <span className="text-xs text-green-800 font-medium">دفع آمن</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <TruckIconSolid className="w-5 h-5 text-blue-600 ml-2" />
              <span className="text-xs text-blue-800 font-medium">شحن سريع</span>
            </div>
          </div>

          {/* Special Offers */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center mb-2">
              <SparklesIcon className="w-5 h-5 text-purple-600 ml-2" />
              <span className="text-sm font-medium text-purple-800">عروض خاصة</span>
            </div>
            <ul className="space-y-1 text-xs text-purple-700">
              <li>• ضمان الاسترداد خلال 14 يوم</li>
              <li>• خدمة عملاء 24/7</li>
              <li>• تتبع الشحنة مجاناً</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSummary;
