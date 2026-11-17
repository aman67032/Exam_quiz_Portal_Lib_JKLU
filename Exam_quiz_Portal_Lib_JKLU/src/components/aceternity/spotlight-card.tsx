'use client';

import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  children: React.ReactNode;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(224, 79, 51, 0.14)',
  onMouseMove,
  ...props
}) => {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
    onMouseMove?.(e);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        'group/spotlight relative overflow-hidden rounded-xl border border-[#E5E2DC] dark:border-[#232329] bg-white/95 dark:bg-[#121216]/95 transition-all duration-300 hover:border-[#0A0A0C]/30 dark:hover:border-[#F5F4F0]/25 hover:shadow-lg',
        className
      )}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
