'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

export const ScrollProgressBar: React.FC<{ className?: string }> = ({ className }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={cn(
        'fixed top-0 left-0 right-0 h-[2.5px] origin-left z-50 bg-gradient-to-r from-[#E04F33] via-[#896ABD] to-[#4F46E5]',
        className
      )}
    />
  );
};

interface MotionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export const MotionReveal: React.FC<MotionRevealProps> = ({
  children,
  className,
  delay = 0,
  y = 20,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        type: 'spring',
        stiffness: 140,
        damping: 22,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
