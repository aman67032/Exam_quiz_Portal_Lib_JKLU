import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

const HeroBackgroundAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxLayerRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Continuous SVG line-drawing animation (strokeDashoffset)
    const pathAnim = anime({
      targets: containerRef.current.querySelectorAll('.hero-bg-path'),
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 3800,
      delay: anime.stagger(350),
      direction: 'alternate',
      loop: true,
    });

    // 2. Concentric geometric rings rotation & breathing
    const ringAnim = anime({
      targets: containerRef.current.querySelectorAll('.hero-bg-ring'),
      rotate: (_el: Element, i: number) => (i % 2 === 0 ? 360 : -360),
      scale: [
        { value: 1, duration: 0 },
        { value: 1.04, duration: 4000 },
        { value: 1, duration: 4000 },
      ],
      easing: 'linear',
      duration: 42000,
      loop: true,
    });

    // 3. Floating academic nodes & geometric markers
    const nodesAnim = anime({
      targets: containerRef.current.querySelectorAll('.hero-bg-node'),
      translateY: (_el: Element, i: number) => (i % 2 === 0 ? [-14, 14] : [14, -14]),
      translateX: (_el: Element, i: number) => (i % 3 === 0 ? [-8, 8] : [8, -8]),
      opacity: [
        { value: 0.25, duration: 2000 },
        { value: 0.75, duration: 2000 },
      ],
      easing: 'easeInOutQuad',
      duration: (_el: Element, i: number) => 3200 + i * 350,
      direction: 'alternate',
      loop: true,
    });

    // 4. Travelling signal pulses along blueprint lines
    const pulseAnim = anime({
      targets: containerRef.current.querySelectorAll('.hero-bg-pulse'),
      strokeDashoffset: [600, -600],
      easing: 'linear',
      duration: (_el: Element, i: number) => 5500 + i * 1200,
      loop: true,
    });

    // 5. Subtle mouse parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!parallaxLayerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      parallaxLayerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      pathAnim.pause();
      ringAnim.pause();
      nodesAnim.pause();
      pulseAnim.pause();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Subtle Radial Ambient Glows */}
      <div className="absolute -top-32 -right-32 w-[38rem] h-[38rem] rounded-full bg-[#E04F33]/[0.06] dark:bg-[#E04F33]/[0.09] blur-3xl" />
      <div className="absolute top-1/3 -left-32 w-[34rem] h-[34rem] rounded-full bg-[#4F46E5]/[0.05] dark:bg-[#6366F1]/[0.08] blur-3xl" />

      {/* Architectural Dot-Matrix & Fineline Grid */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(148, 147, 142, 0.45) 1px, transparent 0)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Interactive SVG Blueprint & Geometric Constellation Canvas */}
      <svg
        ref={parallaxLayerRef}
        className="w-full h-full transition-transform duration-300 ease-out"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="vermilionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E04F33" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#E04F33" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="indigoGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E04F33" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Golden Ratio Architectural Framing Lines */}
        <line
          x1="0"
          y1="180"
          x2="1440"
          y2="180"
          stroke="currentColor"
          className="text-[#E5E2DC] dark:text-[#1F1F26]"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <line
          x1="0"
          y1="720"
          x2="1440"
          y2="720"
          stroke="currentColor"
          className="text-[#E5E2DC] dark:text-[#1F1F26]"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <line
          x1="860"
          y1="0"
          x2="860"
          y2="900"
          stroke="currentColor"
          className="text-[#E5E2DC] dark:text-[#1F1F26]"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        {/* Rotating Geometric Compass Rings (Right Sector) */}
        <g style={{ transformOrigin: '1060px 430px' }} className="hero-bg-ring">
          <circle
            cx="1060"
            cy="430"
            r="290"
            stroke="url(#vermilionGrad)"
            strokeWidth="1.2"
            strokeDasharray="10 14"
          />
          <circle cx="1060" cy="140" r="4" fill="#E04F33" fillOpacity="0.5" />
          <circle cx="1350" cy="430" r="4" fill="#4F46E5" fillOpacity="0.5" />
        </g>

        <g style={{ transformOrigin: '1060px 430px' }} className="hero-bg-ring">
          <circle
            cx="1060"
            cy="430"
            r="210"
            stroke="url(#indigoGrad)"
            strokeWidth="1"
            strokeDasharray="4 10"
          />
          <polygon
            points="1060,240 1230,525 890,525"
            stroke="url(#vermilionGrad)"
            strokeWidth="1"
            fill="none"
          />
        </g>

        {/* JKLU Stepped Pyramid Wireframe Silhouette (Subtle Architectural Homage) */}
        <g className="opacity-45 dark:opacity-35">
          <path
            className="hero-bg-path"
            d="M 920 560 L 1060 320 L 1200 560 Z"
            stroke="url(#vermilionGrad)"
            strokeWidth="1.5"
          />
          <path
            className="hero-bg-path"
            d="M 955 500 L 1165 500 M 985 450 L 1135 450 M 1015 400 L 1105 400"
            stroke="#E04F33"
            strokeOpacity="0.22"
            strokeWidth="1"
          />
        </g>

        {/* Flowing Academic Trajectories Across 100vh */}
        <path
          className="hero-bg-path"
          d="M -60 680 C 280 620, 440 240, 860 360 C 1140 440, 1280 200, 1500 160"
          stroke="url(#vermilionGrad)"
          strokeWidth="1.5"
        />
        <path
          className="hero-bg-path"
          d="M -40 260 C 320 340, 560 660, 960 520 C 1200 430, 1340 590, 1500 540"
          stroke="url(#indigoGrad)"
          strokeWidth="1.5"
        />

        {/* Travelling Signal Pulses */}
        <path
          className="hero-bg-pulse"
          d="M -60 680 C 280 620, 440 240, 860 360 C 1140 440, 1280 200, 1500 160"
          stroke="#E04F33"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeDasharray="60 900"
        />
        <path
          className="hero-bg-pulse"
          d="M -40 260 C 320 340, 560 660, 960 520 C 1200 430, 1340 590, 1500 540"
          stroke="#4F46E5"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeDasharray="50 900"
        />

        {/* Floating Constellation Nodes */}
        <g className="hero-bg-node">
          <circle cx="220" cy="210" r="4" fill="#E04F33" />
          <circle cx="220" cy="210" r="11" stroke="#E04F33" strokeOpacity="0.3" strokeWidth="1" />
        </g>
        <g className="hero-bg-node">
          <circle cx="640" cy="160" r="3.5" fill="#4F46E5" />
          <circle cx="640" cy="160" r="9" stroke="#4F46E5" strokeOpacity="0.3" strokeWidth="1" />
        </g>
        <g className="hero-bg-node">
          <circle cx="520" cy="690" r="4" fill="#E04F33" />
          <circle cx="520" cy="690" r="10" stroke="#E04F33" strokeOpacity="0.3" strokeWidth="1" />
        </g>
        <g className="hero-bg-node">
          <circle cx="860" cy="360" r="5" fill="#E04F33" />
          <circle cx="860" cy="360" r="14" stroke="#E04F33" strokeOpacity="0.25" strokeWidth="1" />
        </g>
        <g className="hero-bg-node">
          <circle cx="1290" cy="250" r="4" fill="#4F46E5" />
          <circle cx="1290" cy="250" r="12" stroke="#4F46E5" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      </svg>

      {/* Bottom Fade into Next Section */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#FAF9F6] dark:from-[#0A0A0C] to-transparent" />
    </div>
  );
};

export default HeroBackgroundAnimation;
