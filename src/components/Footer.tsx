import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo (2).png';
import JKLULogo from './JKLULogo';

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="relative z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 mt-auto shadow-lg dark:shadow-gray-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Section - Logos */}
          <div className="flex items-center gap-4 sm:gap-6">
            <img 
              src={logoImg} 
              alt="Paper Portal Logo" 
              className="h-12 sm:h-16 w-auto opacity-90 hover:opacity-100 transition-opacity"
            />
            <div className="hidden sm:block">
              <JKLULogo size="md" className="opacity-90 hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Center Section - Council Info */}
          <div className="text-center lg:text-left">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
              Council of Technical Affairs
            </h3>
            <div className="text-xs sm:text-sm space-y-1">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="text-amber-600 dark:text-amber-400 font-medium">Suryaansh Sharma</span> - General Secretary
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="text-amber-600 dark:text-amber-400 font-medium">Aman Pratap Singh</span> - Secretary
              </p>
            </div>
          </div>

          {/* Right Section - Copyright */}
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center lg:text-right">
            <p>© {new Date().getFullYear()} Paper Portal - JKLU</p>
            <p className="mt-1">All rights reserved</p>
          </div>
        </div>

        {/* Mobile JKLU Logo */}
        <div className="sm:hidden flex justify-center mt-4">
          <JKLULogo size="sm" className="opacity-90" />
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;

