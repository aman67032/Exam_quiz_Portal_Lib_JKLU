import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, User, LogOut, GraduationCap, Upload, Download, LogIn, UserPlus, Code, Sparkles } from 'lucide-react';
import { API } from '../utils/api';
import FilePreviewModal from './FilePreviewModal';
import GooeyNav from './Gooeyeffect';
import Squares from './square_bg';
import PaperCard from './PaperCard';
import Toast from './Toast';
import logoImg from '../assets/logo (2).png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { lazy, Suspense } from 'react';
import { buildUploadUrl } from '../utils/uploads';
import MathPhysicsBackground from './MathPhysicsBackground';
import Loader from './Loader';
import JKLULogo from './JKLULogo';
import Footer from './Footer';

// Lazy load heavy background component
const ColorBends = lazy(() => import('./color_band_bg'));


interface Paper {
  id: number;
  title: string;
  description?: string;
  paper_type: string;
  year?: number;
  semester?: string;
  department?: string;
  file_name: string;
  file_path?: string;
  course_code?: string;
  course_name?: string;
  uploader_name?: string;
  uploaded_at: string;
  status?: string;
}

const PublicHome: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'title' | 'description' | 'course' | 'uploader'>('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filters
  const [filters, setFilters] = useState<{
    course_code: string;
    paper_type: string;
    year: string;
    semester: string;
  }>({
    course_code: '',
    paper_type: '',
    year: '',
    semester: '',
  });

  // Courses for dropdown
  const [courses, setCourses] = useState<Array<{ id: number; code: string; name: string; description?: string }>>([]);

  // Preview Modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    filePath: '',
    paperId: 0
  });

  // Toast Notification
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
  }, []);

  const paperTypes = ['quiz', 'midterm', 'endterm', 'assignment', 'project'];
  const years = ['2025', '2024', '2023', '2022'];

  const fetchPublicPapers = useCallback(async () => {
    try {
      setLoading(true);
      // If user is logged in, fetch all papers (approved, pending, rejected)
      // If not logged in, fetch only approved papers (public)
      if (user) {
        const response = await API.getPapers({});
        const data = Array.isArray(response.data) ? response.data : [];
        setPapers(data);
        if (data.length === 0) {
          console.log('No papers found in database (or response was not an array)');
        }
      } else {
        const response = await API.getPublicPapers();
        const data = Array.isArray(response.data) ? response.data : [];
        setPapers(data);
        if (data.length === 0) {
          console.log('No approved papers found in database (or response was not an array)');
        }
      }
    } catch (error: any) {
      console.error('Error fetching papers:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });

      // More specific error messages
      let errorMessage = 'Failed to load papers. ';
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        errorMessage += 'Backend server is not responding. Please check if the backend is running.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found.';
      } else if (error.response?.status === 403) {
        errorMessage += 'Access denied.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += 'Please check your connection.';
      }

      showToast(errorMessage, 'error');
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPublicPapers();
  }, [fetchPublicPapers]);

  // Fetch courses from API - cache in sessionStorage to reduce API calls
  useEffect(() => {
    const fetchCourses = async () => {
      // Hardcoded sample data for UI testing
      const SAMPLE_COURSES = [
        { id: 101, code: 'CH001', name: 'Coding Hour - Python', description: 'Master Python with daily challenges ranging from basic syntax to advanced algorithms.' },
        { id: 102, code: 'CH002', name: 'Coding Hour - DAA', description: 'Deep dive into Design and Analysis of Algorithms. Optimize your logic.' },
      ];

      try {
        // Check sessionStorage cache first (5 minute TTL)
        const cached = sessionStorage.getItem('courses_cache');
        const cacheTime = sessionStorage.getItem('courses_cache_time');
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 5 * 60 * 1000) { // 5 minutes
            const cachedCourses = JSON.parse(cached);
            // Ensure sample courses are present even in cache
            const hasSample = cachedCourses.some((c: any) => c.code === 'CH001');
            setCourses(hasSample ? cachedCourses : [...cachedCourses, ...SAMPLE_COURSES]);
            return;
          }
        }

        const response = await API.getCourses();
        const coursesData = Array.isArray(response.data) ? response.data : [];
        // Merge real data with sample data
        const mergedCourses = [...coursesData, ...SAMPLE_COURSES];

        setCourses(mergedCourses);
        // Cache in sessionStorage
        sessionStorage.setItem('courses_cache', JSON.stringify(mergedCourses));
        sessionStorage.setItem('courses_cache_time', Date.now().toString());
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to sample data on error
        setCourses(SAMPLE_COURSES);
      }
    };
    fetchCourses();
  }, []);

  // Memoize filtered papers to prevent unnecessary recalculations
  const memoizedFilteredPapers = useMemo(() => {
    // For logged-in users: show all papers they have access to (approved + their own papers)
    // For non-logged-in users: only show approved papers
    // Always filter for approved papers on the public home page, regardless of login status
    // User's own rejected/pending papers should only be visible on the Dashboard
    let filtered = papers.filter((paper) => paper.status?.toLowerCase() === 'approved');

    // Search filter - use debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((paper) => {
        if (searchField === 'title') return paper.title.toLowerCase().includes(query);
        if (searchField === 'description') return (paper.description || '').toLowerCase().includes(query);
        if (searchField === 'course') return (paper.course_code || '').toLowerCase().includes(query);
        if (searchField === 'uploader') return (paper.uploader_name || '').toLowerCase().includes(query);
        return (
          paper.title.toLowerCase().includes(query) ||
          (paper.description || '').toLowerCase().includes(query) ||
          (paper.course_code || '').toLowerCase().includes(query) ||
          (paper.uploader_name || '').toLowerCase().includes(query)
        );
      });
    }

    // Course filter - support partial matching
    if (filters.course_code) {
      filtered = filtered.filter((paper) =>
        (paper.course_code || '').toUpperCase().includes(filters.course_code.toUpperCase())
      );
    }

    // Paper type filter
    if (filters.paper_type) {
      filtered = filtered.filter((paper) => paper.paper_type === filters.paper_type);
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter((paper) => paper.year?.toString() === filters.year);
    }

    // Semester filter
    if (filters.semester) {
      filtered = filtered.filter(
        (paper) => (paper.semester || '').toLowerCase() === filters.semester.toLowerCase()
      );
    }

    return filtered;
  }, [papers, debouncedSearchQuery, searchField, filters, user]);

  useEffect(() => {
    setFilteredPapers(memoizedFilteredPapers);
  }, [memoizedFilteredPapers]);

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

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePreview = useCallback((paperId: number, fileName: string, filePath: string) => {
    setPreviewModal({
      isOpen: true,
      fileName,
      filePath,
      paperId
    });
  }, []);

  const profilePhoto = useMemo(() => {
    const direct = localStorage.getItem('profile.photo');
    if (direct) return direct;
    const legacy = localStorage.getItem('profile.photo.path');
    return legacy ? buildUploadUrl(legacy) : '';
  }, []);

  const handleDownload = useCallback(async (paperId: number, fileName: string) => {
    try {
      const response = await API.downloadPaper(paperId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Paper downloaded successfully!', 'success');
    } catch (error: any) {
      console.error('Download error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to download paper. Please try again.';
      showToast(errorMessage, 'error');
    }
  }, [showToast]);

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
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 via-yellow-50 to-amber-100 dark:from-indigo-950 dark:via-purple-950 dark:via-pink-950 dark:to-rose-950">
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
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/30 dark:from-gray-900/75 dark:via-gray-900/60 dark:to-gray-900/85" />
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
        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-md sm:backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/40 shadow-lg"
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
                  Access daily coding challenges and their detailed solutions. Open to everyone!
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
                  className="cursor-pointer group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 p-6 shadow-lg border border-white/30 dark:border-gray-700/50 hover:shadow-purple-500/20 transition-all duration-300"
                >                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl -z-0" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl mb-4 w-fit group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                      <span className="text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400">→</span>
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

        {/* Search and Documents Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-4 md:px-6 lg:px-8 pb-8 sm:pb-12 md:pb-20">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg sm:backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8 md:mb-12"
          >
            <div className="space-y-4 sm:space-y-6">
              {/* Gooey Search Field Tabs */}
              <div>
                <label className="block text-sm sm:text-sm font-semibold text-amber-900 sm:text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  <Search className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Search In
                </label>
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <div className="flex flex-wrap gap-2 min-w-max sm:min-w-0">
                    <GooeyNav
                      items={[
                        { label: 'All', href: '#' },
                        { label: 'Title', href: '#' },
                        { label: 'Description', href: '#' },
                        { label: 'Course', href: '#' },
                        { label: 'Uploader', href: '#' }
                      ]}
                      initialActiveIndex={0}
                      onChange={(idx) => {
                        const map = ['all', 'title', 'description', 'course', 'uploader'] as const;
                        setSearchField(map[idx]);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-sm sm:text-sm font-semibold text-amber-900 sm:text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  <Search className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Search Papers
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search by ${searchField === 'all' ? 'title, description, course, or uploader' : searchField}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2.5 md:py-3 pr-10 sm:pr-12 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 touch-manipulation min-h-[44px] sm:min-h-0"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                      aria-label="Clear search"
                      type="button"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                    <label className="text-sm sm:text-sm font-semibold text-amber-900 sm:text-gray-700 dark:text-gray-300">Filters</label>
                  </div>
                  {/* Clear Filters Button - Mobile Friendly */}
                  {(filters.year || filters.semester || filters.course_code || filters.paper_type) && (
                    <button
                      onClick={() => {
                        setFilters({
                          course_code: '',
                          paper_type: '',
                          year: '',
                          semester: '',
                        });
                      }}
                      className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-3 py-2 sm:px-2 sm:py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors touch-manipulation min-h-[36px] sm:min-h-0 flex items-center justify-center"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Gooey Paper Type Tabs */}
                <div className="mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Paper Type
                  </label>
                  <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                    <div className="flex flex-wrap gap-2 min-w-max sm:min-w-0">
                      <GooeyNav
                        items={[{ label: 'All Types', href: '#' }, ...paperTypes.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), href: '#' }))]}
                        initialActiveIndex={0}
                        onChange={(idx, item) => {
                          const val = idx === 0 ? '' : item.label.toLowerCase();
                          handleFilterChange('paper_type', val);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Grid - Optimized for Mobile */}
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 sm:gap-4">
                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-amber-900 sm:text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                      Year
                    </label>
                    <select
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-2.5 md:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <option value="">All Years</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Filter */}
                  <div>
                    <label className="block text-sm font-medium text-amber-900 sm:text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                      Semester
                    </label>
                    <select
                      value={filters.semester}
                      onChange={(e) => handleFilterChange('semester', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-2.5 md:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <option value="">All Semesters</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>
                  </div>

                  {/* Course Code Filter - as a regular select so all options are visible */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-amber-900 sm:text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                      Course Code
                    </label>
                    <select
                      value={filters.course_code}
                      onChange={(e) => handleFilterChange('course_code', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-2.5 md:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <option value="">All Courses</option>
                      {[...courses]
                        .sort((a, b) => a.code.localeCompare(b.code))
                        .map((course) => (
                          <option key={course.id} value={course.code}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Papers Grid */}
          <div className="mb-6 sm:mb-8">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-3xl font-bold text-amber-900 sm:text-gray-900 dark:text-white mb-2 flex items-center gap-2 sm:gap-3"
            >
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span>Browse Documents</span>
            </motion.h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Explore our collection of verified academic papers and study materials
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12 sm:py-20">
              <Loader />
            </div>
          ) : filteredPapers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="backdrop-blur-lg sm:backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-8 sm:p-12 md:p-16 text-center"
            >
              <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4 sm:mb-6" />
              <p className="text-2xl sm:text-2xl font-semibold text-amber-900 sm:text-gray-700 dark:text-gray-300 mb-2">No papers found</p>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">Try adjusting your search or filter criteria</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPapers.map((paper, index) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  index={index}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}

          {/* Results Summary */}
          {!loading && filteredPapers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 sm:mt-10 text-center backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-xl sm:rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-lg py-4 sm:py-6 px-4 sm:px-8"
            >
              <p className="text-base sm:text-base text-amber-900 sm:text-gray-700 dark:text-gray-300">
                Showing <span className="font-bold text-amber-700 sm:text-indigo-600 dark:text-indigo-400">{filteredPapers.length}</span> of{' '}
                <span className="font-bold text-amber-900 sm:text-gray-900 dark:text-white">{papers.length}</span> {user ? 'available' : 'approved'} papers
              </p>
            </motion.div>
          )}
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
