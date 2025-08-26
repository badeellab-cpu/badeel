import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCartIcon,
  UserIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const CheckoutSteps = ({ currentStep, onStepClick }) => {
  const steps = [
    { id: 1, title: 'مراجعة السلة', icon: ShoppingCartIcon },
    { id: 2, title: 'بياناتك', icon: UserIcon },
    { id: 3, title: 'عنوان التوصيل', icon: MapPinIcon },
    { id: 4, title: 'الدفع', icon: CreditCardIcon }
  ];

  return (
    <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <motion.button
            onClick={() => currentStep > step.id && onStepClick(step.id)}
            whileHover={currentStep > step.id ? { scale: 1.05 } : {}}
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              currentStep >= step.id 
                ? 'bg-brand-blue border-brand-blue text-white shadow-lg' 
                : 'border-gray-300 text-gray-400 bg-white'
            } ${currentStep > step.id ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'}`}
          >
            {currentStep > step.id ? (
              <CheckCircleIconSolid className="w-6 h-6" />
            ) : (
              <step.icon className="w-6 h-6" />
            )}
          </motion.button>
          
          <div className="mr-3 text-center">
            <div className={`text-sm font-medium ${
              currentStep >= step.id ? 'text-brand-blue' : 'text-gray-400'
            }`}>
              {step.title}
            </div>
            <div className={`text-xs ${
              currentStep >= step.id ? 'text-brand-blue' : 'text-gray-400'
            }`}>
              الخطوة {step.id}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <ChevronRightIcon className={`w-5 h-5 mx-4 ${
              currentStep > step.id ? 'text-brand-blue' : 'text-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default CheckoutSteps;
