import React from 'react';
import { motion } from 'framer-motion';
import { BanknotesIcon } from '@heroicons/react/24/outline';

const LabWallet = () => {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BanknotesIcon className="h-8 w-8 ml-3 text-blue-600" />
            تعاملات المحفظة
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة المحفظة والمعاملات المالية
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
      >
        <BanknotesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">تعاملات المحفظة</h3>
        <p className="text-gray-500">سيتم تطوير هذه الصفحة قريباً</p>
      </motion.div>
    </div>
  );
};

export default LabWallet;
