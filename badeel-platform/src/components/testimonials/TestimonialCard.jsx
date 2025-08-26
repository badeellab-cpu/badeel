import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';

const TestimonialCard = ({ testimonial }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 relative"
    >
      {/* Quote Icon */}
      <div className="absolute top-4 right-4 text-blue-100">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative">
        {/* Rating */}
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-5 h-5 ${
                i < testimonial.rating
                  ? 'text-yellow-400'
                  : 'text-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Quote */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          "{testimonial.content}"
        </p>
        
        {/* Author */}
        <div className="flex items-center">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover ml-3"
          />
          <div>
            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
            <p className="text-sm text-gray-600">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;