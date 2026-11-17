'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const BEAM_PATHS = [
  'M-120 40 C 180 120, 420 -40, 820 180 S 1260 280, 1540 120',
  'M-80 260 C 260 180, 560 360, 920 160 S 1320 40, 1560 220',
  'M-140 420 C 220 310, 520 460, 880 290 S 1240 200, 1580 340',
];

export const BackgroundBeams: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Subtle archival dot matrix */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(120,118,112,0.35) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Animated SVG Light Beams */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 520"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="aceternity-beam-vermilion" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E04F33" stopOpacity="0" />
            <stop offset="50%" stopColor="#E04F33" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="aceternity-beam-indigo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0" />
            <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E04F33" stopOpacity="0" />
          </linearGradient>
        </defs>

        {BEAM_PATHS.map((d, idx) => (
          <motion.path
            key={idx}
            d={d}
            stroke={idx % 2 === 0 ? 'url(#aceternity-beam-vermilion)' : 'url(#aceternity-beam-indigo)'}
            strokeWidth={idx === 1 ? 1.75 : 1.25}
            strokeLinecap="round"
            initial={{ pathLength: 0.25, pathOffset: 0, opacity: 0.35 }}
            animate={{
              pathOffset: [0, 1],
              opacity: [0.25, 0.7, 0.25],
            }}
            transition={{
              duration: 9 + idx * 2.5,
              repeat: Infinity,
              ease: 'linear',
              delay: idx * 1.1,
            }}
          />
        ))}
      </svg>
    </div>
  );
};
