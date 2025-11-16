import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, User, LogOut, GraduationCap, Upload, Download } from 'lucide-react';
import { API } from '../utils/api';
import FilePreviewModal from './FilePreviewModal';
import GooeyNav from './Gooeyeffect';
import Squares from './square_bg';
import PaperCard from './PaperCard';
import Toast from './Toast';
import logoImg from '../assets/logo (2).png';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { lazy, Suspense } from 'react';
import { buildUploadUrl } from '../utils/uploads';
import MathPhysicsBackground from './MathPhysicsBackground';
import Loader from './Loader';

// Lazy load heavy background component
const ColorBends = lazy(() => import('./color_band_bg'));


interface Paper {
  id: number;
  title: string;
  description?: string;
  paper_type: string;
  year?: number;
  semester?: string;
  file_name: string;
  file_path?: string;
  course_code?: string;
  course_name?: string;
  uploader_name?: string;
  uploaded_at: string;
}

const PublicHome: React.FC = () => {
  const { user, logout } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'title' | 'description' | 'course' | 'uploader'>('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filters
  const [filters, setFilters] = useState({
    course_code: '',
    paper_type: '',
    year: ''
  });

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
      const response = await API.getPublicPapers();
      setPapers(response.data);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicPapers();
  }, [fetchPublicPapers]);

  const applyFilters = useCallback(() => {
    let filtered = papers;

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

    // Course filter
    if (filters.course_code) {
      filtered = filtered.filter((paper) => paper.course_code === filters.course_code);
    }

    // Paper type filter
    if (filters.paper_type) {
      filtered = filtered.filter((paper) => paper.paper_type === filters.paper_type);
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter((paper) => paper.year?.toString() === filters.year);
    }

    setFilteredPapers(filtered);
  }, [papers, debouncedSearchQuery, searchField, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Mobile-optimized cool gradient background */}
        {isSmallScreen ? (
          <>
            {/* Mobile: Vibrant animated gradient with floating orbs */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 via-pink-500 to-rose-500 dark:from-indigo-950 dark:via-purple-950 dark:via-pink-950 dark:to-rose-950">
              {/* Animated radial gradient overlay */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0%, transparent 50%)',
                  ]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Floating animated orbs for depth and movement */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute w-72 h-72 bg-white/20 rounded-full blur-3xl"
                  style={{ top: '5%', left: '5%' }}
                  animate={{
                    y: [0, 40, 0],
                    x: [0, 30, 0],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute w-56 h-56 bg-purple-300/30 rounded-full blur-3xl"
                  style={{ bottom: '15%', right: '10%' }}
                  animate={{
                    y: [0, -35, 0],
                    x: [0, -25, 0],
                    scale: [1, 1.4, 1],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.7
                  }}
                />
                <motion.div
                  className="absolute w-64 h-64 bg-pink-300/25 rounded-full blur-3xl"
                  style={{ top: '55%', left: '45%' }}
                  animate={{
                    y: [0, 30, 0],
                    x: [0, -30, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.2
                  }}
                />
                <motion.div
                  className="absolute w-48 h-48 bg-rose-300/20 rounded-full blur-3xl"
                  style={{ top: '75%', left: '20%' }}
                  animate={{
                    y: [0, -25, 0],
                    x: [0, 20, 0],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                />
              </div>
              {/* Subtle dot pattern overlay for texture */}
              <div className="absolute inset-0 opacity-20 dark:opacity-15">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
                  backgroundSize: '36px 36px'
                }} />
              </div>
            </div>
            {/* Mobile readability overlay - stronger for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/60 dark:from-gray-900/75 dark:via-gray-900/60 dark:to-gray-900/85" />
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
          className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/40 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink-0">
                <img src={logoImg} alt="Paper Portal Logo" className="h-10 sm:h-16 w-auto object-contain flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Paper Portal</h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-gray-400">Academic Resource Hub</p>
                </div>
              </div>
              <div className="flex items-center sm:justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                {user ? (
                  <>
                    <Link
                      to={user.is_admin ? '/admin' : '/dashboard'}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-xs sm:text-sm shadow-lg whitespace-nowrap flex-shrink-0"
                    >
                      {user.is_admin ? 'Admin' : 'Dashboard'}
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/30 dark:border-gray-700/40 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg transition-all min-w-0 flex-1 sm:flex-initial"
                    >
                      {profilePhoto ? (
                        <img src={profilePhoto} className="h-5 w-5 sm:h-7 sm:w-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="p-1 sm:p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex-shrink-0">
                          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                      )}
                      <span className="truncate text-xs sm:text-sm">{user.name}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 shadow-md transition-all whitespace-nowrap flex-shrink-0"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <motion.a
                      href="/login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-xs sm:text-sm shadow-lg whitespace-nowrap flex-1 sm:flex-initial text-center"
                    >
                      Student Login
                    </motion.a>
                    <motion.a
                      href="/admin-login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs sm:text-sm shadow-lg whitespace-nowrap flex-1 sm:flex-initial text-center"
                    >
                      Admin Login
                    </motion.a>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="relative py-8 sm:py-14 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-6 sm:p-8 md:p-12 lg:p-16"
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
                />
              </motion.div>
              <motion.h1 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your Academic Resource Hub
              </motion.h1>
              <motion.p 
                className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Discover, share, and access a comprehensive collection of exam papers, assignments, and study materials. 
                Built for students, by students.
              </motion.p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mt-6 sm:mt-10">
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-2 sm:gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  </motion.div>
                  <div className="text-left min-w-0">
                    <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Verified Content</div>
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
                    <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Smart Search</div>
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
                    <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Easy Upload</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Share your resources</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
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
                  className="backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-6 sm:p-8 relative overflow-hidden group"
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
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{item.title}</h3>
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
            className="backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8 md:mb-12"
          >
          <div className="space-y-4 sm:space-y-6">
            {/* Gooey Search Field Tabs */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                <Search className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Search In
              </label>
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-2">
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
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                <Search className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Search Papers
              </label>
              <input
                type="text"
                placeholder={`Search by ${searchField === 'all' ? 'title, description, course, or uploader' : searchField}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</label>
              </div>

              {/* Gooey Paper Type Tabs */}
              <div className="mb-3 sm:mb-4">
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter by course code..."
                  value={filters.course_code}
                  onChange={(e) => handleFilterChange('course_code', e.target.value.toUpperCase())}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                />
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
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 sm:gap-3"
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
              className="backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-8 sm:p-12 md:p-16 text-center"
            >
              <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4 sm:mb-6" />
              <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No papers found</p>
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
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredPapers.length}</span> of{' '}
                <span className="font-bold text-gray-900 dark:text-white">{papers.length}</span> papers
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
    </div>
  );
};

export default PublicHome;
