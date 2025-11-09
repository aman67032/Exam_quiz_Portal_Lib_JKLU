import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3 sm:p-3.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: theme === 'dark' ? 180 : 0,
          scale: 1
        }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 200
        }}
        className="flex items-center justify-center"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
        ) : (
          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;