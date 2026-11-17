'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeroPaperDeckProps {
  heroImageSrc: string;
  papersCount: number;
  onSelectCourse: (code: string) => void;
}

const SAMPLE_PAPERS = [
  {
    code: 'CS1102',
    title: 'Data Structures & Algorithms',
    meta: 'B.TECH · END-TERM · SEM 2 · 2025',
    accent: '#E04F33',
  },
  {
    code: 'ID1114',
    title: 'Business Statistics',
    meta: 'BBA · END-TERM · SEM 2 · 2026',
    accent: '#4F46E5',
  },
  {
    code: 'MA1121',
    title: 'Marketing Research',
    meta: 'BBA · END-TERM · SEM 4 · 2026',
    accent: '#15803D',
  },
];

export const HeroPaperDeck: React.FC<HeroPaperDeckProps> = ({
  heroImageSrc,
  papersCount,
  onSelectCourse,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 180,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), {
    stiffness: 180,
    damping: 22,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SAMPLE_PAPERS.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ perspective: 1100 }} className="w-full">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative rounded-2xl border border-[#E5E2DC] dark:border-[#232329] bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md p-3 sm:p-4 shadow-xl"
      >
        {/* Top Campus Visual Banner */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC]/60 dark:border-white/5">
          <img
            src={heroImageSrc}
            alt="JKLU Campus Exam Portal Showcase"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono-tabular">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{papersCount.toLocaleString()} VERIFIED PAPERS</span>
            </div>
            <Badge className="bg-black/60 text-white border-white/20 backdrop-blur-sm text-[10px]">
              <Sparkles className="w-2.5 h-2.5 text-[#E04F33]" />
              <span>2020–2026</span>
            </Badge>
          </div>
        </div>

        {/* Interactive Stacked Exam Paper Deck */}
        <div className="mt-3 relative h-[126px] sm:h-[132px]">
          {SAMPLE_PAPERS.map((paper, idx) => {
            const offset = (idx - activeIndex + SAMPLE_PAPERS.length) % SAMPLE_PAPERS.length;
            const isFront = offset === 0;
            return (
              <motion.div
                key={paper.code}
                onClick={() => (isFront ? onSelectCourse(paper.code) : setActiveIndex(idx))}
                initial={false}
                animate={{
                  y: offset * 10,
                  scale: 1 - offset * 0.045,
                  opacity: isFront ? 1 : 0.65 - offset * 0.15,
                  zIndex: SAMPLE_PAPERS.length - offset,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="absolute inset-x-0 top-0 rounded-xl border border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6] dark:bg-[#18181F] p-3.5 shadow-sm cursor-pointer hover:border-[#E04F33] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono-tabular text-[11px] font-semibold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: paper.accent }}
                      >
                        {paper.code}
                      </span>
                      <span className="font-mono-tabular text-[10px] text-[#5C5B57] dark:text-[#94938E] truncate">
                        {paper.meta}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-[#0A0A0C] dark:text-[#F5F4F0] truncate">
                      {paper.title}
                    </div>
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] flex items-center justify-center text-[#5C5B57] dark:text-[#94938E]">
                    {isFront ? (
                      <ArrowUpRight className="w-4 h-4 text-[#E04F33]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#5C5B57] dark:text-[#94938E] font-mono-tabular">
                  <span>Tap to open paper</span>
                  <span>
                    {idx + 1} / {SAMPLE_PAPERS.length}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
