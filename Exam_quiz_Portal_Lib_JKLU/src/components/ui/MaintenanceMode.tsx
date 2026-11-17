import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck } from 'lucide-react';
import JKLULogo from '@/components/layout/JKLULogo';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import { BackgroundBeams } from '@/components/aceternity/background-beams';
import { Badge } from '@/components/ui/badge';

interface MaintenanceModeProps {
  message?: string;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ message }) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] overflow-hidden">
      <BackgroundBeams className="opacity-70" />

      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <JKLULogo size="sm" />
        <ThemeSwitcher />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full rounded-2xl border border-[#E5E2DC] dark:border-[#232329] bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md p-6 sm:p-10 text-center space-y-5 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#E04F33]/10 border border-[#E04F33]/25 flex items-center justify-center text-[#E04F33]">
            <Wrench className="w-6 h-6" />
          </div>

          <Badge variant="vermilion" className="mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E04F33] animate-pulse" />
            <span>SCHEDULED MAINTENANCE</span>
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-light tracking-tight">
            Learn JKLU is{' '}
            <span className="font-serif-editorial italic font-normal text-[#E04F33]">
              updating
            </span>
          </h1>

          <p className="text-sm text-[#5C5B57] dark:text-[#94938E] leading-relaxed">
            {message ||
              'We are performing scheduled maintenance on Learn JKLU. The archive will be back online shortly.'}
          </p>

          <div className="pt-4 border-t border-[#E5E2DC] dark:border-[#232329] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C5B57] dark:text-[#94938E]">
            <span>Need urgent access? counciloftechnicalaffairs@jklu.edu.in</span>
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] px-2.5 py-1 rounded-md border border-[#E5E2DC] dark:border-[#232329] hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MaintenanceMode;
