import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import LabSidebar from './LabSidebar';

const LabLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <LabSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isDesktop={isDesktop}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {!isDesktop && (
          <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">لوحة التحكم</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 via-primary-50/30 to-secondary-50/20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default LabLayout;
