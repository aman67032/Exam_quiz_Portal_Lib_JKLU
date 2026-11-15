import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, User } from 'lucide-react';
import JKLULogo from '@/components/layout/JKLULogo';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';

interface StudentNavbarProps {
  active: 'dashboard' | 'profile';
  subtitle: string;
}

const StudentNavbar: React.FC<StudentNavbarProps> = ({ active, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItemClass = (isActive: boolean) =>
    `inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C]'
        : 'border border-[#E5E2DC] dark:border-[#232329] bg-white/80 dark:bg-[#121216]/80 text-[#0A0A0C] dark:text-[#F5F4F0] hover:border-[#896ABD]'
    }`;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FAF9F6]/85 dark:bg-[#0A0A0C]/85 border-b border-[#E5E2DC] dark:border-[#232329]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <JKLULogo size="sm" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-[#0A0A0C] dark:text-[#F5F4F0] truncate">
              Learn JKLU
            </h1>
            <p className="text-[11px] font-mono-tabular text-[#5C5B57] dark:text-[#94938E] truncate">
              {subtitle}
              {user?.name ? ` · ${user.name.split(' ')[0]}` : ''}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Link to="/home" className={navItemClass(false)}>
            <BookOpen className="w-3.5 h-3.5" />
            <span>Papers</span>
          </Link>
          <Link to="/dashboard" className={navItemClass(active === 'dashboard')}>
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/profile" className={navItemClass(active === 'profile')}>
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </Link>
          <ThemeSwitcher />
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E5E2DC] dark:border-[#232329] bg-white/80 dark:bg-[#121216]/80 text-xs font-medium text-[#5C5B57] dark:text-[#94938E] hover:text-[#E04F33] hover:border-[#E04F33]/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default StudentNavbar;
