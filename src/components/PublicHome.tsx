import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Search, Filter, Eye, User, LogOut, GraduationCap, Upload, Shield } from 'lucide-react';
import axios from 'axios';
import FilePreviewModal from './FilePreviewModal';
import GooeyNav from './Gooeyeffect';
import Squares from './square_bg';
import PaperCard from './PaperCard';
import logoImg from '../assets/logo (2).png';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { lazy, Suspense } from 'react';

// Lazy load heavy background component
const ColorBends = lazy(() => import('./color_band_bg'));

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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

  const paperTypes = ['quiz', 'midterm', 'endterm', 'assignment', 'project'];
  const years = ['2025', '2024', '2023', '2022'];

  const fetchPublicPapers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/papers/public/all`);
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

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

  // Responsive background tuning - memoized to prevent recalculation
  const isSmallScreen = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
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

  const handleDownload = useCallback(async (paperId: number, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/papers/${paperId}/download`);

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download paper');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800" />}>
          <ColorBends
            colors={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4']}
            speed={isSmallScreen ? 0.09 : 0.15}
            frequency={isSmallScreen ? 1.0 : 1.2}
            warpStrength={isSmallScreen ? 0.8 : 1.2}
            mouseInfluence={isSmallScreen ? 0.5 : 0.8}
            parallax={isSmallScreen ? 0.35 : 0.6}
            transparent={true}
            scale={isSmallScreen ? 1.8 : 1.5}
          />
        </Suspense>
        {/* Subtle square grid overlay */}
        {/* Light theme grid (darker lines on light bg) */}
        <div className="absolute inset-0 opacity-60 pointer-events-none dark:hidden">
          <Squares
            speed={isSmallScreen ? 0.4 : 0.6}
            squareSize={isSmallScreen ? 56 : 48}
            borderColor={'rgba(0,0,0,0.28)'}
            hoverFillColor={'rgba(0,0,0,0.10)'}
            direction="diagonal"
          />
        </div>
        {/* Dark theme grid (light lines on dark bg) */}
        <div className="hidden dark:block absolute inset-0 opacity-30 pointer-events-none">
          <Squares
            speed={isSmallScreen ? 0.4 : 0.6}
            squareSize={isSmallScreen ? 56 : 48}
            borderColor={'rgba(255,255,255,0.35)'}
            hoverFillColor={'rgba(255,255,255,0.12)'}
            direction="diagonal"
          />
        </div>
        {/* Theme-aware readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/0 to-white/15 dark:from-gray-900/60 dark:via-gray-900/40 dark:to-gray-900/70" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/40 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <img src={logoImg} alt="Paper Portal Logo" className="h-12 sm:h-16 w-auto object-contain" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Paper Portal</h1>
                  <p className="hidden xs:block text-xs sm:text-sm text-gray-600 dark:text-gray-400">Academic Resource Hub</p>
                </div>
              </div>
              <div className="flex items-center sm:justify-end gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                {user ? (
                  <>
                    <Link
                      to={user.is_admin ? '/admin' : '/dashboard'}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-xs sm:text-sm shadow-lg whitespace-nowrap"
                    >
                      {user.is_admin ? 'Admin' : 'Dashboard'}
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/30 dark:border-gray-700/40 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg transition-all max-w-[60vw] sm:max-w-none"
                    >
                      {localStorage.getItem('profile.photo') ? (
                        <img src={localStorage.getItem('profile.photo') || ''} className="h-6 sm:h-7 w-6 sm:w-7 rounded-full object-cover" />
                      ) : (
                        <div className="p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      <span className="truncate">{user.name}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="px-3 sm:px-4 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <motion.a
                      href="/login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 sm:px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-xs sm:text-sm shadow-lg"
                    >
                      Student Login
                    </motion.a>
                    <motion.a
                      href="/admin-login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs sm:text-sm shadow-lg"
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
        <section className="relative py-14 sm:py-20 px-3 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-12 md:p-16"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center justify-center mb-6"
              >
                <img
                  src={logoImg}
                  alt="Paper Portal"
                  className="h-24 w-auto md:h-28 drop-shadow-xl"
                />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Your Academic Resource Hub
              </h1>
              <p className="text-lg md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed px-2">
                Discover, share, and access a comprehensive collection of exam papers, assignments, and study materials. 
                Built for students, by students.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mt-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-6 py-4 border border-white/30 dark:border-gray-700/40"
                >
                  <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">Verified Content</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Admin-reviewed papers</div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-6 py-4 border border-white/30 dark:border-gray-700/40"
                >
                  <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">Smart Search</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Find papers instantly</div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl px-6 py-4 border border-white/30 dark:border-gray-700/40"
                >
                  <Upload className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">Easy Upload</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Share your resources</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search and Documents Section */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-12 sm:pb-20">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-2xl sm:rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 mb-8 sm:mb-12"
          >
          <div className="space-y-4 sm:space-y-6">
            {/* Gooey Search Field Tabs */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                <Search className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Search In
              </label>
              <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                <div className="min-w-max sm:min-w-0">
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
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                  <div className="min-w-max sm:min-w-0">
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
          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3"
            >
              <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Browse Documents
            </motion.h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Explore our collection of verified academic papers and study materials
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full"
              />
            </div>
          ) : filteredPapers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-2xl p-16 text-center"
            >
              <FileText className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No papers found</p>
              <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or filter criteria</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="mt-10 text-center backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-lg py-6 px-8"
            >
              <p className="text-gray-700 dark:text-gray-300">
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
          token=""
        />
      </div>
    </div>
  );
};

export default PublicHome;
