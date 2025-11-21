import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface JKLULogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const JKLULogo: React.FC<JKLULogoProps> = ({ className = '', size = 'md' }) => {
  const { theme } = useTheme();
  
  // Use white logo for dark theme, black logo for light theme
  const logoSrc = theme === 'dark' 
    ? '/white_jklu_logo.png' 
    : '/black_jklu_logo.png';
  
  // Size mappings
  const sizeClasses = {
    sm: 'h-16 w-auto',
    md: 'h-24 w-auto',
    lg: 'h-32 w-auto'
  };

  return (
    <motion.img
      src={logoSrc}
      alt="JK Lakshmipat University"
      className={`${sizeClasses[size]} ${className} object-contain transition-opacity duration-300`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    />
  );
};

export default JKLULogo;

