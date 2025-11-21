import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Filter, LogOut, User, Download, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
import logoImg from '../assets/logo (2).png';
import { lazy, Suspense } from 'react';
import { buildUploadUrl } from '../utils/uploads';
import Loader from './Loader';
import JKLULogo from './JKLULogo';

// Lazy load heavy background component
const ColorBends = lazy(() => import('./color_band_bg'));

interface Course {
  id: number;
  code: string;
  name: string;
  description: string;
}

interface Paper {
  id: number;
  title: string;
  description?: string;
  paper_type: string;
  year?: number;
  semester?: string;
  file_name: string;
  file_size?: number;
  status: string;
  uploaded_at: string;
  course_code?: string;
  course_name?: string;
  admin_feedback?: {
    message?: string;
    rejected_at?: string;
    rejected_by?: number;
  } | null;
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    course_id: '',
    courseText: '',
    courseName: '',
    title: '',
    description: '',
    paper_type: 'assignment',
    quiz_set: '',
    year: new Date().getFullYear().toString(),
    yearText: '',
    semester: '1st Sem'
  });

  // Filters
  const [filters, setFilters] = useState({
    course_id: '',
    paper_type: '',
    year: '',
    semester: ''
  });

  const fetchCourses = useCallback(async () => {
    try {
      const response = await API.getCourses();
      setCourses(response.data);
    } catch (error: any) {
      console.error('Error fetching courses:', error.message);
    }
  }, []);

  const fetchPapers = useCallback(async () => {
    try {
      const params: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await API.getPapers(params);
      setPapers(response.data);
    } catch (error: any) {
      console.error('Error fetching papers:', error.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // Require ID verification before uploads
    if (!(user as any)?.id_verified && localStorage.getItem('idVerified') !== 'yes') {
      showToast('Please upload your ID card in Profile to enable uploads', 'error');
      navigate('/profile');
      return;
    }
    if (!selectedFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    // Validate course selection
    if (!uploadForm.course_id && (!uploadForm.courseText || !uploadForm.courseName)) {
      showToast('Please select or enter both course code and name', 'error');
      return;
    }

    // Validate quiz set if paper type is quiz
    if (uploadForm.paper_type === 'quiz' && !uploadForm.quiz_set) {
      showToast('Please select a quiz set (A to F)', 'error');
      return;
    }

    // Validate year selection
    if (!uploadForm.year && !uploadForm.yearText) {
      showToast('Please select or enter a year', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Send course_id if selected from dropdown, otherwise send course_code and course_name
    if (uploadForm.course_id) {
      formData.append('course_id', uploadForm.course_id);
    } else if (uploadForm.courseText && uploadForm.courseName) {
      formData.append('course_code', uploadForm.courseText);
      formData.append('course_name', uploadForm.courseName);
    }
    
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('paper_type', uploadForm.paper_type);
    
    // Add quiz_set if paper type is quiz
    if (uploadForm.paper_type === 'quiz' && uploadForm.quiz_set) {
      formData.append('quiz_set', uploadForm.quiz_set);
    }
    
    // Convert year to integer if provided
    const yearValue = uploadForm.year || uploadForm.yearText;
    if (yearValue) {
      formData.append('year', yearValue.toString());
    }
    
    formData.append('semester', uploadForm.semester);

    try {
      await API.uploadPaper(formData);
      showToast('Paper uploaded successfully!', 'success');
      setSelectedFile(null);
      setUploadForm({
        course_id: '',
        courseText: '',
        courseName: '',
        title: '',
        description: '',
        paper_type: 'assignment',
        quiz_set: '',
        year: new Date().getFullYear().toString(),
        yearText: '',
        semester: '1st Sem'
      });
      fetchPapers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Upload failed. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev: typeof filters) => ({ ...prev, [name]: value }));
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-600 bg-emerald-500/20 border-emerald-500/30';
      case 'rejected': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-amber-500 bg-amber-500/20 border-amber-500/30';
    }
  }, []);

  const handleDownload = async (paperId: number, fileName: string) => {
    try {
      const response = await API.downloadPaper(paperId, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('File downloaded successfully!', 'success');
    } catch (error: any) {
      console.error('Download error:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to download file. The file may not exist on the server.';
      showToast(errorMessage, 'error');
    }
  };

  // Responsive tuning for small screens - memoized to prevent recalculation
  const isSmallScreen = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  }, []);

  const profilePhoto = useMemo(() => {
    const direct = localStorage.getItem('profile.photo');
    if (direct) return direct;
    const legacy = localStorage.getItem('profile.photo.path');
    return legacy ? buildUploadUrl(legacy) : '';
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Animated Background */}
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800" />}>
          <ColorBends
            colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
            rotation={30}
            speed={isSmallScreen ? 0.15 : 0.3}
            scale={isSmallScreen ? 1.5 : 1.2}
            frequency={isSmallScreen ? 1.1 : 1.4}
            warpStrength={isSmallScreen ? 0.9 : 1.2}
            mouseInfluence={isSmallScreen ? 0.5 : 0.8}
            parallax={isSmallScreen ? 0.35 : 0.6}
            noise={0.06}
            transparent={true}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </Suspense>
      </div>
      
      {/* Subtle Overlay under content but above page base */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-white/40 via-purple-50/10 to-cyan-50/10 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/30 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen">
        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 border-b border-white/20 dark:border-gray-700/30 shadow-lg shadow-purple-500/10"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
            {/* JKLU Logo - Top Right, fixed position on mobile, integrated on desktop */}
            <div className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto sm:flex sm:items-center sm:ml-4 flex-shrink-0 z-10">
              <JKLULogo size="sm" className="sm:hidden opacity-90 hover:opacity-100" />
              <JKLULogo size="md" className="hidden sm:block opacity-90 hover:opacity-100" />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-3 pr-14 sm:pr-0">
              {/* Logo and Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 sm:space-x-4"
              >
                <div className="relative">
                  <img 
                    src={logoImg} 
                    alt="Paper Portal Logo" 
                    className="h-12 sm:h-16 w-auto object-contain drop-shadow-lg"
                  />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-xl -z-10"
                  />
                </div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
                  >
                    Paper Portal
                  </motion.h1>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    Student Dashboard
                  </p>
                </div>
              </motion.div>

              {/* User Info and Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3 flex-wrap sm:ml-4"
              >
                <Link
                  to="/home"
                  className="px-3 sm:px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/50 shadow-lg text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 hover:shadow-purple-500/20"
                >
                  Home
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/50 shadow-lg hover:shadow-purple-500/20 max-w-[60vw] sm:max-w-none"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} className="h-6 sm:h-7 w-6 sm:w-7 rounded-full object-cover ring-2 ring-purple-400/40" />
                  ) : (
                    <div className="p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</span>
                </Link>
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-3 sm:px-5 py-2 text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl backdrop-blur-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="xl:col-span-1"
            >
              <div className="backdrop-blur-2xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 hover:shadow-purple-500/20 transition-all duration-300 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl -z-0" />
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-lg">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Upload Paper
                    </span>
                  </h2>

                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Course (Select or Type)
                      </label>
                      <div className="space-y-2">
                        <select
                          value={uploadForm.course_id}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, course_id: e.target.value, courseText: '', courseName: '' }))}
                          className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white"
                        >
                          <option value="">Select from existing courses</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.code} - {course.name}
                            </option>
                          ))}
                        </select>
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium">OR</div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={uploadForm.courseText}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, courseText: e.target.value, course_id: '' }))}
                            placeholder="Course Code (e.g., CS1109)"
                            className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                          />
                          <input
                            type="text"
                            value={uploadForm.courseName}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, courseName: e.target.value, course_id: '' }))}
                            placeholder="Course Name (e.g., Python)"
                            className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                        {uploadForm.course_id 
                          ? `Selected: ${courses.find(c => c.id === parseInt(uploadForm.course_id))?.code} - ${courses.find(c => c.id === parseInt(uploadForm.course_id))?.name}` 
                          : (uploadForm.courseText && uploadForm.courseName) 
                            ? `New: ${uploadForm.courseText} - ${uploadForm.courseName}` 
                            : 'Choose one option'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="Paper title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                        rows={3}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Type
                        </label>
                        <select
                          value={uploadForm.paper_type}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, paper_type: e.target.value, quiz_set: '' }))}
                          className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm"
                        >
                          <option value="assignment">Assignment</option>
                          <option value="quiz">Quiz</option>
                          <option value="midterm">Midterm</option>
                          <option value="endterm">Endterm</option>
                          <option value="project">Project</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Year (Select or Type)
                        </label>
                        <div className="space-y-1">
                          <select
                            value={uploadForm.year}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value, yearText: '' }))}
                            className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm"
                          >
                            <option value="">Select year</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2022">2022</option>
                          </select>
                          <input
                            type="number"
                            value={uploadForm.yearText}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, yearText: e.target.value, year: '' }))}
                            placeholder="Or type year"
                            className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                            min="2020"
                            max="2030"
                          />
                        </div>
                      </div>
                    </div>

                    {uploadForm.paper_type === 'quiz' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Quiz Set
                        </label>
                        <select
                          value={uploadForm.quiz_set}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, quiz_set: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Select Set</option>
                          <option value="A">Set A</option>
                          <option value="B">Set B</option>
                          <option value="C">Set C</option>
                          <option value="D">Set D</option>
                          <option value="E">Set E</option>
                          <option value="F">Set F</option>
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Semester
                      </label>
                      <select
                        value={uploadForm.semester}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white"
                      >
                        <option value="1st Sem">1st Sem</option>
                        <option value="2nd Sem">2nd Sem</option>
                        <option value="3rd Sem">3rd Sem</option>
                        <option value="4th Sem">4th Sem</option>
                        <option value="5th Sem">5th Sem</option>
                        <option value="6th Sem">6th Sem</option>
                        <option value="7th Sem">7th Sem</option>
                        <option value="8th Sem">8th Sem</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-purple-500 file:text-white hover:file:from-pink-600 hover:file:to-purple-600 cursor-pointer"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          required
                        />
                        {selectedFile && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      whileHover={{ scale: uploading || !selectedFile ? 1 : 1.02 }}
                      whileTap={{ scale: uploading || !selectedFile ? 1 : 0.98 }}
                      className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />
                      {uploading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Upload Paper</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Papers List */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="xl:col-span-2"
            >
              <div className="backdrop-blur-2xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-6 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-pink-500/20 rounded-full blur-3xl -z-0" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        My Papers
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-600 dark:text-pink-400 rounded-full text-sm font-bold">
                        {papers.length}
                      </span>
                    </h2>
                  <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-600/50 text-xs sm:text-sm">
                      <Filter className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <select
                      name="course_id"
                      value={filters.course_id}
                      onChange={handleFilterChange}
                      className="px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm font-medium"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code}
                        </option>
                      ))}
                    </select>

                    <select
                      name="paper_type"
                      value={filters.paper_type}
                      onChange={handleFilterChange}
                      className="px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm font-medium"
                    >
                      <option value="">All Types</option>
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="midterm">Midterm</option>
                      <option value="endterm">Endterm</option>
                      <option value="project">Project</option>
                    </select>

                    <select
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                      className="px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm font-medium"
                    >
                      <option value="">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>

                    <select
                      name="semester"
                      value={filters.semester}
                      onChange={handleFilterChange}
                      className="px-4 py-2.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm font-medium"
                    >
                      <option value="">All Semesters</option>
                      <option value="1st Sem">1st Sem</option>
                      <option value="2nd Sem">2nd Sem</option>
                      <option value="3rd Sem">3rd Sem</option>
                      <option value="4th Sem">4th Sem</option>
                      <option value="5th Sem">5th Sem</option>
                      <option value="6th Sem">6th Sem</option>
                      <option value="7th Sem">7th Sem</option>
                      <option value="8th Sem">8th Sem</option>
                    </select>
                  </div>

                  {/* Papers List */}
                  {loading ? (
                    <div className="text-center py-16">
                      <Loader />
                    </div>
                  ) : papers.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="p-6 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border border-purple-500/20">
                        <FileText className="h-12 w-12 text-purple-500" />
                      </div>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No papers found</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start by uploading your first paper!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[55vh] md:max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(168, 85, 247, 0.3) transparent' }}>
                      {papers.map((paper, index) => (
                        <motion.div
                          key={paper.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01, y: -4 }}
                          className="backdrop-blur-xl bg-white/60 dark:bg-gray-700/60 rounded-2xl p-5 hover:shadow-2xl border border-white/40 dark:border-gray-600/40 transition-all duration-300 relative overflow-hidden group"
                        >
                          {/* Hover gradient effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/5 group-hover:via-purple-500/5 group-hover:to-cyan-500/5 transition-all duration-300 -z-0" />
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {paper.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                  <span>📅</span>
                                  Uploaded: {new Date(paper.uploaded_at).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ml-3 shadow-lg border ${getStatusColor(paper.status)} backdrop-blur-sm`}>
                                {paper.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Course and Type Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-white/40 dark:border-gray-700/40">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Course</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{paper.course_code || 'N/A'}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{paper.course_name || ''}</p>
                              </div>
                              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-white/40 dark:border-gray-700/40">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Type</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm capitalize">{paper.paper_type}</p>
                              </div>
                              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-white/40 dark:border-gray-700/40">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Year</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{paper.year || 'N/A'}</p>
                              </div>
                              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-white/40 dark:border-gray-700/40">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">Semester</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{paper.semester || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Description */}
                            {paper.description && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-purple-500/20 p-3 rounded-xl backdrop-blur-sm">
                                {paper.description}
                              </p>
                            )}

                            {/* Admin Feedback - Display in red when rejected */}
                            {paper.status === 'rejected' && paper.admin_feedback && (
                              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500/50 rounded-xl">
                                <div className="flex items-start gap-2">
                                  <span className="text-red-600 dark:text-red-400 font-bold text-lg">⚠️</span>
                                  <div className="flex-1">
                                    <h4 className="text-red-800 dark:text-red-300 font-bold text-sm mb-1">Rejection Feedback</h4>
                                    <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">
                                      {paper.admin_feedback.message || 'Your submission has been rejected. Please review and resubmit.'}
                                    </p>
                                    {paper.admin_feedback.rejected_at && (
                                      <p className="text-red-600 dark:text-red-500 text-xs mt-2 opacity-75">
                                        Rejected on: {new Date(paper.admin_feedback.rejected_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* File Info */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 font-medium">
                                <FileText className="h-4 w-4 text-purple-500" />
                                {paper.file_name} ({(paper.file_size ? (paper.file_size / 1024).toFixed(2) : '0')} KB)
                              </div>
                              {paper.status === 'approved' && (
                                <motion.button
                                  onClick={() => handleDownload(paper.id, paper.file_name)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
