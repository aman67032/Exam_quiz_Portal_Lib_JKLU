'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  delay?: number;
}

export const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  words,
  className,
  delay = 0,
}) => {
  const wordsArray = words.split(' ');

  return (
    <span className={cn('inline', className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.4,
            delay: delay + idx * 0.045,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.26em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};
