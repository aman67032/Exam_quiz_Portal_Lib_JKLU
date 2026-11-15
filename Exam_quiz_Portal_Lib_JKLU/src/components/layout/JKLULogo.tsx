import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface JKLULogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const JKLULogo: React.FC<JKLULogoProps> = ({ className = '', size = 'sm' }) => {
  const { theme } = useTheme();

  const logoSrc = theme === 'dark' ? '/white_jklu_logo.png' : '/black_jklu_logo.png';

  const sizeClasses = {
    xs: 'h-7 w-auto',
    sm: 'h-9 w-auto',
    md: 'h-14 w-auto',
    lg: 'h-20 w-auto',
  };

  return (
    <img
      src={logoSrc}
      alt="JK Lakshmipat University"
      className={`${sizeClasses[size]} ${className} object-contain select-none`}
    />
  );
};

export default JKLULogo;
