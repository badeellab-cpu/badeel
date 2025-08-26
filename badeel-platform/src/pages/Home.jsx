import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import {
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  CubeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  BoltIcon,
  GlobeAltIcon,
  HeartIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { productsAPI, categoriesAPI } from '../config/api';
import ProductCard from '../components/products/ProductCard';
import CategoryCard from '../components/categories/CategoryCard';

const Home = () => {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.3, triggerOnce: true });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [trending, categories] = await Promise.all([
        productsAPI.getTrending(),
        categoriesAPI.getFeatured(),
      ]);
      setTrendingProducts(trending.data.data.products || []);
      setFeaturedCategories(categories.data.data.categories || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'آمن وموثوق',
      description: 'جميع المختبرات موثقة ومعتمدة من الجهات المختصة',
      color: 'from-primary-500 to-secondary-500',
      delay: 0,
    },
    {
      icon: BoltIcon,
      title: 'سرعة في التبادل',
      description: 'عمليات تبادل فورية وآمنة بين المختبرات',
      color: 'from-accent-500 to-primary-500',
      delay: 0.2,
    },
    {
      icon: CurrencyDollarIcon,
      title: 'توفير في التكاليف',
      description: 'وفر حتى 70% من تكاليف شراء الأجهزة الجديدة',
      color: 'from-secondary-500 to-primary-600',
      delay: 0.4,
    },
    {
      icon: GlobeAltIcon,
      title: 'شبكة واسعة',
      description: 'اتصل مع مختبرات في جميع أنحاء المملكة',
      color: 'from-primary-600 to-accent-500',
      delay: 0.6,
    },
  ];

  const stats = [
    { value: 500, suffix: '+', label: 'مختبر مسجل', icon: BeakerIcon },
    { value: 2500, suffix: '+', label: 'جهاز متاح', icon: CubeIcon },
    { value: 1200, suffix: '+', label: 'عملية تبادل', icon: ChartBarIcon },
    { value: 98, suffix: '%', label: 'رضا العملاء', icon: UserGroupIcon },
  ];

  const steps = [
    { 
      number: '01', 
      title: 'سجل مختبرك', 
      description: 'أنشئ حساب وأضف معلومات مختبرك',
      icon: '🏥'
    },
    { 
      number: '02', 
      title: 'أضف منتجاتك', 
      description: 'اعرض الأجهزة المتاحة للبيع أو التبادل',
      icon: '📋'
    },
    { 
      number: '03', 
      title: 'تصفح وتبادل', 
      description: 'ابحث عن الأجهزة التي تحتاجها وتبادل',
      icon: '🔄'
    },
    { 
      number: '04', 
      title: 'أتمم الصفقة', 
      description: 'أكمل عملية البيع أو التبادل بأمان',
      icon: '✅'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-secondary-50 overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-accent-400 to-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: 0.2,
              }}
              className="inline-block mb-8 relative"
            >
              <motion.div
                className="w-32 h-32 mx-auto bg-gradient-to-br from-brand-blue via-brand-blueSecondary to-brand-green rounded-3xl flex items-center justify-center shadow-2xl animate-glow"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 10,
                  boxShadow: "0 25px 50px -12px rgba(20, 184, 166, 0.5)" 
                }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <BeakerIcon className="w-16 h-16 text-white animate-pulse" />
              </motion.div>
              
              {/* Floating particles around logo */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: Math.cos(i * 0.785) * 80,
                    y: Math.sin(i * 0.785) * 80,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Title with crazy animation */}
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-6xl md:text-8xl font-black mb-6 relative"
            >
                              <motion.span 
                className="bg-gradient-to-r from-brand-blue via-brand-blueSecondary to-brand-green bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                بديل
              </motion.span>
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-primary-600/20 to-secondary-600/20 blur-2xl -z-10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative mb-8"
            >
              <h2 className="text-2xl md:text-4xl text-gray-700 mb-4 font-light">
                منصة التبادل الذكي للمختبرات الطبية
              </h2>
              <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
                <SparklesIcon className="w-6 h-6 text-brand-blue" />
                <span>ثورة في عالم تبادل الأجهزة الطبية</span>
                <SparklesIcon className="w-6 h-6 text-brand-green" />
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/register">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(20, 184, 166, 0.4), 0 10px 10px -5px rgba(20, 184, 166, 0.04)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-brand-blue via-brand-blueSecondary to-brand-blue text-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <RocketLaunchIcon className="w-6 h-6" />
                    ابدأ الآن مجاناً
                    <ArrowRightIcon className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-brand-blueSecondary via-brand-blue to-brand-blueSecondary"
                    initial={{ x: '100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  />
                </motion.button>
              </Link>
              
              <Link to="/products">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(20, 184, 166, 0.1)",
                    borderColor: "rgba(20, 184, 166, 0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border-2 border-brand-blue text-brand-blue rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
                >
                  <span className="flex items-center gap-3">
                    <CubeIcon className="w-6 h-6" />
                    استكشف المنتجات
                  </span>
                </motion.button>
              </Link>
            </motion.div>


          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-brand-blue via-brand-blueSecondary to-brand-green bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              لماذا منصة بديل؟
            </motion.h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              مميزات تجعلنا الرقم واحد في تبادل الأجهزة الطبية
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: feature.delay,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -10,
                  rotateY: 5,
                  scale: 1.05,
                }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-200/50 to-secondary-200/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <motion.div 
                  className="relative bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/50 h-full"
                  whileHover={{
                    boxShadow: "0 25px 50px -12px rgba(20, 184, 166, 0.25)"
                  }}
                >
                  <motion.div
                    className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 mx-auto animate-glow`}
                    whileHover={{ 
                      rotate: 360,
                      scale: 1.1 
                    }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-blueSecondary to-brand-green opacity-95" />
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Animated background patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              أرقام تتحدث عن النجاح
            </h2>
            <p className="text-xl text-white/80">إنجازاتنا المذهلة في أرقام</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  type: 'spring',
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.1,
                  y: -10
                }}
                className="text-center group"
              >
                <motion.div
                  className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <stat.icon className="w-10 h-10 text-white" />
                </motion.div>
                
                <div className="text-5xl md:text-6xl font-black text-white mb-2">
                  {statsInView && (
                    <>
                      <CountUp
                        start={0}
                        end={stat.value}
                        duration={2.5}
                        separator=","
                      />
                      {stat.suffix}
                    </>
                  )}
                </div>
                <div className="text-white/90 text-lg font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {featuredCategories.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent">
                الفئات المميزة
              </h2>
              <p className="text-xl text-gray-600">تصفح أهم فئات الأجهزة الطبية</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {featuredCategories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                >
                  <CategoryCard category={category} variant="compact" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent">
              كيف تعمل المنصة؟
            </h2>
            <p className="text-xl text-gray-600">أربع خطوات بسيطة نحو النجاح</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >

                
                <motion.div 
                  className="relative bg-white rounded-3xl p-8 text-center shadow-xl border border-primary-100 z-10"
                  whileHover={{
                    boxShadow: "0 25px 50px -12px rgba(20, 184, 166, 0.25)"
                  }}
                >
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                  >
                    {step.icon}
                  </motion.div>
                  
                  <div className="text-6xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-blueSecondary to-brand-green" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Animated background */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 bg-white/5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 relative z-10 text-center text-white"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block mb-8"
          >
            <RocketLaunchIcon className="w-24 h-24 text-white animate-bounce" />
          </motion.div>
          
          <h2 className="text-4xl md:text-7xl font-black mb-6">
            جاهز لتغيير اللعبة؟
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto">
            انضم إلى ثورة تبادل الأجهزة الطبية واكتشف عالماً جديداً من الفرص
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/register">
              <button className="px-12 py-6 bg-white text-brand-blue rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  <RocketLaunchIcon className="w-6 h-6 group-hover:animate-bounce" />
                  ابدأ رحلتك الآن
                  <ArrowRightIcon className="w-6 h-6 group-hover:-translate-x-3 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-brand-green/10"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;