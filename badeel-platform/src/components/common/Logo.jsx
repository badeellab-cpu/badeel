import React from 'react';
import { motion } from 'framer-motion';
import logoSvg from '../../assets/logo.svg';

const Logo = ({ size = 'md', animated = true, className = '' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  };

  const LogoComponent = animated ? motion.img : 'img';
  
  const animationProps = animated ? {
    whileHover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    whileTap: { scale: 0.95 }
  } : {};

  return (
    <LogoComponent
      src={logoSvg}
      alt="منصة بديل - تبادل الأجهزة الطبية"
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
      {...animationProps}
    />
  );
};

export default Logo;