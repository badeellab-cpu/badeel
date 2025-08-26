import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  CubeIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { labsAPI, productsAPI, ordersAPI, exchangesAPI, getImageUrl } from '../../config/api';
import LoadingScreen from '../../components/common/LoadingScreen';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const LabDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
    fetchMyProducts();
    fetchMyOrders();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await labsAPI.getMyDashboard();

      // البيانات في response.data.data بسبب هيكل API response
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const response = await productsAPI.getMyProducts({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' });
      setMyProducts(response.data.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      // Use the same logic as Orders page to get all orders and exchanges
      const [myOrders, asSellerOrders, myExchangeRequests, exchangesOnMyProducts] = await Promise.all([
        ordersAPI.getMyOrders(),
        ordersAPI.getAsSeller(),
        exchangesAPI.getMyRequests(),
        exchangesAPI.getOnMyProducts()
      ]);
      
      const buyerOrders = (myOrders.data?.data?.orders || myOrders.data?.orders || []).map(order => ({
        ...order,
        role: 'buyer',
        type: 'order',
        orderNumber: order.orderNumber
      }));
      
      const sellerOrders = (asSellerOrders.data?.data?.orders || asSellerOrders.data?.orders || []).map(order => ({
        ...order,
        role: 'seller',
        type: 'order',
        orderNumber: order.orderNumber
      }));

      const requesterExchanges = (myExchangeRequests.data?.data?.exchanges || myExchangeRequests.data?.exchanges || []).map(exchange => ({
        ...exchange,
        role: 'requester',
        type: 'exchange',
        orderNumber: exchange.exchangeNumber,
        createdAt: exchange.createdAt
      }));
      
      const receiverExchanges = (exchangesOnMyProducts.data?.data?.exchanges || exchangesOnMyProducts.data?.exchanges || []).map(exchange => ({
        ...exchange,
        role: 'receiver',
        type: 'exchange',
        orderNumber: exchange.exchangeNumber,
        createdAt: exchange.createdAt
      }));

      // Combine all orders and sort by date
      const allOrders = [...buyerOrders, ...sellerOrders, ...requesterExchanges, ...receiverExchanges]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setMyOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const { overview, periodStats, breakdown, recentActivities } = dashboardData || {};

  // Animation variants
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

  // Stat cards data based on real data
  const statCards = [
    {
      id: 1,
      title: 'مبلغ المحفظة',
      value: `${(overview?.walletBalance || 0).toLocaleString()}.00`,
      icon: BanknotesIcon,
      color: 'blue',
      bgGradient: 'from-brand-blue to-brand-blueSecondary',
      bgIcon: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      title: 'إجمالي طلبات القبول',
      value: overview?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'green',
      bgGradient: 'from-brand-green to-green-600',
      bgIcon: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 3,
      title: 'إجمالي طلبات التبادل',
      value: overview?.totalExchangeRequests || 0,
      icon: ArrowPathIcon,
      color: 'amber',
      bgGradient: 'from-amber-500 to-amber-600',
      bgIcon: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      id: 4,
      title: 'إجمالي منتجات المتجر',
      value: overview?.totalProducts || 0,
      icon: CubeIcon,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      bgIcon: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  // Chart data for orders status (real data)
  const ordersStatusData = {
    labels: ['في الانتظار', 'قيد المعالجة', 'مكتمل', 'ملغي'],
    datasets: [
      {
        data: [
          breakdown?.ordersByStatus?.pending || 0,
          breakdown?.ordersByStatus?.processing || 0,
          breakdown?.ordersByStatus?.completed || 0,
          breakdown?.ordersByStatus?.cancelled || 0
        ],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)', // Yellow for pending
          'rgba(59, 130, 246, 0.8)', // Blue for processing
          'rgba(34, 197, 94, 0.8)', // Green for completed
          'rgba(239, 68, 68, 0.8)'  // Red for cancelled
        ],
        borderColor: [
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Chart data for products by type (real data)
  const productsTypeData = {
    labels: ['للبيع', 'للتبادل', 'أصول'],
    datasets: [
      {
        data: [
          breakdown?.productsByType?.sale || 0,
          breakdown?.productsByType?.exchange || 0,
          breakdown?.productsByType?.asset || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for sale
          'rgba(59, 130, 246, 0.8)', // Blue for exchange
          'rgba(168, 85, 247, 0.8)'  // Purple for assets
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Cairo, sans-serif',
            size: 12
          },
          padding: 20
        }
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
                <ChartBarIcon className="h-8 w-8 ml-3 text-blue-600" />
                لوحة التحكم
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                نظرة عامة على نشاط المختبر والإحصائيات
              </p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="quarter">هذا الربع</option>
                <option value="year">هذا العام</option>
              </select>
              <button
                onClick={() => {
                  fetchDashboardData();
                  fetchMyProducts();
                  fetchMyOrders();
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <ArrowPathIcon className="h-4 w-4 ml-2" />
                تحديث
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Stat Cards */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card) => (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${card.bgIcon}`}>
                        <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Orders Status Chart */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">حالات الطلبات</h3>
              <div className="h-80">
                <Doughnut data={ordersStatusData} options={doughnutOptions} />
              </div>
            </motion.div>

            {/* Products Type Chart */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">أنواع المنتجات</h3>
              <div className="h-80">
                <Doughnut data={productsTypeData} options={doughnutOptions} />
              </div>
            </motion.div>
          </div>

          {/* My Products Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CubeIcon className="h-6 w-6 ml-2 text-brand-blue" />
                منتجاتي
              </h3>
              <a 
                href="/lab/products" 
                className="text-brand-blue hover:text-blue-700 text-sm font-medium flex items-center"
              >
                عرض الكل
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProducts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">لا توجد منتجات حتى الآن</p>
                  <a 
                    href="/lab/products" 
                    className="mt-2 inline-block text-brand-blue hover:text-blue-700 text-sm font-medium"
                  >
                    إضافة منتج جديد
                  </a>
                </div>
              ) : (
                myProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start space-x-3 space-x-reverse">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CubeIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.type === 'sale' ? 'bg-green-100 text-green-700' :
                            product.type === 'exchange' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {product.type === 'sale' ? 'للبيع' :
                             product.type === 'exchange' ? 'للتبادل' : 'أصول'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'active' ? 'bg-green-100 text-green-700' :
                            product.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {product.status === 'active' ? 'نشط' :
                             product.status === 'inactive' ? 'غير نشط' : 'محذوف'}
                          </span>
                        </div>
                        {product.type === 'sale' && (
                          <p className="text-xs text-brand-blue font-medium mt-1">
                            {product.price?.toLocaleString()} ريال
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          الكمية: {product.quantity || 0}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Sales, Purchases & Exchanges */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">النشاطات التجارية الأخيرة</h3>
              <a 
                href="/lab/orders" 
                className="text-brand-blue hover:text-blue-700 text-sm font-medium flex items-center"
              >
                عرض جميع الطلبات
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              </a>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Sales */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                  <BanknotesIcon className="h-5 w-5 ml-2 text-green-600" />
                  آخر المبيعات
                </h4>
                <div className="space-y-3">
                  {myOrders.filter(order => order.role === 'seller' && order.type === 'order').length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BanknotesIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">لا توجد مبيعات حتى الآن</p>
                    </div>
                  ) : (
                    myOrders.filter(order => order.role === 'seller' && order.type === 'order').slice(0, 3).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                          <p className="text-xs text-green-600 font-medium">{order.totalAmount?.toLocaleString()} ريال</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-500 text-white' :
                          order.status === 'delivered' ? 'bg-emerald-500 text-white' :
                          order.status === 'shipped' ? 'bg-blue-500 text-white' :
                          order.status === 'confirmed' ? 'bg-indigo-500 text-white' :
                          order.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' :
                           order.status === 'delivered' ? 'تم التسليم' :
                           order.status === 'shipped' ? 'تم الشحن' :
                           order.status === 'confirmed' ? 'مؤكد' :
                           order.status === 'pending' ? 'بانتظار' : order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Purchases */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                  <ShoppingBagIcon className="h-5 w-5 ml-2 text-blue-600" />
                  آخر المشتريات
                </h4>
                <div className="space-y-3">
                  {myOrders.filter(order => order.role === 'buyer' && order.type === 'order').length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <ShoppingBagIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">لا توجد مشتريات حتى الآن</p>
                    </div>
                  ) : (
                    myOrders.filter(order => order.role === 'buyer' && order.type === 'order').slice(0, 3).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                          <p className="text-xs text-blue-600 font-medium">{order.totalAmount?.toLocaleString()} ريال</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-500 text-white' :
                          order.status === 'delivered' ? 'bg-emerald-500 text-white' :
                          order.status === 'shipped' ? 'bg-blue-500 text-white' :
                          order.status === 'confirmed' ? 'bg-indigo-500 text-white' :
                          order.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' :
                           order.status === 'delivered' ? 'تم التسليم' :
                           order.status === 'shipped' ? 'تم الشحن' :
                           order.status === 'confirmed' ? 'مؤكد' :
                           order.status === 'pending' ? 'بانتظار' : order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Exchanges */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                  <ArrowPathIcon className="h-5 w-5 ml-2 text-purple-600" />
                  آخر التبادلات
                </h4>
                <div className="space-y-3">
                  {myOrders.filter(order => order.type === 'exchange').length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <ArrowPathIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">لا توجد تبادلات حتى الآن</p>
                    </div>
                  ) : (
                    myOrders.filter(order => order.type === 'exchange').slice(0, 3).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                          <p className="text-xs text-purple-600 font-medium">
                            {order.role === 'requester' ? 'طالب' : 'مستقبل'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-500 text-white' :
                          order.status === 'in_progress' ? 'bg-blue-500 text-white' :
                          order.status === 'confirmed' ? 'bg-indigo-500 text-white' :
                          order.status === 'accepted' ? 'bg-emerald-500 text-white' :
                          order.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' :
                           order.status === 'in_progress' ? 'جاري التنفيذ' :
                           order.status === 'confirmed' ? 'مؤكد' :
                           order.status === 'accepted' ? 'مقبول' :
                           order.status === 'pending' ? 'بانتظار' : order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LabDashboard;
