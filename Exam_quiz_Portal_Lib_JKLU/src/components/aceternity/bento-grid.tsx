'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SpotlightCard } from './spotlight-card';

export const BentoGrid: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

interface BentoGridItemProps {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
  footer?: React.ReactNode;
  spotlightColor?: string;
  onClick?: () => void;
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  className,
  title,
  description,
  header,
  icon,
  badge,
  footer,
  spotlightColor,
  onClick,
}) => {
  return (
    <SpotlightCard
      onClick={onClick}
      spotlightColor={spotlightColor}
      className={cn(
        'p-6 flex flex-col justify-between space-y-4',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {badge && (
            <span className="font-mono-tabular text-[11px] uppercase px-2.5 py-0.5 rounded-full bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] text-[#5C5B57] dark:text-[#94938E]">
              {badge}
            </span>
          )}
          {icon}
        </div>
        {header}
        <div className="transition-transform duration-200 group-hover/spotlight:translate-x-1 space-y-1.5">
          <div className="text-lg font-semibold tracking-tight text-[#0A0A0C] dark:text-[#F5F4F0]">
            {title}
          </div>
          <div className="text-sm text-[#5C5B57] dark:text-[#94938E] leading-relaxed">
            {description}
          </div>
        </div>
      </div>
      {footer && (
        <div className="pt-4 border-t border-[#E5E2DC] dark:border-[#232329]">
          {footer}
        </div>
      )}
    </SpotlightCard>
  );
};
