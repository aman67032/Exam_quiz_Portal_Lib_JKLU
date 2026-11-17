'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { FileText, Search, CheckCircle2, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/badge';

gsap.registerPlugin(ScrollTrigger);

interface ScrollCanvasShowcaseProps {
  /**
   * Optional path prefix for ffmpeg-extracted frames, e.g. "/frames/frame_"
   * (reads /frames/frame_0001.webp .. /frames/frame_0090.webp).
   * When omitted, renders a 90-frame high-DPI procedural archival canvas sequence.
   */
  framesBasePath?: string;
  frameCount?: number;
  papersCount?: number;
  coursesCount?: number;
}

const STEPS = [
  {
    id: 'search',
    label: '01 / INSTANT INDEX',
    title: 'Smart Acronym & Course Lookup',
    desc: 'Query by code (CS1102, ID1114), semester, or acronym across 306+ JKLU courses.',
    icon: Search,
  },
  {
    id: 'preview',
    label: '02 / WASM PDF ENGINE',
    title: 'Inline High-DPI Canvas Preview',
    desc: 'Client-side PDF.js + JBIG2/OpenJPEG WASM renders scanned exam sheets crisply on mobile.',
    icon: FileText,
  },
  {
    id: 'export',
    label: '03 / OFFLINE READY',
    title: 'Clean PDF & Batch ZIP Export',
    desc: 'Download verified Mid-Term & End-Term papers with zero watermarks or broken links.',
    icon: CheckCircle2,
  },
];

function drawArchivalFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
  isDark: boolean,
  papersCount: number
) {
  ctx.clearRect(0, 0, w, h);

  // Background surface
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  if (isDark) {
    bgGrad.addColorStop(0, '#0D0D12');
    bgGrad.addColorStop(1, '#14141C');
  } else {
    bgGrad.addColorStop(0, '#FAF9F6');
    bgGrad.addColorStop(1, '#F1EFE8');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural grid
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(10,10,12,0.05)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Ambient glow behind active card
  const glowX = w * (0.25 + progress * 0.5);
  const glowY = h * 0.5;
  const radial = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, w * 0.45);
  radial.addColorStop(0, progress < 0.5 ? 'rgba(224,79,51,0.18)' : 'rgba(79,70,229,0.2)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);

  // Draw 3 fanning exam paper sheets based on scroll progress
  const centerX = w / 2;
  const centerY = h / 2 + 8;
  const sheetW = Math.min(280, w * 0.46);
  const sheetH = Math.min(320, h * 0.72);

  const cards = [
    { code: 'CS1102', title: 'Data Structures & Algo', tag: 'END-TERM · 2025', offset: -1 },
    { code: 'ID1114', title: 'Business Statistics', tag: 'MID-TERM · 2026', offset: 1 },
    { code: 'MA1121', title: 'Marketing Research', tag: 'VERIFIED PDF · 2026', offset: 0 },
  ];

  cards.forEach((card, i) => {
    ctx.save();
    const spread = Math.sin(Math.min(1, progress * 1.4) * Math.PI * 0.5);
    const angle = card.offset * (0.04 + spread * 0.14) * (1 - Math.max(0, (progress - 0.65) * 1.5));
    const tx = centerX + card.offset * spread * (w * 0.17);
    const ty = centerY + Math.abs(card.offset) * 14 - (i === 2 ? progress * 12 : 0);
    const scale = i === 2 ? 0.96 + progress * 0.08 : 0.9;

    ctx.translate(tx, ty);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Card shadow + body
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(10,10,12,0.12)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = isDark ? '#18181F' : '#FFFFFF';
    ctx.strokeStyle =
      i === 2
        ? progress > 0.5
          ? '#4F46E5'
          : '#E04F33'
        : isDark
          ? 'rgba(255,255,255,0.1)'
          : '#E5E2DC';
    ctx.lineWidth = i === 2 ? 2 : 1;

    ctx.beginPath();
    ctx.roundRect(-sheetW / 2, -sheetH / 2, sheetW, sheetH, 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Header pill
    ctx.fillStyle = i === 2 ? '#E04F33' : isDark ? '#272730' : '#F3F1EA';
    ctx.beginPath();
    ctx.roundRect(-sheetW / 2 + 18, -sheetH / 2 + 18, 72, 22, 6);
    ctx.fill();

    ctx.fillStyle = i === 2 ? '#FFFFFF' : isDark ? '#F5F4F0' : '#0A0A0C';
    ctx.font = '600 11px monospace';
    ctx.fillText(card.code, -sheetW / 2 + 28, -sheetH / 2 + 33);

    // Title (clipped cleanly inside card width on narrow mobile viewports)
    ctx.fillStyle = isDark ? '#F5F4F0' : '#0A0A0C';
    ctx.font = w < 380 ? '600 13px sans-serif' : '600 15px sans-serif';
    ctx.fillText(card.title, -sheetW / 2 + 18, -sheetH / 2 + 66, sheetW - 36);

    ctx.fillStyle = isDark ? '#94938E' : '#5C5B57';
    ctx.font = '500 10px monospace';
    ctx.fillText(card.tag, -sheetW / 2 + 18, -sheetH / 2 + 86, sheetW - 36);

    // Mock exam question lines (sharpening as progress rises)
    const lineCount = 6;
    for (let l = 0; l < lineCount; l++) {
      const ly = -sheetH / 2 + 114 + l * 26;
      const lw = (sheetW - 36) * (l % 2 === 0 ? 0.92 : 0.68);
      const revealed = i === 2 ? Math.max(0.25, Math.min(1, progress * 1.8 - l * 0.12)) : 0.4;
      ctx.fillStyle = isDark
        ? `rgba(245,244,240,${0.12 + revealed * 0.25})`
        : `rgba(10,10,12,${0.08 + revealed * 0.22})`;
      ctx.beginPath();
      ctx.roundRect(-sheetW / 2 + 18, ly, lw, 8, 4);
      ctx.fill();
    }

    // Active scan beam on center sheet during Phase 2
    if (i === 2 && progress > 0.15 && progress < 0.85) {
      const scanY = -sheetH / 2 + 96 + ((progress - 0.15) / 0.7) * (sheetH - 120);
      const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
      scanGrad.addColorStop(0, 'rgba(224,79,51,0)');
      scanGrad.addColorStop(0.5, 'rgba(224,79,51,0.55)');
      scanGrad.addColorStop(1, 'rgba(224,79,51,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(-sheetW / 2 + 10, scanY - 12, sheetW - 20, 24);
    }

    // Verified badge in Phase 3
    if (i === 2 && progress > 0.66) {
      const badgeAlpha = Math.min(1, (progress - 0.66) * 3);
      ctx.globalAlpha = badgeAlpha;
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.roundRect(-sheetW / 2 + 18, sheetH / 2 - 44, sheetW - 36, 28, 8);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 11px monospace';
      ctx.fillText(`VERIFIED PDF · ${papersCount} ARCHIVED`, -sheetW / 2 + 34, sheetH / 2 - 26);
    }

    ctx.restore();
  });
}

export const ScrollCanvasShowcase: React.FC<ScrollCanvasShowcaseProps> = ({
  framesBasePath,
  frameCount = 90,
  papersCount = 654,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(240, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Optional ffmpeg image-frame preloader
    const images: HTMLImageElement[] = [];
    if (framesBasePath) {
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = `${framesBasePath}${String(i).padStart(4, '0')}.webp`;
        images.push(img);
      }
    }

    const state = { frame: 0 };
    const renderFrame = (progress: number) => {
      const rect = canvas.getBoundingClientRect();
      const idx = Math.min(frameCount - 1, Math.max(0, Math.round(progress * (frameCount - 1))));
      if (framesBasePath && images[idx]?.complete && images[idx].naturalWidth > 0) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(images[idx], 0, 0, rect.width, rect.height);
      } else {
        drawArchivalFrame(ctx, rect.width, rect.height, progress, isDark, papersCount);
      }
    };

    renderFrame(0.12);

    const gsapCtx = gsap.context(() => {
      gsap.to(state, {
        frame: frameCount - 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          end: 'bottom 25%',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            renderFrame(p);
            setScrollPct(Math.round(p * 100));
            setActiveStep(p < 0.34 ? 0 : p < 0.68 ? 1 : 2);
          },
        },
      });
    }, section);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      gsapCtx.revert();
    };
  }, [framesBasePath, frameCount, isDark, papersCount]);

  return (
    <section
      ref={sectionRef}
      className="relative rounded-2xl border border-[#E5E2DC] dark:border-[#232329] bg-white/85 dark:bg-[#121216]/85 backdrop-blur-md p-5 sm:p-8 shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#E5E2DC] dark:border-[#232329]">
        <div className="space-y-1">
          <Badge variant="indigo">
            <Sparkles className="w-3 h-3" />
            <span>GSAP SCROLLTRIGGER · CANVAS PIPELINE</span>
          </Badge>
          <h2 className="text-xl sm:text-3xl font-light tracking-tight">
            How the{' '}
            <span className="font-serif-editorial italic font-normal text-[#4F46E5] dark:text-[#818CF8]">
              exam vault
            </span>{' '}
            works as you scroll
          </h2>
        </div>
        <div className="font-mono-tabular text-xs text-[#5C5B57] dark:text-[#94938E] flex items-center gap-2">
          <span>FRAME SCRUB</span>
          <span className="px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] text-[#0A0A0C] dark:text-[#F5F4F0]">
            {scrollPct}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center">
        {/* Canvas Frame Stage */}
        <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6] dark:bg-[#0A0A0C]">
          <canvas
            ref={canvasRef}
            className="w-full h-[260px] sm:h-[340px] block"
          />
        </div>

        {/* Synchronized Motion Step Cards */}
        <div className="lg:col-span-5 space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <motion.div
                key={step.id}
                animate={{
                  scale: isActive ? 1.015 : 1,
                  opacity: isActive ? 1 : 0.72,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className={`rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-[#E04F33] bg-[#E04F33]/[0.06] dark:bg-[#E04F33]/[0.1]'
                    : 'border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6]/70 dark:bg-[#0A0A0C]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono-tabular text-[11px] font-semibold tracking-wider text-[#E04F33]">
                    {step.label}
                  </span>
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#E04F33]' : 'text-[#5C5B57] dark:text-[#94938E]'
                    }`}
                  />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-[#0A0A0C] dark:text-[#F5F4F0]">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#94938E] mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
