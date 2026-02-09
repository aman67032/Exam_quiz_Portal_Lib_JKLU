import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, User, LogOut, GraduationCap, Upload, Download, LogIn, UserPlus, Code, Sparkles, ArrowLeft, FolderOpen, Eye } from 'lucide-react';
import { API } from '../utils/api';
import FilePreviewModal from './FilePreviewModal';
import Squares from './square_bg';
import logoImg from '../assets/logo (2).png';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lazy, Suspense } from 'react';
import { buildUploadUrl } from '../utils/uploads';
import MathPhysicsBackground from './MathPhysicsBackground';
import JKLULogo from './JKLULogo';
import Footer from './Footer';

// Lazy load heavy background component
const ColorBends = lazy(() => import('./color_band_bg'));


const PublicHome: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  // Courses for dropdown
  const [courses, setCourses] = useState<Array<{ id: number; code: string; name: string; description?: string }>>([]);

  // Papers for folder display
  interface Paper {
    id: number;
    title: string;
    course_code: string;
    course_name: string;
    paper_type: string;
    year: number;
    semester: string;
    file_name: string;
    file_path: string;
  }
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAPERS_PER_PAGE = 20;

  // Preview Modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    filePath: '',
    paperId: 0
  });



  // Fetch courses from API - cache in sessionStorage to reduce API calls
  // Fetch courses from API - cache in sessionStorage to reduce API calls
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Check sessionStorage cache first (5 minute TTL)
        const cached = sessionStorage.getItem('courses_cache');
        const cacheTime = sessionStorage.getItem('courses_cache_time');
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 5 * 60 * 1000) { // 5 minutes
            setCourses(JSON.parse(cached));
            return;
          }
        }

        const response = await API.getCourses();
        const coursesData = Array.isArray(response.data) ? response.data : [];

        setCourses(coursesData);
        // Cache in sessionStorage
        sessionStorage.setItem('courses_cache', JSON.stringify(coursesData));
        sessionStorage.setItem('courses_cache_time', Date.now().toString());
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to empty array on error
        setCourses([]);
      }
    };
    fetchCourses();
  }, []);

  // Fetch papers from API
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoadingPapers(true);
        const response = await API.getPublicPapers();
        setPapers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching papers:', error);
        setPapers([]);
      } finally {
        setLoadingPapers(false);
      }
    };
    fetchPapers();
  }, []);

  // Filter papers by folder type
  const filteredPapers = useMemo(() => {
    if (selectedFolder === 'all') return papers;
    return papers.filter(p => p.paper_type === selectedFolder);
  }, [papers, selectedFolder]);

  // Paginated papers
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAPERS_PER_PAGE;
    return filteredPapers.slice(startIndex, startIndex + PAPERS_PER_PAGE);
  }, [filteredPapers, currentPage]);

  // Total pages
  const totalPages = Math.ceil(filteredPapers.length / PAPERS_PER_PAGE);

  // Get paper counts by type
  const paperCounts = useMemo(() => ({
    all: papers.length,
    midterm: papers.filter(p => p.paper_type === 'midterm').length,
    endterm: papers.filter(p => p.paper_type === 'endterm').length,
    other: papers.filter(p => p.paper_type === 'other').length,
  }), [papers]);


  // Responsive background tuning - dynamic hook that responds to window resize
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const profilePhoto = useMemo(() => {
    const direct = localStorage.getItem('profile.photo');
    if (direct) return direct;
    const legacy = localStorage.getItem('profile.photo.path');
    return legacy ? buildUploadUrl(legacy) : '';
  }, []);


  return (
    <div className="min-h-screen relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Custom Login Button Styles */}
      <style>{`
        @keyframes floating-points {
          0% { transform: translateY(0); }
          85% { opacity: 0; }
          100% { transform: translateY(-55px); opacity: 0; }
        }
        @keyframes dasharray {
          from { stroke-dasharray: 0 0 0 0; }
          to { stroke-dasharray: 68 68 0 0; }
        }
        @keyframes filled {
          to { fill: white; }
        }
        @keyframes wind {
          0% { background-position: 0% 50%; }
          50% { background-position: 50% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes paper-slay-1 {
          0% { transform: rotate(10deg); }
          50% { transform: rotate(-5deg); }
          100% { transform: rotate(10deg); }
        }
        @keyframes paper-slay-2 {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes paper-slay-3 {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .signup-button {
          filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.2));
        }
        .signup-button:hover {
          background: linear-gradient(85deg, #fec195, #fcc196, #fabd92, #fac097, #fac39c);
          background-size: 200% 200%;
          animation: wind 2s ease-in-out infinite;
        }
        .signup-paper-icon-1 {
          filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.3));
        }
        .signup-button:hover .signup-paper-icon-1 {
          animation: paper-slay-1 3s cubic-bezier(0.52, 0, 0.58, 1) infinite;
        }
        .signup-paper-icon-2 {
          filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5));
        }
        .signup-button:hover .signup-paper-icon-2 {
          animation: paper-slay-2 3s cubic-bezier(0.52, 0, 0.58, 1) 1s infinite;
        }
        .signup-paper-icon-3 {
          filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5));
        }
        .signup-button:hover .signup-paper-icon-3 {
          animation: paper-slay-3 2s cubic-bezier(0.52, 0, 0.58, 1) 1s infinite;
        }
        .login-button-fold {
          background: radial-gradient(100% 75% at 55%, rgba(223, 113, 255, 0.8) 0%, rgba(223, 113, 255, 0) 100%);
          box-shadow: 0 0 3px black;
        }
        .login-button-fold::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 150%;
          height: 150%;
          transform: rotate(45deg) translateX(0%) translateY(-18px);
          background-color: #e8e8e8;
          pointer-events: none;
        }
        .login-button:hover .login-button-fold {
          margin-top: -1rem;
          margin-right: -1rem;
        }
        .login-button:hover .login-icon {
          fill: transparent;
          animation: dasharray 1s linear forwards, filled 0.1s linear forwards 0.95s;
        }
        .login-point {
          bottom: -10px;
          position: absolute;
          animation: floating-points infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #fff;
          border-radius: 9999px;
        }
        .login-point:nth-child(1) { left: 10%; opacity: 1; animation-duration: 2.35s; animation-delay: 0.2s; }
        .login-point:nth-child(2) { left: 30%; opacity: 0.7; animation-duration: 2.5s; animation-delay: 0.5s; }
        .login-point:nth-child(3) { left: 25%; opacity: 0.8; animation-duration: 2.2s; animation-delay: 0.1s; }
        .login-point:nth-child(4) { left: 44%; opacity: 0.6; animation-duration: 2.05s; }
        .login-point:nth-child(5) { left: 50%; opacity: 1; animation-duration: 1.9s; }
        .login-point:nth-child(6) { left: 75%; opacity: 0.5; animation-duration: 1.5s; animation-delay: 1.5s; }
        .login-point:nth-child(7) { left: 88%; opacity: 0.9; animation-duration: 2.2s; animation-delay: 0.2s; }
        .login-point:nth-child(8) { left: 58%; opacity: 0.8; animation-duration: 2.25s; animation-delay: 0.2s; }
        .login-point:nth-child(9) { left: 98%; opacity: 0.6; animation-duration: 2.6s; animation-delay: 0.1s; }
        .login-point:nth-child(10) { left: 65%; opacity: 1; animation-duration: 2.5s; animation-delay: 0.2s; }
      `}</style>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Mobile-optimized cool gradient background */}
        {isSmallScreen ? (
          <>
            {/* Mobile: Warm cream gradient - optimized for performance */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 via-pink-950 to-rose-950">
              {/* Static radial gradient overlay - no animation for better performance */}
              <div className="absolute inset-0 opacity-60" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 60%)',
                willChange: 'opacity'
              }} />
              {/* Static orbs - reduced blur and no animation for better performance */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute w-72 h-72 bg-amber-200/20 rounded-full blur-2xl"
                  style={{
                    top: '5%',
                    left: '5%',
                    willChange: 'transform',
                    transform: 'translate(15px, 20px)'
                  }}
                />
                <div
                  className="absolute w-56 h-56 bg-orange-200/15 rounded-full blur-2xl"
                  style={{
                    bottom: '15%',
                    right: '10%',
                    willChange: 'transform',
                    transform: 'translate(-12px, -17px)'
                  }}
                />
                <div
                  className="absolute w-64 h-64 bg-yellow-200/15 rounded-full blur-2xl"
                  style={{
                    top: '55%',
                    left: '45%',
                    willChange: 'transform',
                    transform: 'translate(-15px, 15px)'
                  }}
                />
              </div>
              {/* Subtle dot pattern overlay for texture - reduced opacity */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(120, 53, 15, 0.08) 1px, transparent 0)',
                  backgroundSize: '48px 48px'
                }} />
              </div>
            </div>
            {/* Mobile readability overlay - lighter for cream theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/75 dark:from-gray-900/75 dark:via-gray-900/60 dark:to-gray-900/85" />
          </>
        ) : (
          <>
            {/* Desktop: Full ColorBends WebGL background */}
            <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800" />}>
              <ColorBends
                colors={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4']}
                speed={0.15}
                frequency={1.2}
                warpStrength={1.2}
                mouseInfluence={0.8}
                parallax={0.6}
                transparent={true}
                scale={1.5}
              />
            </Suspense>
            {/* Subtle math/physics background */}
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <MathPhysicsBackground />
            </div>
            {/* Subtle square grid overlay */}
            {/* Light theme grid (darker lines on light bg) */}
            <div className="absolute inset-0 opacity-60 pointer-events-none dark:hidden">
              <Squares
                speed={0.6}
                squareSize={48}
                borderColor={'rgba(0,0,0,0.28)'}
                hoverFillColor={'rgba(0,0,0,0.10)'}
                direction="diagonal"
              />
            </div>
            {/* Dark theme grid (light lines on dark bg) */}
            <div className="hidden dark:block absolute inset-0 opacity-30 pointer-events-none">
              <Squares
                speed={0.6}
                squareSize={48}
                borderColor={'rgba(255,255,255,0.35)'}
                hoverFillColor={'rgba(255,255,255,0.12)'}
                direction="diagonal"
              />
            </div>
            {/* Theme-aware readability overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/0 to-white/15 dark:from-gray-900/60 dark:via-gray-900/40 dark:to-gray-900/70" />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-md sm:backdrop-blur-xl bg-gray-900/70 border-b border-gray-700/40 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              {/* Top row: brand left, JKLU logo right on mobile */}
              <div className="flex items-center justify-between gap-2 min-w-0 flex-shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                  {/* Desktop JKLU logo inline with brand */}
                  <div className="hidden sm:block">
                    <JKLULogo size="sm" className="opacity-90 hover:opacity-100" />
                  </div>
                  <img src={logoImg} alt="Paper Portal Logo" className="h-10 sm:h-16 w-auto object-contain flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-amber-900 sm:text-gray-900 dark:text-white truncate">Paper Portal</h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-amber-800 sm:text-gray-600 dark:text-gray-400">Academic Resource Hub</p>
                  </div>
                </div>
                {/* Mobile JKLU logo on far right */}
                <div className="sm:hidden flex-shrink-0">
                  <JKLULogo size="sm" className="opacity-90 hover:opacity-100" />
                </div>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5 sm:gap-2 md:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto sm:ml-4">
                {user ? (
                  <>
                    <Link
                      to={user.is_admin ? '/admin' : '/dashboard'}
                      className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-xs sm:text-sm shadow-lg whitespace-nowrap flex-shrink-0 min-h-[36px] sm:min-h-[40px] flex items-center justify-center touch-manipulation"
                    >
                      {user.is_admin ? 'Admin' : 'Dashboard'}
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/30 dark:border-gray-700/40 text-xs sm:text-sm font-semibold text-amber-900 sm:text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg transition-all min-w-0 flex-1 sm:flex-initial min-h-[36px] sm:min-h-[40px] touch-manipulation"
                    >
                      {profilePhoto ? (
                        <img src={profilePhoto} className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded-full object-cover flex-shrink-0" alt="Profile" />
                      ) : (
                        <div className="p-1 sm:p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex-shrink-0">
                          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                      )}
                      <span className="truncate text-xs sm:text-sm">{user.name}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 shadow-md transition-all whitespace-nowrap flex-shrink-0 min-h-[36px] sm:min-h-[40px] touch-manipulation"
                      type="button"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="login-button relative inline-flex items-center justify-center overflow-hidden transition-all duration-250 cursor-pointer rounded-lg border-none outline-none px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px] touch-manipulation active:scale-95"
                      style={{
                        background: 'radial-gradient(65.28% 65.28% at 50% 100%, rgba(223, 113, 255, 0.8) 0%, rgba(223, 113, 255, 0) 100%), linear-gradient(0deg, #7a5af8, #7a5af8)'
                      }}
                    >
                      <span
                        className="login-button-fold absolute top-0 right-0 h-4 w-4 z-10 rounded-tr-lg rounded-bl-sm"
                        style={{ transition: 'all 0.5s ease-in-out' }}
                      />
                      <div className="login-button-fold absolute inset-0 rounded-lg z-0" style={{
                        background: 'linear-gradient(177.95deg, rgba(255, 255, 255, 0.19) 0%, rgba(255, 255, 255, 0) 100%)',
                        margin: '1px'
                      }} />
                      <div className="absolute inset-0 rounded-lg z-0" style={{
                        background: 'radial-gradient(65.28% 65.28% at 50% 100%, rgba(223, 113, 255, 0.8) 0%, rgba(223, 113, 255, 0) 100%), linear-gradient(0deg, #7a5af8, #7a5af8)',
                        margin: '2px',
                        transition: 'all 0.5s ease-in-out'
                      }} />
                      <div className="overflow-hidden w-full h-full pointer-events-none absolute z-10">
                        {[...Array(10)].map((_, i) => (
                          <i key={i} className="login-point" />
                        ))}
                      </div>
                      <span className="relative z-20 gap-1.5 text-white inline-flex items-center justify-center text-xs sm:text-sm font-medium leading-normal">
                        <LogIn className="login-icon h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                        Login
                      </span>
                    </Link>
                    <Link
                      to="/register"
                      className="signup-button relative bg-amber-500 dark:bg-amber-600 border border-amber-400 dark:border-amber-500 text-gray-900 dark:text-white rounded-lg overflow-hidden px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-h-[36px] sm:min-h-[40px] flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation transition-all duration-300 cursor-pointer"
                    >
                      {/* Paper Icon 1 - Top Right */}
                      <div className="signup-paper-icon-1 absolute top-0 right-0 w-4 sm:w-5 h-auto z-10" style={{ transformOrigin: '0 0', transform: 'rotate(10deg)', transition: 'all 0.5s ease-in-out' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-800 dark:text-amber-900">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 12H16" stroke="white" strokeWidth="1" strokeLinecap="round" />
                          <path d="M8 16H16" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      </div>
                      {/* Paper Icon 2 - Left Side */}
                      <div className="signup-paper-icon-2 absolute top-0 left-3 sm:left-4 w-2 sm:w-3 h-auto z-10" style={{ transformOrigin: '50% 0', transform: 'rotate(10deg)', transition: 'all 1s ease-in-out' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-700 dark:text-amber-800">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {/* Paper Icon 3 - Far Left */}
                      <div className="signup-paper-icon-3 absolute top-0 left-0 w-3 sm:w-4 h-auto z-10" style={{ transformOrigin: '50% 0', transform: 'rotate(-5deg)', transition: 'all 1s ease-in-out' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-800 dark:text-amber-900">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 12H12" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      </div>
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-20" />
                      <span className="relative z-20">Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="relative py-6 sm:py-8 md:py-14 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="backdrop-blur-lg sm:backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-6 sm:p-8 md:p-12 lg:p-16"
            >
              <motion.div
                initial={{ scale: 0.9, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className="inline-flex items-center justify-center mb-4 sm:mb-6"
              >
                <motion.img
                  src={logoImg}
                  alt="Paper Portal"
                  className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto drop-shadow-xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ willChange: 'transform' }}
                />
              </motion.div>
              <motion.h1
                className="text-3xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-amber-900 sm:text-gray-900 dark:text-white mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-800 via-orange-700 to-amber-900 sm:from-indigo-600 sm:via-purple-600 sm:to-pink-600 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your Academic Resource Hub
              </motion.h1>
              <motion.p
                className="text-base sm:text-base md:text-lg lg:text-2xl text-amber-900 sm:text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2 font-medium sm:font-normal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Discover, share, and access a comprehensive collection of exam papers, assignments, and study materials.
                Built for students, by students.
              </motion.p>
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8"
                >
                  <Link
                    to="/login"
                    className="login-button relative inline-flex items-center justify-center overflow-hidden transition-all duration-250 cursor-pointer rounded-xl border-none outline-none px-6 sm:px-8 py-3 sm:py-3.5 min-h-[48px] sm:min-h-[52px] touch-manipulation active:scale-95"
                    style={{
                      background: 'radial-gradient(65.28% 65.28% at 50% 100%, rgba(223, 113, 255, 0.8) 0%, rgba(223, 113, 255, 0) 100%), linear-gradient(0deg, #7a5af8, #7a5af8)'
                    }}
                  >
                    <span
                      className="login-button-fold absolute top-0 right-0 h-4 w-4 z-10 rounded-tr-xl rounded-bl-sm"
                      style={{ transition: 'all 0.5s ease-in-out' }}
                    />
                    <div className="login-button-fold absolute inset-0 rounded-xl z-0" style={{
                      background: 'linear-gradient(177.95deg, rgba(255, 255, 255, 0.19) 0%, rgba(255, 255, 255, 0) 100%)',
                      margin: '1px'
                    }} />
                    <div className="absolute inset-0 rounded-xl z-0" style={{
                      background: 'radial-gradient(65.28% 65.28% at 50% 100%, rgba(223, 113, 255, 0.8) 0%, rgba(223, 113, 255, 0) 100%), linear-gradient(0deg, #7a5af8, #7a5af8)',
                      margin: '2px',
                      transition: 'all 0.5s ease-in-out'
                    }} />
                    <div className="overflow-hidden w-full h-full pointer-events-none absolute z-10">
                      {[...Array(10)].map((_, i) => (
                        <i key={i} className="login-point" />
                      ))}
                    </div>
                    <span className="relative z-20 gap-2 text-white inline-flex items-center justify-center text-sm sm:text-base font-semibold leading-normal">
                      <LogIn className="login-icon h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                      Login
                    </span>
                  </Link>
                  <Link
                    to="/register"
                    className="signup-button relative bg-amber-500 dark:bg-amber-600 border border-amber-400 dark:border-amber-500 text-gray-900 dark:text-white rounded-xl overflow-hidden px-6 sm:px-8 py-3 sm:py-3.5 font-bold text-sm sm:text-base whitespace-nowrap flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation transition-all duration-300 cursor-pointer"
                  >
                    {/* Paper Icon 1 - Top Right */}
                    <div className="signup-paper-icon-1 absolute top-0 right-0 w-5 sm:w-6 h-auto z-10" style={{ transformOrigin: '0 0', transform: 'rotate(10deg)', transition: 'all 0.5s ease-in-out' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-800 dark:text-amber-900">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 12H16" stroke="white" strokeWidth="1" strokeLinecap="round" />
                        <path d="M8 16H16" stroke="white" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                    {/* Paper Icon 2 - Left Side */}
                    <div className="signup-paper-icon-2 absolute top-0 left-6 sm:left-8 w-3 sm:w-4 h-auto z-10" style={{ transformOrigin: '50% 0', transform: 'rotate(10deg)', transition: 'all 1s ease-in-out' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-700 dark:text-amber-800">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {/* Paper Icon 3 - Far Left */}
                    <div className="signup-paper-icon-3 absolute top-0 left-0 w-4 sm:w-5 h-auto z-10" style={{ transformOrigin: '50% 0', transform: 'rotate(-5deg)', transition: 'all 1s ease-in-out' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-amber-800 dark:text-amber-900">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 12H12" stroke="white" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                    <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 relative z-20" />
                    <span className="relative z-20">Sign Up</span>
                  </Link>
                </motion.div>
              )}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mt-6 sm:mt-10">
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-2 sm:gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                  style={{ willChange: 'transform' }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    style={{ willChange: 'transform' }}
                  >
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  </motion.div>
                  <div className="text-left min-w-0">
                    <div className="font-bold text-base sm:text-base text-amber-900 sm:text-gray-900 dark:text-white">Verified Content</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Admin-reviewed papers</div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-2 sm:gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  </motion.div>
                  <div className="text-left min-w-0">
                    <div className="font-bold text-base sm:text-base text-amber-900 sm:text-gray-900 dark:text-white">Smart Search</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Find papers instantly</div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-2 sm:gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  </motion.div>
                  <div className="text-left min-w-0">
                    <div className="font-bold text-base sm:text-base text-amber-900 sm:text-gray-900 dark:text-white">Easy Upload</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Share your resources</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        {/* Coding Hour Section */}
        <section className="relative py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Announcement Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl backdrop-blur-sm flex items-start gap-4"
            >
              <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">New: Coding Hour Solutions Available!</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Access weekly coding challenges and their detailed solutions. Open to everyone!
                </p>
              </div>
            </motion.div>

            {/* Coding Hour Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(c => c.name.startsWith('Coding Hour')).map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/coding-hour/${course.id}`)}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 p-1 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
                >
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Inner Content Container */}
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-xl p-6 overflow-hidden">
                    {/* Decorative Background Blob */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors duration-500" />

                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="px-2 py-1 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                            Weekly
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-colors duration-300">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:translate-x-2 transition-transform duration-300">
                        <span>Start Challenge</span>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-amber-900 sm:text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
                How It Works
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
                Get started in three simple steps
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: '01',
                  title: 'Sign Up',
                  description: 'Create your account in seconds. Join thousands of students already using Paper Portal.',
                  icon: User,
                  color: 'from-indigo-500 to-purple-500',
                },
                {
                  step: '02',
                  title: 'Browse & Search',
                  description: 'Explore our vast collection of exam papers. Use smart filters to find exactly what you need.',
                  icon: Search,
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  step: '03',
                  title: 'Download & Study',
                  description: 'Access verified papers instantly. Download and start preparing for your exams today.',
                  icon: Download,
                  color: 'from-pink-500 to-rose-500',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="backdrop-blur-lg sm:backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-6 sm:p-8 relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${item.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
                  <div className="relative z-10">
                    <motion.div
                      className={`inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${item.color} mb-4 sm:mb-6`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-200 dark:text-gray-700 mb-3 sm:mb-4">{item.step}</div>
                    <h3 className="text-2xl sm:text-2xl font-bold text-amber-900 sm:text-gray-900 dark:text-white mb-2 sm:mb-3">{item.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Exam Papers Vault */}
        <div className="max-w-7xl mx-auto px-4 sm:px-4 md:px-6 lg:px-8 pb-8 sm:pb-12 md:pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="backdrop-blur-lg sm:backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-6 sm:p-8 md:p-12 overflow-hidden relative"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 mb-4 sm:mb-6">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Exam Papers Vault
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Browse {papers.length} verified exam papers</p>
            </div>

            {/* Folder Tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {[
                { key: 'all', label: 'All Papers', icon: FileText, color: 'from-gray-600 to-gray-700' },
                { key: 'midterm', label: 'Midterm', icon: FolderOpen, color: 'from-blue-500 to-indigo-600' },
                { key: 'endterm', label: 'Endterm', icon: FolderOpen, color: 'from-purple-500 to-pink-600' },
                { key: 'other', label: 'Other', icon: FolderOpen, color: 'from-amber-500 to-orange-600' },
              ].map((folder) => (
                <motion.button
                  key={folder.key}
                  onClick={() => { setSelectedFolder(folder.key); setCurrentPage(1); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${selectedFolder === folder.key
                    ? `bg-gradient-to-r ${folder.color} text-white shadow-lg`
                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50'
                    }`}
                >
                  <folder.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{folder.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedFolder === folder.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {paperCounts[folder.key as keyof typeof paperCounts]}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Papers Grid */}
            {loadingPapers ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No papers in this folder yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedPapers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03 }}
                    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer"
                    onClick={() => setPreviewModal({
                      isOpen: true,
                      fileName: paper.file_name,
                      filePath: paper.file_path,
                      paperId: paper.id
                    })}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${paper.paper_type === 'midterm' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        paper.paper_type === 'endterm' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{paper.course_code}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{paper.course_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paper.paper_type === 'midterm' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                            paper.paper_type === 'endterm' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            }`}>
                            {paper.paper_type}
                          </span>
                          <span className="text-gray-500 dark:text-gray-500 text-xs">{paper.year}</span>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-600/50"
                >
                  ←
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-600/50"
                >
                  →
                </button>

                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
          fileName={previewModal.fileName}
          filePath={previewModal.filePath}
          paperId={previewModal.paperId}
          token={localStorage.getItem('token') || ''}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicHome;
