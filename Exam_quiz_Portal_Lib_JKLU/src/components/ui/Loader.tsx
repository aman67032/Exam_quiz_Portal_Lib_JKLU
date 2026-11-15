import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import JKLULogo from '@/components/layout/JKLULogo';

interface LoaderProps {
  fullScreen?: boolean;
  label?: string;
}

const Loader: React.FC<LoaderProps> = ({
  fullScreen = false,
  label = 'LOADING ARCHIVE',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const strokeAnim = anime({
      targets: rootRef.current.querySelectorAll('.loader-geo-path'),
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutQuart',
      duration: 1500,
      delay: anime.stagger(180),
      direction: 'alternate',
      loop: true,
    });

    const ringAnim = anime({
      targets: rootRef.current.querySelector('.loader-orbit-ring'),
      rotate: 360,
      easing: 'linear',
      duration: 6000,
      loop: true,
    });

    const barAnim = anime({
      targets: rootRef.current.querySelectorAll('.loader-eq-bar'),
      scaleY: [0.25, 1],
      opacity: [0.35, 1],
      easing: 'easeInOutSine',
      duration: 550,
      delay: anime.stagger(110),
      direction: 'alternate',
      loop: true,
    });

    return () => {
      strokeAnim.pause();
      ringAnim.pause();
      barAnim.pause();
    };
  }, []);

  const content = (
    <div ref={rootRef} className="flex flex-col items-center justify-center gap-5 select-none">
      {/* Geometric Pyramid & Orbit SVG Animation */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
          {/* Outer Rotating Dashed Ring */}
          <g className="loader-orbit-ring" style={{ transformOrigin: '60px 60px' }}>
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="currentColor"
              className="text-[#E5E2DC] dark:text-[#232329]"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <circle cx="60" cy="8" r="3.5" fill="#E04F33" />
            <circle cx="60" cy="112" r="3" fill="#4F46E5" />
          </g>

          {/* Animated Stepped Pyramid & Interlocking Triangles */}
          <polygon
            className="loader-geo-path"
            points="60,24 96,86 24,86"
            stroke="#E04F33"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            className="loader-geo-path"
            points="60,96 96,34 24,34"
            stroke="#4F46E5"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <line
            className="loader-geo-path dark:stroke-[#F5F4F0]"
            x1="36"
            y1="66"
            x2="84"
            y2="66"
            stroke="#0A0A0C"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Official JKLU Brand + Equalizer Progress Bars */}
      <div className="flex flex-col items-center gap-3">
        <JKLULogo size="sm" />
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 h-3.5">
            {[0, 1, 2, 3, 4].map((idx) => (
              <span
                key={idx}
                className="loader-eq-bar w-1 h-full rounded-full bg-[#E04F33] origin-bottom"
              />
            ))}
          </div>
          <span className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#5C5B57] dark:text-[#94938E]">
            {label}
          </span>
        </div>
      </div>
    </div>
  );

  if (!fullScreen) {
    return <div className="py-12 flex items-center justify-center">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] transition-colors">
      {content}
    </div>
  );
};

export default Loader;
