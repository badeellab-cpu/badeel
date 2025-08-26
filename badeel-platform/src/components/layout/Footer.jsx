import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon as MailIcon,
  PhoneIcon,
  MapPinIcon as LocationMarkerIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import Logo from '../common/Logo';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp,
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: {
      title: 'المنصة',
      links: [
        { name: 'الرئيسية', path: '/' },
        { name: 'من نحن', path: '/about' },
        { name: 'كيف تعمل المنصة', path: '/how-it-works' },
        { name: 'الأسئلة الشائعة', path: '/faq' },
        { name: 'اتصل بنا', path: '/contact' },
      ],
    },
    services: {
      title: 'الخدمات',
      links: [
        { name: 'المنتجات', path: '/products' },
        { name: 'التبادل', path: '/exchange' },
        { name: 'المختبرات', path: '/labs' },
        { name: 'العروض الخاصة', path: '/offers' },
        { name: 'الدعم الفني', path: '/support' },
      ],
    },
    account: {
      title: 'حسابي',
      links: [
        { name: 'تسجيل الدخول', path: '/login' },
        { name: 'إنشاء حساب', path: '/register' },
        { name: 'لوحة التحكم', path: '/dashboard' },
        { name: 'المحفظة', path: '/wallet' },
        { name: 'المفضلة', path: '/favorites' },
      ],
    },
    legal: {
      title: 'قانوني',
      links: [
        { name: 'الشروط والأحكام', path: '/terms' },
        { name: 'سياسة الخصوصية', path: '/privacy' },
        { name: 'سياسة الاسترجاع', path: '/return-policy' },
        { name: 'حقوق الملكية', path: '/copyright' },
      ],
    },
  };

  const socialLinks = [
    { icon: FaFacebook, url: 'https://facebook.com', color: 'hover:text-brand-blue' },
    { icon: FaTwitter, url: 'https://twitter.com', color: 'hover:text-blue-400' },
    { icon: FaInstagram, url: 'https://instagram.com', color: 'hover:text-pink-600' },
    { icon: FaLinkedin, url: 'https://linkedin.com', color: 'hover:text-blue-700' },
    { icon: FaYoutube, url: 'https://youtube.com', color: 'hover:text-red-600' },
    { icon: FaWhatsapp, url: 'https://whatsapp.com', color: 'hover:text-green-600' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">اشترك في النشرة الإخبارية</h3>
              <p className="text-gray-400 mb-6">
                احصل على آخر العروض والمنتجات الجديدة مباشرة في بريدك الإلكتروني
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-brand-blue text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                                      className="px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-blueSecondary rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  اشترك الآن
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <Logo size="lg" animated={true} />
            </Link>
            <p className="text-gray-400 mb-4">
              منصة بديل - الحل الأمثل لتبادل وبيع الأجهزة الطبية بين المختبرات
            </p>
            <div className="flex space-x-3 space-x-reverse">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-gray-400 ${social.color} transition-colors`}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.values(footerLinks).map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <LocationMarkerIcon className="w-5 h-5 text-blue-500 ml-3" />
              <div>
                <p className="text-sm text-gray-400">العنوان</p>
                <p className="text-white">الرياض، المملكة العربية السعودية</p>
              </div>
            </div>
            <div className="flex items-center">
              <PhoneIcon className="w-5 h-5 text-blue-500 ml-3" />
              <div>
                <p className="text-sm text-gray-400">الهاتف</p>
                <p className="text-white" dir="ltr">+966 50 123 4567</p>
              </div>
            </div>
            <div className="flex items-center">
              <MailIcon className="w-5 h-5 text-blue-500 ml-3" />
              <div>
                <p className="text-sm text-gray-400">البريد الإلكتروني</p>
                <p className="text-white">info@badeel.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} منصة بديل. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center text-sm text-gray-400">
              <span>صنع بـ</span>
              <HeartIcon className="w-4 h-4 text-red-500 mx-1" />
              <span>في المملكة العربية السعودية</span>
            </div>
          </div>
        </div>
      </div>


    </footer>
  );
};

export default Footer;