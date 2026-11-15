import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import {
  ArrowUpRight,
  BookOpen,
  FileCheck2,
  Search,
  Layers,
} from 'lucide-react';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import JKLULogo from '@/components/layout/JKLULogo';
import Footer from '@/components/layout/Footer';
import HeroBackgroundAnimation from '@/components/layout/HeroBackgroundAnimation';
import AeroShards from '@/components/layout/AeroShards';
import { API } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import techAffairsLogo from '@/assets/technical-affairs-logo.png';
import jkluCampusHeroImg from '@/assets/generated/jklu_campus_hero.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);
  const papersCountRef = useRef<HTMLDivElement>(null);
  const coursesCountRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<{
    courses: number;
    approvedPapers: number;
    programmes: number;
  }>({
    courses: 306,
    approvedPapers: 654,
    programmes: 8,
  });

  useEffect(() => {
    API.getSystemMetrics()
      .then((res) => {
        if (res.data?.counts) {
          setMetrics({
            courses: res.data.counts.courses || 306,
            approvedPapers: res.data.counts.approvedPapers || 654,
            programmes: res.data.counts.programmes || 8,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    anime.timeline({ easing: 'easeOutExpo' })
      .add({
        targets: '.anim-hero-line',
        translateY: [28, 0],
        opacity: [0, 1],
        duration: 900,
        delay: anime.stagger(90),
      })
      .add(
        {
          targets: '.anim-hero-card',
          translateY: [24, 0],
          opacity: [0, 1],
          duration: 800,
          delay: anime.stagger(110),
        },
        '-=500'
      );

    if (svgPathRef.current) {
      anime({
        targets: svgPathRef.current,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 1800,
        delay: 300,
      });
    }

    // Subtle continuous float on the hero showcase card (desktop & mobile)
    const floatAnim = anime({
      targets: '.anim-hero-float',
      translateY: [-5, 5],
      duration: 3600,
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true,
    });

    return () => {
      floatAnim.pause();
    };
  }, []);

  // Animate hero stat counters when metrics update
  useEffect(() => {
    const obj = { papers: 0, courses: 0 };
    const counterAnim = anime({
      targets: obj,
      papers: metrics.approvedPapers,
      courses: metrics.courses,
      round: 1,
      duration: 1100,
      easing: 'easeOutExpo',
      update: () => {
        if (papersCountRef.current) {
          papersCountRef.current.textContent = obj.papers.toLocaleString();
        }
        if (coursesCountRef.current) {
          coursesCountRef.current.textContent = `${obj.courses}+`;
        }
      },
    });
    return () => counterAnim.pause();
  }, [metrics.approvedPapers, metrics.courses]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/home?focus=search');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] selection:bg-[#E04F33] selection:text-white overflow-x-hidden">
      {/* Top Navigation Bar — Mobile Optimized */}
      <header className="sticky top-0 z-40 border-b border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
          >
            <JKLULogo size="xs" className="sm:hidden shrink-0" />
            <JKLULogo size="sm" className="hidden sm:block shrink-0" />
            <img
              src={(techAffairsLogo as any)?.src || techAffairsLogo}
              alt="Council of Technical Affairs"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-md object-cover border border-[#E5E2DC] dark:border-[#232329] shrink-0"
            />
            <div className="h-5 w-[1px] bg-[#E5E2DC] dark:bg-[#232329] hidden sm:block" />
            <div className="min-w-0">
              <span className="font-semibold tracking-tight text-xs sm:text-base block leading-none truncate">
                Learn JKLU
              </span>
              <span className="text-[11px] font-mono-tabular text-[#5C5B57] dark:text-[#94938E] hidden sm:inline-block mt-0.5">
                Council of Technical Affairs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => navigate('/home?focus=search')}
              className="hidden md:flex items-center gap-3 px-3 py-1.5 text-xs text-[#5C5B57] dark:text-[#94938E] border border-[#E5E2DC] dark:border-[#232329] rounded-md hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] transition-colors bg-white/60 dark:bg-[#121216]/60"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search papers by code or subject...</span>
              <kbd className="font-mono-tabular text-[10px] px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329]">
                ⌘K
              </kbd>
            </button>

            <ThemeSwitcher />

            {user ? (
              <button
                onClick={() => navigate(user.is_admin || user.is_sub_admin || user.admin_role ? '/admin' : '/dashboard')}
                className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md hover:border-emerald-500 transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="sm:hidden">{user.name.split(' ')[0]}</span>
                <span className="hidden sm:inline">Signed in: {user.name.split(' ')[0]} · Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium border border-[#E5E2DC] dark:border-[#232329] rounded-md hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] transition-colors"
              >
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Student Login</span>
              </button>
            )}
            <button
              onClick={() => navigate('/home')}
              className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-md bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] hover:bg-[#E04F33] dark:hover:bg-[#E04F33] dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="sm:hidden">Papers</span>
              <span className="hidden sm:inline">Browse Papers</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 100svh / 100vh Full-Viewport Animated Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[calc(100svh-3.5rem)] sm:min-h-[calc(100vh-4rem)] w-full flex items-center border-b border-[#E5E2DC] dark:border-[#232329] overflow-hidden"
      >
        {/* Interactive WebGPU / Canvas-2D AeroShards + Blueprint Line Animation */}
        <div className="absolute inset-0 z-0 opacity-75 dark:opacity-90 pointer-events-none">
          <AeroShards
            shardColor="#896ABD"
            accentColor="#E04F33"
            placement="full"
            material="glass"
            markers="plus"
            count={700}
            depthOfField={0.65}
            vignette={0.25}
            lightMode={theme === 'light'}
            speed={0.9}
            glow={0.35}
            grain={0.04}
          />
        </div>
        <HeroBackgroundAnimation />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="anim-hero-line inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full border border-[#E5E2DC] dark:border-[#232329] bg-white/90 dark:bg-[#121216]/90 backdrop-blur-sm text-xs shadow-sm max-w-full">
                <span className="w-2 h-2 rounded-full bg-[#E04F33] animate-pulse shrink-0" />
                <span className="font-mono-tabular uppercase tracking-wider text-[10px] sm:text-[11px] text-[#5C5B57] dark:text-[#94938E] truncate">
                  JK LAKSHMIPAT UNIVERSITY · COUNCIL OF TECHNICAL AFFAIRS
                </span>
              </div>

              <h1 className="anim-hero-line text-[32px] sm:text-6xl lg:text-[64px] font-light tracking-tight leading-[1.08] sm:leading-[1.05]">
                Past question papers &amp;{' '}
                <span className="font-serif-editorial italic font-normal text-[#E04F33]">
                  exam prep
                </span>{' '}
                for every semester.
              </h1>

              <p className="anim-hero-line text-sm sm:text-lg text-[#5C5B57] dark:text-[#94938E] max-w-2xl leading-relaxed font-normal">
                Access{' '}
                <strong className="text-[#0A0A0C] dark:text-[#F5F4F0] font-medium">
                  {metrics.approvedPapers.toLocaleString()}+ verified Mid-Term &amp; End-Term question papers
                </strong>{' '}
                across{' '}
                <strong className="text-[#0A0A0C] dark:text-[#F5F4F0] font-medium">
                  B.Tech, BBA, BCA, M.Tech, MBA, and B.Des
                </strong>{' '}
                (2020–2026). Preview papers directly in your browser or download clean PDFs for offline exam preparation.
              </p>

              {/* Quick Search Bar Trigger */}
              <div className="anim-hero-line pt-1 sm:pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-xl">
                <button
                  onClick={() => navigate('/home?focus=search')}
                  className="flex-1 flex items-center justify-between px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-md bg-white/95 dark:bg-[#121216]/95 backdrop-blur-sm border border-[#0A0A0C]/20 dark:border-[#F5F4F0]/20 hover:border-[#E04F33] dark:hover:border-[#E04F33] transition-all group text-left shadow-sm min-w-0"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Search className="w-4 h-4 text-[#E04F33] shrink-0" />
                    <span className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#94938E] group-hover:text-[#0A0A0C] dark:group-hover:text-[#F5F4F0] transition-colors truncate">
                      Search by course code or subject (CS1102, Calculus)...
                    </span>
                  </div>
                  <span className="hidden sm:inline-block font-mono-tabular text-xs px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] shrink-0 ml-2">
                    ⌘K
                  </span>
                </button>

                <button
                  onClick={() => navigate('/home')}
                  className="w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-md bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] font-medium text-sm hover:bg-[#E04F33] dark:hover:bg-[#E04F33] dark:hover:text-white transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm active:scale-[0.99]"
                >
                  <span>Explore Papers</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Key University Portal Stats */}
              <div className="anim-hero-line pt-4 sm:pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 border-t border-[#E5E2DC] dark:border-[#232329]">
                <div>
                  <div ref={papersCountRef} className="font-mono-tabular text-xl sm:text-3xl font-semibold">
                    {metrics.approvedPapers.toLocaleString()}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#5C5B57] dark:text-[#94938E] mt-0.5">
                    Verified Exam Papers
                  </div>
                </div>
                <div>
                  <div ref={coursesCountRef} className="font-mono-tabular text-xl sm:text-3xl font-semibold">
                    {metrics.courses}+
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#5C5B57] dark:text-[#94938E] mt-0.5">
                    University Courses
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-xl sm:text-3xl font-semibold text-[#4F46E5] dark:text-[#6366F1]">
                    {metrics.programmes} Degrees
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#5C5B57] dark:text-[#94938E] mt-0.5">
                    IET · IM · ID · PhD
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-xl sm:text-3xl font-semibold text-[#E04F33]">
                    2020–2026
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#5C5B57] dark:text-[#94938E] mt-0.5">
                    Verified Exam Sessions
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: JKLU Campus Exam Holograms Hero Showcase */}
            <div className="lg:col-span-5 anim-hero-card">
              <div className="anim-hero-float relative rounded-xl overflow-hidden border border-[#E5E2DC] dark:border-[#232329] bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md p-2 sm:p-3 shadow-lg group">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#FAF9F6] dark:bg-[#0A0A0C]">
                  <img
                    src={(jkluCampusHeroImg as any)?.src || jkluCampusHeroImg}
                    alt="JKLU Campus Exam Portal Showcase"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="pt-2.5 sm:pt-3 px-1 flex items-center justify-between text-[10px] sm:text-xs text-[#5C5B57] dark:text-[#94938E] font-mono-tabular">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                    <span>JKLU EXAM ARCHIVE · {metrics.approvedPapers} PAPERS (2020–2026)</span>
                  </div>
                  <span className="text-[#0A0A0C] dark:text-[#F5F4F0] font-medium">
                    B.TECH · BBA · BCA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Below Fold */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-14 sm:py-20 space-y-16">
        {/* Section 1: Programme & Semester Quick-Jump Grid */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E2DC] dark:border-[#232329] pb-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-wider text-[#E04F33]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E04F33]" />
                <span>QUICK-JUMP DIRECTORY</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-light tracking-tight">
                Select your{' '}
                <span className="font-serif-editorial italic font-normal text-[#E04F33]">
                  programme
                </span>{' '}
                &amp; semester
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#94938E] max-w-md">
              Jump directly to verified Mid-Sem and End-Sem question papers filtered for your degree and current semester.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                dept: 'B.TECH',
                school: 'INSTITUTE OF ENGINEERING & TECHNOLOGY · 352 PAPERS',
                title: 'B.Tech Engineering',
                desc: '352 verified CSE, AI & Data Science, ECE, Mechanical & Core Engineering papers (2020–2026, Sem 1–8).',
                accent: '#E04F33',
                semesters: ['1', '2', '3', '4', '5', '6', '7', '8'],
                popular: ['CS1135', 'AS1207', 'EE1125', 'CS1108'],
              },
              {
                dept: 'BBA',
                school: 'INSTITUTE OF MANAGEMENT · 183 PAPERS',
                title: 'BBA & MBA Management',
                desc: '183 verified BBA & MBA papers (2020–2026) across Financial Accounting, Business Law, Marketing & Risk Management.',
                accent: '#4F46E5',
                semesters: ['1', '2', '3', '4', '5', '6'],
                popular: ['FA1101', 'FA1108', 'EP1101', 'LS1110'],
              },
              {
                dept: 'BCA',
                school: 'COMPUTING, M.TECH & DESIGN · 119 PAPERS',
                title: 'BCA, M.Tech & B.Des',
                desc: '76 BCA, 22 M.Tech, 15 Design & 6 PhD papers (2020–2026) across Algorithms, Systems, and Design Studio.',
                accent: '#15803D',
                semesters: ['1', '2', '3', '4', '5', '6'],
                popular: ['AS1106', 'CS1116', 'CS1105', 'CC1105'],
              },
            ].map((prog) => (
              <div
                key={prog.dept}
                className="editorial-card rounded-xl p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#5C5B57] dark:text-[#94938E]">
                      {prog.school}
                    </span>
                    <button
                      onClick={() => navigate(`/home?dept=${encodeURIComponent(prog.dept)}`)}
                      className="font-mono-tabular text-xs font-semibold px-2.5 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: prog.accent }}
                    >
                      {prog.dept}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">{prog.title}</h3>
                    <p className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#94938E] mt-1 leading-relaxed">
                      {prog.desc}
                    </p>
                  </div>

                  {/* Semester Quick-Jump Pills */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#5C5B57] dark:text-[#94938E]">
                      Select Semester:
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {prog.semesters.map((sem) => (
                        <button
                          key={sem}
                          onClick={() =>
                            navigate(
                              `/home?dept=${encodeURIComponent(prog.dept)}&sem=${encodeURIComponent(sem)}`
                            )
                          }
                          className="py-2 px-2.5 rounded-md border border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6] dark:bg-[#0A0A0C] hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] hover:bg-[#0A0A0C] hover:text-[#FAF9F6] dark:hover:bg-[#F5F4F0] dark:hover:text-[#0A0A0C] transition-all font-mono-tabular text-xs font-medium text-center"
                        >
                          Sem {sem}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Popular Course Shortcuts + Open Programme Button */}
                <div className="pt-4 border-t border-[#E5E2DC] dark:border-[#232329] space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono-tabular text-[#5C5B57] dark:text-[#94938E] mr-1">
                      Popular:
                    </span>
                    {prog.popular.map((code) => (
                      <button
                        key={code}
                        onClick={() => navigate(`/home?q=${encodeURIComponent(code)}`)}
                        className="font-mono-tabular text-[11px] px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329] hover:border-[#E04F33] text-[#5C5B57] dark:text-[#94938E] hover:text-[#E04F33] transition-colors"
                      >
                        {code}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/home?dept=${encodeURIComponent(prog.dept)}`)}
                    className="w-full py-2.5 px-3.5 rounded-md border border-[#E5E2DC] dark:border-[#232329] hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] flex items-center justify-between text-xs font-medium transition-colors group"
                  >
                    <span>View All {prog.dept} Question Papers</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Portal Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#E5E2DC] dark:border-[#232329] pt-12">
          {/* Card 1: Past Paper Archive */}
          <div
            onClick={() => navigate('/home')}
            className="anim-hero-card editorial-card rounded-lg p-6 cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-xs uppercase px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329]">
                  01 / QUESTION BANK
                </span>
                <BookOpen className="w-4 h-4 text-[#5C5B57] group-hover:text-[#E04F33] transition-colors" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Past Exam Paper Archive
              </h2>
              <p className="text-sm text-[#5C5B57] dark:text-[#94938E] leading-relaxed">
                Filter papers across B.Tech, BBA, and BCA by semester, academic year, and exam type (Mid-Term, End-Term, Quiz). Preview PDFs instantly or download for offline revision.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#E5E2DC] dark:border-[#232329] flex items-center justify-between text-xs font-medium">
              <span>Browse {metrics.approvedPapers}+ Question Papers</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Course & Semester Filtering */}
          <div
            onClick={() => navigate('/home?focus=search')}
            className="anim-hero-card editorial-card rounded-lg p-6 cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-xs uppercase px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329]">
                  02 / COURSE INDEX
                </span>
                <FileCheck2 className="w-4 h-4 text-[#5C5B57] group-hover:text-[#4F46E5] transition-colors" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Course-Wise &amp; Semester Lookup
              </h2>
              <p className="text-sm text-[#5C5B57] dark:text-[#94938E] leading-relaxed">
                Search across {metrics.courses}+ JKLU courses by course code (e.g., CS1102, MA1101) or subject title, and compare Mid-Sem and End-Sem papers across years.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#E5E2DC] dark:border-[#232329] flex items-center justify-between text-xs font-medium text-[#4F46E5] dark:text-[#6366F1]">
              <span>Search {metrics.courses} University Courses</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Contribute Papers */}
          <div
            onClick={() => navigate('/login')}
            className="anim-hero-card editorial-card rounded-lg p-6 cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-xs uppercase px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-[#232329]">
                  03 / CONTRIBUTE
                </span>
                <Layers className="w-4 h-4 text-[#5C5B57] group-hover:text-[#E04F33] transition-colors" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                Submit Question Papers
              </h2>
              <p className="text-sm text-[#5C5B57] dark:text-[#94938E] leading-relaxed">
                Help juniors and classmates prepare better by uploading recent Mid-Term or End-Term papers from your courses.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#E5E2DC] dark:border-[#232329] flex items-center justify-between text-xs font-medium">
              <span>Sign In to Upload Papers</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
