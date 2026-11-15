import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import JKLULogo from '@/components/layout/JKLULogo';
import RobotCheck, { type CaptchaPayload } from '@/components/auth/RobotCheck';
import CrystalizedBall from '@/components/layout/CrystalizedBall';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    anime({
      targets: '.auth-editorial-panel',
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutExpo',
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!captcha) {
      setError('Please complete the "I am not a robot" verification.');
      return;
    }
    setLoading(true);

    try {
      const user = await login(email.trim(), password, captcha);
      if (user.is_admin) {
        navigate('/admin');
      } else if (user.admin_role === 'coding_ta') {
        navigate('/admin/coding-hour');
      } else if (user.is_sub_admin) {
        navigate('/admin/contests');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setCaptchaResetKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] px-4 py-6 overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CrystalizedBall
          preset="plasma"
          color="#F25BD0"
          theme={theme === 'dark' ? 'dark' : 'light'}
          size={0.7}
          crackle={0.85}
          fill={0.5}
          interactive
          hoverStrength={0.7}
          strands={6}
          flares={0.65}
          glow={0.9}
          sparks={0.6}
          particleCount={15000}
          motion="rise"
          particleShape="square"
          depth={0.6}
          sway={0.5}
          twinkle={0.5}
          haze={0.7}
          dustSpeed={1}
          speed={1}
          intro
          paused={false}
        />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <JKLULogo size="sm" />
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E] hover:text-[#0A0A0C] dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Papers</span>
          </button>
        </div>
        <ThemeSwitcher />
      </div>

      <div className="relative z-10 auth-editorial-panel max-w-md w-full mx-auto backdrop-blur-md bg-white/90 dark:bg-[#111117]/85 border border-[#E5E2DC] dark:border-[#232329] shadow-xl rounded-lg p-5 sm:p-8 space-y-6">
        <div className="space-y-2">
          <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#E04F33]">
            JK LAKSHMIPAT UNIVERSITY · STUDENT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Sign in to Learn JKLU
          </h1>
          <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
            Use your university account to upload past question papers or manage your profile.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border border-[#E04F33]/40 bg-[#E04F33]/10 text-xs text-[#E04F33]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
              University Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5C5B57] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@jklu.edu.in"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5C5B57] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5B57]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <RobotCheck onChange={setCaptcha} resetKey={captchaResetKey} />

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-sm py-3 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-[#E5E2DC] dark:border-[#232329]">
          <p className="text-center text-xs text-[#5C5B57] dark:text-[#94938E]">
            New student?{' '}
            <Link to="/register" className="text-[#0A0A0C] dark:text-white font-medium underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">
        JK LAKSHMIPAT UNIVERSITY · LEARN JKLU
      </div>
    </div>
  );
};

export default Login;
