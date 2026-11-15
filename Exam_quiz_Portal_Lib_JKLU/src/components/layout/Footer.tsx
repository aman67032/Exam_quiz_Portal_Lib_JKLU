import React from 'react';
import techAffairsLogo from '@/assets/technical-affairs-logo.png';
import JKLULogo from '@/components/layout/JKLULogo';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-40 bg-[#FAF9F6] dark:bg-[#0A0A0C] border-t border-[#E5E2DC] dark:border-[#232329] text-[#0A0A0C] dark:text-[#F5F4F0] mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Section - Official Logos (JKLU & Council of Technical Affairs) */}
          <div className="flex items-center gap-4 sm:gap-5">
            <JKLULogo size="md" className="opacity-95 hover:opacity-100 transition-opacity" />
            <div className="h-9 w-[1px] bg-[#E5E2DC] dark:bg-[#232329]" />
            <img
              src={(techAffairsLogo as any)?.src || techAffairsLogo}
              alt="Council of Technical Affairs Logo"
              className="h-11 sm:h-12 w-11 sm:w-12 rounded-lg object-cover border border-[#E5E2DC] dark:border-[#232329] shadow-sm"
            />
          </div>

          {/* Center Section - Council of Technical Affairs Leadership */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E04F33]" />
              <h3 className="text-xs sm:text-sm font-mono-tabular uppercase tracking-wider font-semibold text-[#0A0A0C] dark:text-[#F5F4F0]">
                Council of Technical Affairs · JKLU
              </h3>
            </div>
            <div className="text-xs sm:text-sm space-y-1">
              <p className="text-[#5C5B57] dark:text-[#94938E]">
                <span className="text-[#0A0A0C] dark:text-[#F5F4F0] font-semibold">
                  Aman Pratap Singh
                </span>{' '}
                — <span className="font-mono-tabular text-xs text-[#E04F33]">General Secretary</span>
              </p>
              <p className="text-[#5C5B57] dark:text-[#94938E]">
                <span className="text-[#0A0A0C] dark:text-[#F5F4F0] font-semibold">
                  Aditya Singh Nayal
                </span>{' '}
                — <span className="font-mono-tabular text-xs text-[#4F46E5] dark:text-[#6366F1]">Secretary</span>
              </p>
            </div>
          </div>

          {/* Right Section - Copyright */}
          <div className="text-xs text-[#5C5B57] dark:text-[#94938E] text-center lg:text-right font-mono-tabular space-y-1">
            <p className="text-[#0A0A0C] dark:text-[#F5F4F0] font-medium">
              © {new Date().getFullYear()} Learn JKLU · Past Question Paper Portal
            </p>
            <p>JK Lakshmipat University, Jaipur</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
