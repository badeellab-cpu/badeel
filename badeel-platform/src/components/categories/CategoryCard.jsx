import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../config/api';
import { CubeIcon } from '@heroicons/react/24/outline';

const CategoryCard = ({ category, variant = 'default' }) => {
  const [imageError, setImageError] = React.useState(false);

  if (variant === 'compact') {
    return (
      <Link to={`/products?category=${category._id}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 mb-3 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
            {category.icon ? (
              <img
                src={getImageUrl(category.icon)}
                alt={category.name}
                className="w-10 h-10 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <CubeIcon className="w-8 h-8 text-brand-blue" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 text-center line-clamp-2">
            {category.name}
          </h3>
          {category.productsCount !== undefined && (
            <span className="text-xs text-gray-500 mt-1">
              {category.productsCount} منتج
            </span>
          )}
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/products?category=${category._id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-brand-green/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Content */}
        <div className="relative p-6">
          {/* Icon/Image */}
          <div className="w-20 h-20 mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            {category.icon && !imageError ? (
              <img
                src={getImageUrl(category.icon)}
                alt={category.name}
                className="w-12 h-12 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <CubeIcon className="w-10 h-10 text-brand-blue" />
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-blue transition-colors">
            {category.name}
          </h3>
          
          {/* Description */}
          {category.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {category.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-between">
            {category.productsCount !== undefined && (
              <span className="text-sm font-semibold text-gray-700">
                {category.productsCount} منتج
              </span>
            )}
            {category.isFeatured && (
              <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full">
                مميز
              </span>
            )}
          </div>
          
          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">الفئات الفرعية:</p>
              <div className="flex flex-wrap gap-1">
                {category.children.slice(0, 3).map((child) => (
                  <span
                    key={child._id}
                    className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600"
                  >
                    {child.name}
                  </span>
                ))}
                {category.children.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                    +{category.children.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;