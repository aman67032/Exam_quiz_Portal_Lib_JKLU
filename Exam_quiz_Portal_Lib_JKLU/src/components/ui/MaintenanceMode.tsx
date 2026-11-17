import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles } from 'lucide-react';
import JKLULogo from '@/components/layout/JKLULogo';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import AeroShards from '@/components/layout/AeroShards';
import { BackgroundBeams } from '@/components/aceternity/background-beams';
import { SpotlightCard } from '@/components/aceternity/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

interface MaintenanceModeProps {
  message?: string;
}

const ExclusiveVaultGraphic: React.FC = () => {
  return (
    <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
      {/* Ambient radial glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E04F33]/25 via-[#896ABD]/20 to-[#4F46E5]/25 blur-xl animate-pulse" />

      <svg
        viewBox="0 0 140 140"
        className="w-full h-full relative z-10 overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vault-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E04F33" />
            <stop offset="50%" stopColor="#896ABD" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Outer dashed orbital ring */}
        <motion.circle
          cx="70"
          cy="70"
          r="60"
          stroke="url(#vault-ring-grad)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          strokeOpacity="0.65"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '70px 70px', transformBox: 'view-box' }}
        />

        {/* Inner counter-rotating arc */}
        <motion.circle
          cx="70"
          cy="70"
          r="46"
          stroke="#E04F33"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="48 180"
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '70px 70px', transformBox: 'view-box' }}
        />

        {/* Orbiting accent node */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '70px 70px', transformBox: 'view-box' }}
        >
          <circle cx="70" cy="10" r="4" fill="#E04F33" />
          <circle cx="130" cy="70" r="3" fill="#4F46E5" />
        </motion.g>

        {/* Central floating archival paper shield */}
        <motion.g
          animate={{ y: [-2.5, 2.5, -2.5] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect
            x="44"
            y="40"
            width="52"
            height="60"
            rx="10"
            className="fill-white dark:fill-[#18181F] stroke-[#E5E2DC] dark:stroke-white/15"
            strokeWidth="1.5"
          />
          <rect x="53" y="51" width="18" height="4" rx="2" fill="#E04F33" />
          <rect
            x="53"
            y="61"
            width="34"
            height="3.5"
            rx="1.75"
            className="fill-[#0A0A0C]/20 dark:fill-white/25"
          />
          <rect
            x="53"
            y="69"
            width="28"
            height="3.5"
            rx="1.75"
            className="fill-[#0A0A0C]/15 dark:fill-white/15"
          />
          <rect
            x="53"
            y="77"
            width="22"
            height="3.5"
            rx="1.75"
            className="fill-[#0A0A0C]/15 dark:fill-white/15"
          />
          {/* Live status dot */}
          <circle cx="85" cy="89" r="6" fill="#E04F33" fillOpacity="0.18" />
          <circle cx="85" cy="89" r="3" fill="#E04F33" />
        </motion.g>
      </svg>
    </div>
  );
};

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ message }) => {
  const { theme } = useTheme();

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] overflow-x-hidden">
      {/* Exclusive 3D Shard + Beams Backdrop */}
      <div className="absolute inset-0 z-0 opacity-65 dark:opacity-85 pointer-events-none">
        <AeroShards
          shardColor="#896ABD"
          accentColor="#E04F33"
          placement="full"
          material="glass"
          markers="plus"
          count={450}
          depthOfField={0.6}
          vignette={0.3}
          lightMode={theme === 'light'}
          speed={0.75}
          glow={0.35}
          grain={0.04}
        />
      </div>
      <BackgroundBeams className="z-[1] opacity-75" />

      {/* Mobile-friendly Compact Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between gap-3">
        <JKLULogo size="xs" className="sm:hidden shrink-0" />
        <JKLULogo size="sm" className="hidden sm:block shrink-0" />
        <ThemeSwitcher />
      </header>

      {/* Main Centered Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:p-6">
        <div className="w-full max-w-md sm:max-w-lg">
          <SpotlightCard
            spotlightColor="rgba(224, 79, 51, 0.16)"
            className="p-5 sm:p-8 backdrop-blur-xl bg-white/90 dark:bg-[#121216]/90 shadow-2xl"
          >
            <div className="text-center space-y-4 sm:space-y-5">
              <ExclusiveVaultGraphic />

              <div className="flex justify-center">
                <Badge variant="vermilion" className="px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E04F33] animate-pulse" />
                  <span>SCHEDULED MAINTENANCE</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-light tracking-tight leading-tight">
                Learn JKLU is{' '}
                <span className="font-serif-editorial italic font-normal text-[#E04F33]">
                  upgrading
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#94938E] leading-relaxed max-w-md mx-auto">
                {message ||
                  'We are performing scheduled maintenance on Learn JKLU. All papers and accounts are safe — the archive will be back online shortly.'}
              </p>

              {/* Status Chips (wrap cleanly on mobile) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] text-[#5C5B57] dark:text-[#94938E]">
                  <Lock className="w-3 h-3 text-[#E04F33]" />
                  <span>PORTAL LOCKED</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] text-[#5C5B57] dark:text-[#94938E]">
                  <Sparkles className="w-3 h-3 text-[#4F46E5]" />
                  <span>PAPERS SAFE</span>
                </span>
              </div>

              {/* Clean Centered Contact Footer */}
              <div className="pt-4 border-t border-[#E5E2DC] dark:border-[#232329] flex items-center justify-center">
                <a
                  href="mailto:counciloftechnicalaffairs@jklu.edu.in"
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-[#5C5B57] dark:text-[#94938E] hover:text-[#E04F33] transition-colors truncate max-w-full"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">counciloftechnicalaffairs@jklu.edu.in</span>
                </a>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </main>
    </div>
  );
};

export default MaintenanceMode;
