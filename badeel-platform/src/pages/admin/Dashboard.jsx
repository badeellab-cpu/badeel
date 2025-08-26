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
  UsersIcon,
  BuildingStorefrontIcon,
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
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../config/api';
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

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard(selectedPeriod);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const { overview, periodStats, breakdown, topCategories, recentActivities } = dashboardData || {};

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

  // Stat cards data
  const statCards = [
    {
      id: 1,
      title: 'إجمالي المختبرات',
      value: overview?.totalLabs || 0,
      change: periodStats?.newLabs || 0,
      changeType: 'increase',
      icon: BuildingStorefrontIcon,
      color: 'blue',
      bgGradient: 'from-brand-blue to-brand-blueSecondary'
    },
    {
      id: 2,
      title: 'إجمالي المنتجات',
      value: overview?.totalProducts || 0,
      change: periodStats?.newProducts || 0,
      changeType: 'increase',
      icon: CubeIcon,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      title: 'إجمالي الطلبات',
      value: overview?.totalOrders || 0,
      change: periodStats?.newOrders || 0,
      changeType: 'increase',
      icon: ShoppingBagIcon,
      color: 'purple',
      bgGradient: 'from-brand-blue to-brand-blueSecondary'
    },
    {
      id: 4,
      title: 'إجمالي التبادلات',
      value: overview?.totalExchanges || 0,
      change: periodStats?.newExchanges || 0,
      changeType: 'increase',
      icon: ArrowPathIcon,
      color: 'indigo',
      bgGradient: 'from-brand-blue to-brand-blueSecondary'
    },
    {
      id: 5,
      title: 'إجمالي الإيرادات',
      value: `${(overview?.totalRevenue || 0).toLocaleString()} ريال`,
      change: `${(periodStats?.periodRevenue || 0).toLocaleString()} ريال`,
      changeType: 'increase',
      icon: BanknotesIcon,
      color: 'amber',
      bgGradient: 'from-amber-500 to-amber-600'
    },
    {
      id: 6,
      title: 'رصيد المحافظ',
      value: `${(overview?.totalWalletBalance || 0).toLocaleString()} ريال`,
      change: null,
      changeType: null,
      icon: BanknotesIcon,
      color: 'emerald',
      bgGradient: 'from-emerald-500 to-emerald-600'
    }
  ];

  // Alert cards data
  const alertCards = [
    {
      id: 1,
      title: 'مختبرات بانتظار الموافقة',
      value: periodStats?.pendingLabs || 0,
      icon: ClockIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-600'
    },
    {
      id: 2,
      title: 'منتجات بانتظار الموافقة',
      value: periodStats?.pendingProducts || 0,
      icon: ExclamationTriangleIcon,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600'
    }
  ];

  // Chart data
  const userActivityData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
      {
        label: 'مستخدمين جدد',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const revenueData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
      {
        label: 'الإيرادات (ريال)',
        data: [15000, 23000, 18000, 32000, 28000, 45000],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const labStatusData = {
    labels: ['موافق عليها', 'بانتظار الموافقة', 'مرفوضة', 'معلقة'],
    datasets: [
      {
        data: [
          breakdown?.labsByStatus?.approved || 0,
          breakdown?.labsByStatus?.pending || 0,
          breakdown?.labsByStatus?.rejected || 0,
          breakdown?.labsByStatus?.suspended || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(156, 163, 175)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      },
      x: {
        ticks: {
          font: {
            family: 'Cairo, sans-serif'
          }
        }
      }
    }
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
                لوحة تحكم الإدارة
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                نظرة عامة على نشاط المنصة والإحصائيات
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
                onClick={fetchDashboardData}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">الإحصائيات العامة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card) => (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.bgGradient} opacity-5`}></div>
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
                        {card.change !== null && (
                          <div className="flex items-center text-sm">
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 ml-1" />
                            <span className="text-green-600 font-medium">+{card.change}</span>
                            <span className="text-gray-500 mr-1">في الفترة الحالية</span>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${card.bgGradient}`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Alert Cards */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">تنبيهات تحتاج إلى اهتمام</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alertCards.map((card) => (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.02 }}
                  className={`${card.bgColor} rounded-2xl p-6 border-l-4 border-${card.color}-400 shadow-sm`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${card.bgColor} ${card.iconColor}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div className="mr-4">
                      <p className={`text-sm font-medium ${card.textColor}`}>{card.title}</p>
                      <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Activity Chart */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">نشاط المستخدمين</h3>
              <div className="h-80">
                <Line data={userActivityData} options={chartOptions} />
              </div>
            </motion.div>

            {/* Revenue Chart */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات الشهرية</h3>
              <div className="h-80">
                <Bar data={revenueData} options={chartOptions} />
              </div>
            </motion.div>
          </div>

          {/* Lab Status and Top Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lab Status Distribution */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع حالة المختبرات</h3>
              <div className="h-80">
                <Doughnut data={labStatusData} options={doughnutOptions} />
              </div>
            </motion.div>

            {/* Top Categories */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الفئات الأكثر نشاطاً</h3>
              <div className="space-y-4">
                {(topCategories || []).slice(0, 5).map((category, index) => (
                  <div key={category._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ml-3 ${
                        index === 0 ? 'bg-gold' : 
                        index === 1 ? 'bg-silver' : 
                        index === 2 ? 'bg-bronze' : 'bg-gray-400'
                      }`}></div>
                      <span className="font-medium text-gray-900">{typeof category.name === 'object' ? (category.name.ar || category.name.en || 'غير مصنف') : category.name}</span>
                    </div>
                    <span className="text-blue-600 font-semibold">{category.count} منتج</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activities */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">النشاطات الأخيرة</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                  <ShoppingBagIcon className="h-5 w-5 ml-2 text-purple-600" />
                  آخر الطلبات
                </h4>
                <div className="space-y-3">
                  {(recentActivities?.orders || []).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-primary-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Exchanges */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                  <ArrowPathIcon className="h-5 w-5 ml-2 text-indigo-600" />
                  آخر التبادلات
                </h4>
                <div className="space-y-3">
                  {(recentActivities?.exchanges || []).map((exchange) => (
                    <div key={exchange._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{exchange.exchangeNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(exchange.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exchange.status === 'completed' ? 'bg-green-100 text-green-800' :
                        exchange.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {exchange.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Labs */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
                  <BuildingStorefrontIcon className="h-5 w-5 ml-2 text-blue-600" />
                  آخر المختبرات المسجلة
                </h4>
                <div className="space-y-3">
                  {(recentActivities?.labs || []).map((lab) => (
                    <div key={lab._id} className="flex items-center justify-between p-3 rounded-lg bg-primary-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lab.labName}</p>
                        <p className="text-xs text-gray-500">{new Date(lab.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lab.user?.status === 'approved' ? 'bg-green-100 text-green-800' :
                        lab.user?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lab.user?.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;