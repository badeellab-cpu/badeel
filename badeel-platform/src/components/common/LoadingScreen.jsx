import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Logo Animation */}
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative inline-block mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-brand-blue to-brand-blueSecondary rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">بديل</span>
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-blueSecondary rounded-2xl"
          />
        </motion.div>
        
        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-lg font-medium"
        >
          جاري التحميل...
        </motion.p>
        
        {/* Loading Dots */}
        <div className="flex justify-center mt-4 space-x-2 space-x-reverse">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className="w-3 h-3 bg-gradient-to-r from-brand-blue to-brand-blueSecondary rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;