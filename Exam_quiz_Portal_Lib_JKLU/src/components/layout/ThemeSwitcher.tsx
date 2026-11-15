import React, { useRef } from 'react';
import anime from 'animejs';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const iconRef = useRef<HTMLSpanElement>(null);

  const handleClick = () => {
    if (iconRef.current) {
      anime({
        targets: iconRef.current,
        rotate: [0, 360],
        scale: [0.75, 1],
        duration: 420,
        easing: 'easeOutBack',
      });
    }
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E5E2DC] dark:border-[#232329] bg-white dark:bg-[#121216] text-[#0A0A0C] dark:text-[#F5F4F0] hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] transition-colors text-xs font-medium"
    >
      <span ref={iconRef} className="inline-flex items-center justify-center">
        {theme === 'light' ? (
          <Sun className="w-3.5 h-3.5 text-[#E04F33]" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-[#818CF8]" />
        )}
      </span>
      <span className="hidden sm:inline font-mono-tabular text-[11px]">
        {theme === 'light' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeSwitcher;
