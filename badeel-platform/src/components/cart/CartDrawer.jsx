import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon as XIcon, 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { 
  selectCartItems, 
  selectCartTotal, 
  removeFromCart, 
  updateQuantity, 
  clearCart 
} from '../../store/slices/cartSlice';
import { setCartDrawerOpen } from '../../store/slices/uiSlice';
import { getImageUrl } from '../../config/api';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector(state => state.ui.cartDrawerOpen);
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);

  const handleClose = () => {
    dispatch(setCartDrawerOpen(false));
  };

  const handleCheckout = () => {
    handleClose();
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-brand-blueSecondary to-primary-600 z-0 pointer-events-none"></div>
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:24px_24px] z-0 pointer-events-none"></div>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl z-0 pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl z-0 pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between p-6 min-h-[72px]">
                <div className="flex items-center">
                  <ShoppingCartIcon className="w-6 h-6 text-white ml-2" />
                  <h2 className="text-xl font-bold text-white">سلة التسوق</h2>
                  {cartItems.length > 0 && (
                    <span className="mr-2 px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                      {cartItems.length} منتج
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                    aria-label="إغلاق السلة"
                    title="إغلاق"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-4 left-0 right-0 h-6 bg-white rounded-t-2xl z-0 pointer-events-none"></div>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <ShoppingCartIcon className="w-24 h-24 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-4">السلة فارغة</p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    تسوق الآن
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.product._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link
                          to={`/products/${item.product.slug || item.product._id}`}
                          onClick={handleClose}
                          className="flex-shrink-0"
                        >
                          <img
                            src={getImageUrl(item.product.images?.[0]) || getImageUrl(item.product.images?.[0]?.url) || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </Link>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <Link
                            to={`/products/${item.product.slug || item.product._id}`}
                            onClick={handleClose}
                            className="font-semibold text-gray-900 hover:text-brand-blue transition-colors line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPrice(item.product.price)}
                          </p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center mt-3">
                            <button
                              onClick={() => dispatch(updateQuantity({ 
                                productId: item.product._id, 
                                quantity: Math.max(1, item.quantity - 1) 
                              }))}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className="mx-3 font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => dispatch(updateQuantity({ 
                                productId: item.product._id, 
                                quantity: item.quantity + 1 
                              }))}
                              disabled={item.quantity >= item.product.quantity}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => dispatch(removeFromCart(item.product._id))}
                              className="mr-auto p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subtotal */}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                        <span className="text-sm text-gray-600">المجموع الفرعي</span>
                        <span className="font-semibold">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Clear Cart Button */}
                  <button
                    onClick={() => dispatch(clearCart())}
                    className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    تفريغ السلة
                  </button>
                </div>
              )}
            </div>
            
            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t p-6 bg-white">
                {/* Total */}
                <div className="flex justify-between mb-4">
                  <span className="text-lg font-semibold">المجموع الكلي</span>
                  <span className="text-2xl font-bold text-brand-blue">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                
                {/* Actions */}
                <div>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-blueSecondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    إتمام الطلب
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;