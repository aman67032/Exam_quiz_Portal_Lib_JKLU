import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Edit2, Trash2, LogOut, BarChart3, User, Eye, Terminal, Database, Activity, Book, Upload } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import FilePreviewModal from './FilePreviewModal';
import { buildUploadUrl } from '../utils/uploads';
import JKLULogo from './JKLULogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://exampaperportal-production.up.railway.app';

interface Stats {
  total_papers: number;
  pending_papers: number;
  approved_papers: number;
  rejected_papers: number;
  total_courses: number;
  total_users: number;
}

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
  uploader_email?: string;
  status?: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
  description?: string;
}

interface VerificationRequest {
  id: number;
  name: string;
  email: string;
  photo_path?: string;
  id_card_path?: string;
  age?: number;
  year?: string;
  university?: string;
  department?: string;
  roll_no?: string;
  student_id?: string;
  id_verified: boolean;
}

// Helper function to construct image URL from path
const getImageUrl = (filePath: string | undefined): string => {
  return buildUploadUrl(filePath);
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingPapers, setPendingPapers] = useState<Paper[]>([]);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fileDiagnostics, setFileDiagnostics] = useState<any>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  
  // Filters for all papers
  const [paperFilters, setPaperFilters] = useState({
    course_id: '',
    paper_type: '',
    year: '',
    semester: '',
    status: ''
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // File Preview Modal State
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    filePath: '',
    paperId: 0
  });

  // Verification Request Modal State
  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    user: null as VerificationRequest | null
  });

  // Course form
  const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '' });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Paper editing state
  const [editPaperModal, setEditPaperModal] = useState({
    isOpen: false,
    paper: null as Paper | null
  });
  const [editPaperForm, setEditPaperForm] = useState({
    course_id: '',
    paper_type: '',
    year: '',
    semester: ''
  });

  // Rejection feedback modal state
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    paperId: 0,
    feedback: ''
  });

  // Profile rejection feedback modal state
  const [profileRejectionModal, setProfileRejectionModal] = useState({
    isOpen: false,
    userId: 0,
    feedback: ''
  });

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const token = localStorage.getItem('token');

  // Matrix rain animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff41';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, papersRes, verificationRes, coursesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/papers/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/admin/verification-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setPendingPapers(papersRes.data);
      setVerificationRequests(verificationRes.data);
      setCourses(coursesRes.data);
      
      // Fetch all papers for the all documents tab
      fetchAllPapers();
    } catch (err) {
      showMessage('error', 'Failed to fetch data');
    }
    setLoading(false);
  };

  const fetchAllPapers = async () => {
    try {
      const params: any = {};
      Object.entries(paperFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await axios.get(`${API_BASE_URL}/papers`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setAllPapers(response.data);
    } catch (err) {
      console.error('Failed to fetch all papers:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'all-papers' && token) {
      fetchAllPapers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperFilters, activeTab, token]);

  const reviewPaper = async (paperId: number, status: string, reason?: string, adminFeedback?: { message: string }) => {
    try {
      const payload: any = { status };
      
      if (status === 'rejected') {
        if (adminFeedback) {
          payload.admin_feedback = adminFeedback;
        } else if (reason) {
          // Convert old reason to new JSON format
          payload.admin_feedback = { message: reason };
        }
        // Keep rejection_reason for backward compatibility
        if (reason) {
          payload.rejection_reason = reason;
        }
      }

      await axios.patch(`${API_BASE_URL}/papers/${paperId}/review`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', `Paper ${status} successfully`);
      setRejectionModal({ isOpen: false, paperId: 0, feedback: '' });
      fetchDashboardData();
      if (activeTab === 'all-papers') {
        fetchAllPapers();
      }
    } catch (err) {
      showMessage('error', 'Failed to review paper');
    }
  };

  const handleApproveAll = async () => {
    if (pendingPapers.length === 0) {
      showMessage('info', 'No pending papers to approve');
      return;
    }

    // Use setTimeout to defer confirm dialog and prevent blocking
    const confirmed = await new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(window.confirm(`Are you sure you want to approve all ${pendingPapers.length} pending papers?`));
      }, 0);
    });

    if (!confirmed) {
      return;
    }

    // Optimistically update UI
    setPendingPapers([]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/papers/approve-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', response.data.message || `Successfully approved ${response.data.approved_count} paper(s)`);
      
      // Refresh data in background without blocking
      Promise.all([
        fetchDashboardData(),
        activeTab === 'all-papers' ? fetchAllPapers() : Promise.resolve()
      ]).catch(() => {
        // Silently handle errors, data will refresh on next manual refresh
      });
    } catch (err: any) {
      // Restore pending papers on error
      fetchDashboardData();
      showMessage('error', err.response?.data?.detail || 'Failed to approve all papers');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPaper = (paperId: number) => {
    setRejectionModal({ isOpen: true, paperId, feedback: '' });
  };

  const submitRejection = () => {
    if (!rejectionModal.feedback.trim()) {
      showMessage('error', 'Please provide feedback for rejection');
      return;
    }
    reviewPaper(rejectionModal.paperId, 'rejected', rejectionModal.feedback, { message: rejectionModal.feedback });
  };

  const openEditModal = (paper: Paper) => {
    setEditPaperModal({ isOpen: true, paper });
    setEditPaperForm({
      course_id: paper.course_code || '',
      paper_type: paper.paper_type,
      year: paper.year?.toString() || '',
      semester: paper.semester || ''
    });
  };

  const editPaper = async (paperId: number) => {
    try {
      const formData = new FormData();
      if (editPaperForm.course_id) formData.append('course_id', editPaperForm.course_id);
      if (editPaperForm.paper_type) formData.append('paper_type', editPaperForm.paper_type);
      if (editPaperForm.year) formData.append('year', editPaperForm.year);
      if (editPaperForm.semester) formData.append('semester', editPaperForm.semester);

      await axios.put(`${API_BASE_URL}/papers/${paperId}/edit`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showMessage('success', 'Paper updated successfully');
      setEditPaperModal({ isOpen: false, paper: null });
      setEditPaperForm({ course_id: '', paper_type: '', year: '', semester: '' });
      fetchDashboardData();
      if (activeTab === 'all-papers') {
        fetchAllPapers();
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || 'Failed to update paper');
    }
  };

  const handleCourseSubmit = async () => {
    setLoading(true);
    try {
      const url = editingCourse
        ? `${API_BASE_URL}/courses/${editingCourse.id}`
        : `${API_BASE_URL}/courses`;

      const method = editingCourse ? 'put' : 'post';
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios[method](url, courseForm, config);

      showMessage('success', editingCourse ? 'Course updated' : 'Course created');
      setCourseForm({ code: '', name: '', description: '' });
      setEditingCourse(null);
      fetchDashboardData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to save course';
      showMessage('error', errorMsg);
    }
    setLoading(false);
  };

  const deleteCourse = async (id: number) => {
    if (!confirm('Delete this course? All associated papers will be deleted.')) return;

    try {
      await axios.delete(`${API_BASE_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', 'Course deleted');
      fetchDashboardData();
    } catch (err) {
      showMessage('error', 'Failed to delete course');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showMessage('error', 'Please select a file to upload');
      return;
    }

    // Validate course selection
    if (!uploadForm.course_id && (!uploadForm.courseText || !uploadForm.courseName)) {
      showMessage('error', 'Please select or enter both course code and name');
      return;
    }

    // Validate quiz set if paper type is quiz
    if (uploadForm.paper_type === 'quiz' && !uploadForm.quiz_set) {
      showMessage('error', 'Please select a quiz set (A to F)');
      return;
    }

    // Validate year selection
    if (!uploadForm.year && !uploadForm.yearText) {
      showMessage('error', 'Please select or enter a year');
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
      await axios.post(`${API_BASE_URL}/papers/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showMessage('success', 'Paper uploaded successfully!');
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
      
      // Refresh data
      fetchDashboardData();
      if (activeTab === 'all-papers') {
        fetchAllPapers();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Upload failed. Please try again.';
      showMessage('error', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const verifyUser = async (userId: number, approve: boolean, reason?: string, adminFeedback?: { message: string }) => {
    try {
      const payload: any = { approve };
      
      if (!approve) {
        if (adminFeedback) {
          payload.admin_feedback = adminFeedback;
        } else if (reason) {
          payload.admin_feedback = { message: reason };
        }
        if (reason) {
          payload.reason = reason;
        }
      }

      await axios.post(`${API_BASE_URL}/admin/verify-user/${userId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', `User ${approve ? 'verified' : 'rejected'} successfully`);
      setVerificationModal({ isOpen: false, user: null });
      setProfileRejectionModal({ isOpen: false, userId: 0, feedback: '' });
      fetchDashboardData();
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || 'Failed to verify user');
    }
  };

  const handleRejectProfile = (userId: number) => {
    setProfileRejectionModal({ isOpen: true, userId, feedback: '' });
  };

  const submitProfileRejection = () => {
    if (!profileRejectionModal.feedback.trim()) {
      showMessage('error', 'Please provide feedback for rejection');
      return;
    }
    verifyUser(profileRejectionModal.userId, false, profileRejectionModal.feedback, { message: profileRejectionModal.feedback });
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const runFileDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/diagnose/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFileDiagnostics(response.data);
      const missingCount = response.data.papers_with_missing_files;
      if (missingCount > 0) {
        showMessage('error', `Found ${missingCount} papers with missing files. Check diagnostics below.`);
      } else {
        showMessage('success', 'All files are present on the server.');
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || 'Failed to run diagnostics');
    }
    setDiagnosticsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Matrix Rain Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 opacity-20"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Animated Grid Overlay */}
      <div className="fixed inset-0 z-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Glitch Effect Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent" style={{
          animation: 'glitch 3s infinite'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-black/80 backdrop-blur-xl border-b border-green-500/30 shadow-lg shadow-green-500/20"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="relative"
                animate={{
                  boxShadow: [
                    '0 0 10px #00ff41',
                    '0 0 20px #00ff41',
                    '0 0 10px #00ff41'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="bg-gradient-to-br from-green-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Terminal className="text-black" size={28} />
                </div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                  ADMIN_DASHBOARD.exe
                </h1>
                <p className="text-sm text-green-400 font-mono">USER: {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* JKLU Logo - Integrated in navbar */}
              <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
                <JKLULogo size="sm" className="sm:hidden opacity-90 hover:opacity-100" />
                <JKLULogo size="md" className="hidden sm:block opacity-90 hover:opacity-100" />
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Activity className="h-4 w-4 text-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-mono">SYSTEM_ONLINE</span>
              </div>
              <motion.button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg font-mono transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={18} />
                <span>LOGOUT</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto px-4 mt-4"
          >
            <div className={`p-4 rounded-lg border-2 font-mono ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-lg shadow-green-500/20'
                : 'bg-red-500/10 border-red-500/50 text-red-400 shadow-lg shadow-red-500/20'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span className="font-bold">[{message.type.toUpperCase()}]</span>
                <span>{message.text}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="max-w-7xl mx-auto px-4 mt-6">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/60 backdrop-blur-xl border-2 border-green-500/30 rounded-lg p-1 flex space-x-1 shadow-lg shadow-green-500/10"
          >
            {['dashboard', 'upload', 'all-papers', 'pending', 'courses'].map(tab => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 rounded-md font-mono font-bold uppercase transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-black shadow-lg shadow-green-500/50'
                    : 'text-green-400 hover:bg-green-500/10 border border-transparent hover:border-green-500/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab === 'dashboard' ? 'DASHBOARD' : tab === 'upload' ? 'UPLOAD_PAPER' : tab === 'all-papers' ? 'ALL_DOCUMENTS' : tab === 'pending' ? 'PENDING_REVIEW' : 'COURSE_MANAGEMENT'}
              </motion.button>
            ))}
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center font-mono bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                <BarChart3 className="mr-3 text-green-400" size={32} />
                SYSTEM_OVERVIEW
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'TOTAL_PAPERS', value: stats.total_papers, icon: Database, color: 'from-blue-500 to-cyan-500' },
                  { label: 'PENDING_REVIEW', value: stats.pending_papers, icon: AlertCircle, color: 'from-yellow-500 to-orange-500' },
                  { label: 'APPROVED', value: stats.approved_papers, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
                  { label: 'REJECTED', value: stats.rejected_papers, icon: XCircle, color: 'from-red-500 to-pink-500' },
                  { label: 'TOTAL_COURSES', value: stats.total_courses, icon: Book, color: 'from-purple-500 to-indigo-500' },
                  { label: 'TOTAL_USERS', value: stats.total_users, icon: User, color: 'from-cyan-500 to-blue-500' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
                      style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                    />
                    <div className="relative bg-black/60 backdrop-blur-xl border-2 border-green-500/30 rounded-xl p-6 hover:border-green-500/60 transition-all shadow-lg hover:shadow-green-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <stat.icon className={`h-8 w-8 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      <div className="text-xs text-green-400/70 font-mono uppercase mb-2">{stat.label}</div>
                      <div className={`text-4xl font-bold font-mono bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* All Documents Tab */}
          {activeTab === 'all-papers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Database className="text-cyan-400" size={28} />
                    ALL_DOCUMENTS [{allPapers.length}]
                  </h2>
                  <motion.button
                    onClick={runFileDiagnostics}
                    disabled={diagnosticsLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 rounded-lg font-mono transition-all disabled:opacity-50"
                    whileHover={{ scale: diagnosticsLoading ? 1 : 1.05 }}
                    whileTap={{ scale: diagnosticsLoading ? 1 : 0.95 }}
                  >
                    <Activity size={18} />
                    <span>{diagnosticsLoading ? 'CHECKING...' : 'CHECK FILES'}</span>
                  </motion.button>
                </div>

                {/* File Diagnostics Results */}
                {fileDiagnostics && (
                  <div className="bg-black/60 backdrop-blur-xl border-2 border-yellow-500/30 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-mono text-yellow-400/70 mb-3 uppercase">FILE DIAGNOSTICS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-black/40 rounded-lg p-3 border border-yellow-500/20">
                        <div className="text-xs text-yellow-400/50 font-mono uppercase mb-1">TOTAL PAPERS</div>
                        <div className="text-2xl font-bold text-yellow-400 font-mono">{fileDiagnostics.total_papers}</div>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-yellow-500/20">
                        <div className="text-xs text-yellow-400/50 font-mono uppercase mb-1">FILES ON DISK</div>
                        <div className="text-2xl font-bold text-yellow-400 font-mono">{fileDiagnostics.files_on_disk_count}</div>
                      </div>
                      <div className={`bg-black/40 rounded-lg p-3 border ${fileDiagnostics.papers_with_missing_files > 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
                        <div className="text-xs font-mono uppercase mb-1" style={{ color: fileDiagnostics.papers_with_missing_files > 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)' }}>
                          MISSING FILES
                        </div>
                        <div className={`text-2xl font-bold font-mono ${fileDiagnostics.papers_with_missing_files > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {fileDiagnostics.papers_with_missing_files}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-yellow-400/50 font-mono">
                      <span className="text-yellow-400/70">UPLOADS_DIR:</span> {fileDiagnostics.uploads_directory}
                    </div>
                    {fileDiagnostics.papers_with_missing_files > 0 && (
                      <div className="mt-4 max-h-60 overflow-y-auto">
                        <div className="text-xs text-red-400/70 font-mono uppercase mb-2">PAPERS WITH MISSING FILES:</div>
                        {fileDiagnostics.papers.filter((p: any) => !p.file_exists).map((p: any) => (
                          <div key={p.paper_id} className="bg-red-900/20 border border-red-500/30 rounded p-2 mb-2 text-xs font-mono">
                            <div className="text-red-400">ID: {p.paper_id} - {p.paper_title}</div>
                            <div className="text-red-400/70">Stored: {p.stored_path}</div>
                            <div className="text-red-400/70">Expected: {p.extracted_filename}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Filters */}
                <div className="bg-black/60 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-mono text-cyan-400/70 mb-3 uppercase">FILTERS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <select
                      value={paperFilters.course_id}
                      onChange={(e) => setPaperFilters({ ...paperFilters, course_id: e.target.value })}
                      className="px-3 py-2 bg-black/40 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.code}</option>
                      ))}
                    </select>

                    <select
                      value={paperFilters.paper_type}
                      onChange={(e) => setPaperFilters({ ...paperFilters, paper_type: e.target.value })}
                      className="px-3 py-2 bg-black/40 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="midterm">Midterm</option>
                      <option value="endterm">Endterm</option>
                      <option value="project">Project</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Year"
                      value={paperFilters.year}
                      onChange={(e) => setPaperFilters({ ...paperFilters, year: e.target.value })}
                      className="px-3 py-2 bg-black/40 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-sm focus:border-cyan-500 focus:outline-none placeholder-cyan-400/50"
                    />

                    <input
                      type="text"
                      placeholder="Semester"
                      value={paperFilters.semester}
                      onChange={(e) => setPaperFilters({ ...paperFilters, semester: e.target.value })}
                      className="px-3 py-2 bg-black/40 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-sm focus:border-cyan-500 focus:outline-none placeholder-cyan-400/50"
                    />

                    <select
                      value={paperFilters.status}
                      onChange={(e) => setPaperFilters({ ...paperFilters, status: e.target.value })}
                      className="px-3 py-2 bg-black/40 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {allPapers.length === 0 ? (
                  <div className="bg-black/60 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl p-8 text-center">
                    <Database className="h-12 w-12 text-cyan-400/50 mx-auto mb-3" />
                    <p className="text-cyan-400/70 font-mono">NO_PAPERS_FOUND</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allPapers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-black/60 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500/60 transition-all shadow-lg hover:shadow-cyan-500/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-cyan-400 font-mono mb-2">{paper.title}</h3>
                            <div className="text-sm text-cyan-400/70 font-mono mb-1">
                              <span className="text-blue-400">COURSE:</span> {paper.course_code} - {paper.course_name}
                            </div>
                            <div className="text-sm text-cyan-400/50 font-mono">
                              <span className="text-blue-400">UPLOADED_BY:</span> {paper.uploader_name} {paper.uploader_email && `(${paper.uploader_email})`}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 border text-xs font-mono rounded-lg ${
                              paper.status === 'approved' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                              paper.status === 'rejected' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                              'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            }`}>
                              {paper.status?.toUpperCase() || 'PENDING'}
                            </span>
                            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-mono rounded-lg">
                              {paper.paper_type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {paper.description && (
                          <p className="text-cyan-400/60 mb-4 font-mono text-sm">{paper.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm text-cyan-400/50 font-mono">
                              {paper.year && `YEAR: ${paper.year}`}
                              {paper.semester && ` | SEMESTER: ${paper.semester}`}
                            </div>
                            {paper.file_path && (
                              <div className="text-xs text-cyan-400/40 font-mono">
                                FILE: {paper.file_path}
                              </div>
                            )}
                            {!paper.file_path && (
                              <div className="text-xs text-red-400/70 font-mono">
                                ⚠️ FILE_PATH MISSING
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => {
                                if (!paper.file_name) {
                                  showMessage('error', 'File name is missing for this paper');
                                  return;
                                }
                                setPreviewModal({
                                  isOpen: true,
                                  fileName: paper.file_name,
                                  filePath: paper.file_path || '',
                                  paperId: paper.id
                                });
                              }}
                              disabled={!paper.file_name}
                              className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 rounded-lg font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: paper.file_name ? 1.05 : 1, boxShadow: paper.file_name ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none' }}
                              whileTap={{ scale: paper.file_name ? 0.95 : 1 }}
                            >
                              <Eye size={18} />
                              <span>VIEW</span>
                            </motion.button>
                            <motion.button
                              onClick={() => openEditModal(paper)}
                              className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 rounded-lg font-mono transition-all"
                              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Edit2 size={18} />
                              <span>EDIT</span>
                            </motion.button>
                            {paper.status !== 'approved' && (
                              <motion.button
                                onClick={() => reviewPaper(paper.id, 'approved')}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 rounded-lg font-mono transition-all"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <CheckCircle size={18} />
                                <span>APPROVE</span>
                              </motion.button>
                            )}
                            {paper.status !== 'rejected' && (
                              <motion.button
                                onClick={() => handleRejectPaper(paper.id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 rounded-lg font-mono transition-all"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle size={18} />
                                <span>REJECT</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Pending Review Tab - ID Verification Requests & Papers */}
          {activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* ID Verification Requests Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 font-mono bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
                  <User className="text-yellow-400" size={28} />
                  ID_VERIFICATION_REQUESTS [{verificationRequests.length}]
                </h2>
                {verificationRequests.length === 0 ? (
                  <div className="bg-black/60 backdrop-blur-xl border-2 border-yellow-500/30 rounded-xl p-8 text-center">
                    <User className="h-12 w-12 text-yellow-400/50 mx-auto mb-3" />
                    <p className="text-yellow-400/70 font-mono">NO_PENDING_VERIFICATION_REQUESTS</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/60 backdrop-blur-xl border-2 border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/60 transition-all shadow-lg hover:shadow-yellow-500/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-yellow-400 font-mono mb-2">{request.name}</h3>
                            <div className="text-sm text-yellow-400/70 font-mono mb-1">
                              <span className="text-cyan-400">EMAIL:</span> {request.email}
                            </div>
                            {(request.university || request.department || request.roll_no) && (
                              <div className="text-sm text-yellow-400/50 font-mono">
                                {request.university && <><span className="text-cyan-400">UNIVERSITY:</span> {request.university} | </>}
                                {request.department && <><span className="text-cyan-400">DEPT:</span> {request.department} | </>}
                                {request.roll_no && <><span className="text-cyan-400">ROLL:</span> {request.roll_no}</>}
                              </div>
                            )}
                          </div>
                          <span className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-mono rounded-lg">
                            PENDING_VERIFICATION
                          </span>
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t border-yellow-500/20">
                          <motion.button
                            onClick={() => setVerificationModal({ isOpen: true, user: request })}
                            className="flex items-center space-x-2 px-6 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 rounded-lg font-mono transition-all"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Eye size={18} />
                            <span>REVIEW_REQUEST</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Papers Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Database className="text-blue-400" size={28} />
                    PENDING_PAPERS [{pendingPapers.length}]
                  </h2>
                  {pendingPapers.length > 0 && (
                    <motion.button
                      onClick={handleApproveAll}
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold font-mono rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: loading ? 1 : 1.05, boxShadow: loading ? 'none' : '0 0 20px rgba(34, 197, 94, 0.5)' }}
                      whileTap={{ scale: loading ? 1 : 0.95 }}
                    >
                      <CheckCircle size={20} />
                      <span>APPROVE ALL</span>
                    </motion.button>
                  )}
                </div>
                {pendingPapers.length === 0 ? (
                  <div className="bg-black/60 backdrop-blur-xl border-2 border-blue-500/30 rounded-xl p-8 text-center">
                    <Database className="h-12 w-12 text-blue-400/50 mx-auto mb-3" />
                    <p className="text-blue-400/70 font-mono">NO_PENDING_PAPERS</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPapers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/60 backdrop-blur-xl border-2 border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition-all shadow-lg hover:shadow-blue-500/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-blue-400 font-mono mb-2">{paper.title}</h3>
                            <div className="text-sm text-blue-400/70 font-mono mb-1">
                              <span className="text-cyan-400">COURSE:</span> {paper.course_code} - {paper.course_name}
                            </div>
                            <div className="text-sm text-blue-400/50 font-mono">
                              <span className="text-cyan-400">UPLOADED_BY:</span> {paper.uploader_name} ({paper.uploader_email})
                            </div>
                          </div>
                          <span className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-sm font-mono rounded-lg">
                            {paper.paper_type.toUpperCase()}
                          </span>
                        </div>

                        {paper.description && (
                          <p className="text-blue-400/60 mb-4 font-mono text-sm">{paper.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-blue-500/20">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm text-blue-400/50 font-mono">
                              {paper.year && `YEAR: ${paper.year}`}
                              {paper.semester && ` | SEMESTER: ${paper.semester}`}
                            </div>
                            {paper.file_path && (
                              <div className="text-xs text-blue-400/40 font-mono">
                                FILE: {paper.file_path}
                              </div>
                            )}
                            {!paper.file_path && (
                              <div className="text-xs text-red-400/70 font-mono">
                                ⚠️ FILE_PATH MISSING
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => {
                                if (!paper.file_name) {
                                  showMessage('error', 'File name is missing for this paper');
                                  return;
                                }
                                setPreviewModal({
                                  isOpen: true,
                                  fileName: paper.file_name,
                                  filePath: paper.file_path || '',
                                  paperId: paper.id
                                });
                              }}
                              disabled={!paper.file_name}
                              className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 rounded-lg font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: paper.file_name ? 1.05 : 1, boxShadow: paper.file_name ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none' }}
                              whileTap={{ scale: paper.file_name ? 0.95 : 1 }}
                            >
                              <Eye size={18} />
                              <span>VIEW</span>
                            </motion.button>
                            <motion.button
                              onClick={() => openEditModal(paper)}
                              className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 rounded-lg font-mono transition-all"
                              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Edit2 size={18} />
                              <span>EDIT</span>
                            </motion.button>
                            <motion.button
                              onClick={() => reviewPaper(paper.id, 'approved')}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 rounded-lg font-mono transition-all"
                              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <CheckCircle size={18} />
                              <span>APPROVE</span>
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                handleRejectPaper(paper.id);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 rounded-lg font-mono transition-all"
                              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <XCircle size={18} />
                              <span>REJECT</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Upload Paper Tab */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6 font-mono bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                <Upload className="text-green-400" size={32} />
                UPLOAD_PAPER
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-black/60 backdrop-blur-xl border-2 border-green-500/30 rounded-xl p-6 shadow-lg"
              >
                <form onSubmit={handleUpload} className="space-y-6">
                  {/* Course Selection */}
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      COURSE
                    </label>
                    <div className="space-y-2">
                      <select
                        value={uploadForm.course_id}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, course_id: e.target.value, courseText: '', courseName: '' }))}
                        className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        <option value="">Select from existing courses</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-center text-xs text-green-400/50 font-mono">OR</div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={uploadForm.courseText}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, courseText: e.target.value, course_id: '' }))}
                          placeholder="Course Code (e.g., CS1109)"
                          className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-green-400/50"
                        />
                        <input
                          type="text"
                          value={uploadForm.courseName}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, courseName: e.target.value, course_id: '' }))}
                          placeholder="Course Name (e.g., Python)"
                          className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-green-400/50"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-green-400/50 font-mono mt-2">
                      {uploadForm.course_id 
                        ? `Selected: ${courses.find(c => c.id === parseInt(uploadForm.course_id))?.code} - ${courses.find(c => c.id === parseInt(uploadForm.course_id))?.name}` 
                        : (uploadForm.courseText && uploadForm.courseName) 
                          ? `New: ${uploadForm.courseText} - ${uploadForm.courseName}` 
                          : 'Choose one option'}
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      TITLE <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-green-400/50"
                      placeholder="Paper title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      DESCRIPTION
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-green-400/50 resize-none"
                      rows={3}
                      placeholder="Optional description"
                    />
                  </div>

                  {/* Paper Type and Year */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                        PAPER_TYPE <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={uploadForm.paper_type}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, paper_type: e.target.value, quiz_set: '' }))}
                        className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        <option value="assignment">Assignment</option>
                        <option value="quiz">Quiz</option>
                        <option value="midterm">Midterm</option>
                        <option value="endterm">Endterm</option>
                        <option value="project">Project</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                        YEAR <span className="text-red-400">*</span>
                      </label>
                      <div className="space-y-1">
                        <select
                          value={uploadForm.year}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value, yearText: '' }))}
                          className="w-full px-3 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          <option value="">Select year</option>
                          <option value="2024">2024</option>
                          <option value="2023">2023</option>
                          <option value="2022">2022</option>
                          <option value="2021">2021</option>
                          <option value="2020">2020</option>
                        </select>
                        <input
                          type="number"
                          value={uploadForm.yearText}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, yearText: e.target.value, year: '' }))}
                          placeholder="Or type year"
                          className="w-full px-3 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-green-400/50"
                          min="2020"
                          max="2030"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quiz Set (if quiz type) */}
                  {uploadForm.paper_type === 'quiz' && (
                    <div>
                      <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                        QUIZ_SET <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={uploadForm.quiz_set}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, quiz_set: e.target.value }))}
                        className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
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

                  {/* Semester */}
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      SEMESTER <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={uploadForm.semester}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      required
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

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      FILE <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500/20 file:text-green-400 hover:file:bg-green-500/30 cursor-pointer"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      required
                    />
                    {selectedFile && (
                      <p className="text-xs text-green-400/50 font-mono mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold font-mono py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    whileHover={{ scale: uploading || !selectedFile ? 1 : 1.02 }}
                    whileTap={{ scale: uploading || !selectedFile ? 1 : 0.98 }}
                  >
                    {uploading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                        />
                        <span>UPLOADING...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>UPLOAD_PAPER</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-6 font-mono bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                COURSE_MANAGEMENT
              </h2>

              {/* Course Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-black/60 backdrop-blur-xl border-2 border-green-500/30 rounded-xl p-6 mb-6 shadow-lg"
              >
                <h3 className="text-xl font-bold mb-4 text-green-400 font-mono">
                  {editingCourse ? 'EDIT_COURSE' : 'ADD_NEW_COURSE'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                        COURSE_CODE
                      </label>
                      <input
                        type="text"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        placeholder="CS1108"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                        COURSE_NAME
                      </label>
                      <input
                        type="text"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        placeholder="Python Programming"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      DESCRIPTION
                    </label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      rows={2}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      onClick={handleCourseSubmit}
                      disabled={loading || !courseForm.code || !courseForm.name}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold font-mono rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-green-500/50 transition-all"
                      whileHover={{ scale: loading || !courseForm.code || !courseForm.name ? 1 : 1.02 }}
                      whileTap={{ scale: loading || !courseForm.code || !courseForm.name ? 1 : 0.98 }}
                    >
                      {editingCourse ? 'UPDATE' : 'CREATE'} COURSE
                    </motion.button>
                    {editingCourse && (
                      <motion.button
                        onClick={() => {
                          setEditingCourse(null);
                          setCourseForm({ code: '', name: '', description: '' });
                        }}
                        className="px-6 py-2 bg-gray-800 border-2 border-gray-700 text-gray-400 font-mono rounded-lg hover:border-gray-600 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        CANCEL
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Courses List */}
              <div className="space-y-3">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/60 backdrop-blur-xl border-2 border-green-500/30 rounded-xl p-4 flex items-center justify-between hover:border-green-500/60 transition-all"
                  >
                    <div>
                      <div className="font-bold text-green-400 font-mono text-lg">
                        {course.code} - {course.name}
                      </div>
                      {course.description && (
                        <div className="text-sm text-green-400/50 font-mono mt-1">
                          {course.description}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseForm({
                            code: course.code,
                            name: course.name,
                            description: course.description || ''
                          });
                        }}
                        className="p-2 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all font-mono"
                        whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit2 size={18} />
                      </motion.button>
                      <motion.button
                        onClick={() => deleteCourse(course.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all font-mono"
                        whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
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
          token={token || ''}
        />

        {/* Verification Request Modal */}
        {verificationModal.isOpen && verificationModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setVerificationModal({ isOpen: false, user: null })}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-black/95 backdrop-blur-xl border-2 border-green-500/50 rounded-xl shadow-2xl shadow-green-500/20 p-6 max-w-4xl w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400 font-mono">
                  VERIFICATION_REQUEST: {verificationModal.user.name}
                </h2>
                <motion.button
                  onClick={() => setVerificationModal({ isOpen: false, user: null })}
                  className="text-red-400 hover:text-red-300 font-mono"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XCircle size={24} />
                </motion.button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Profile Photo */}
                <div className="bg-black/60 border-2 border-green-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-mono text-green-400/70 mb-3 uppercase">PROFILE_PHOTO</h3>
                  {verificationModal.user.photo_path ? (
                    <div className="relative">
                      {(() => {
                        const photoPath = verificationModal.user.photo_path || '';
                        const imageUrl = getImageUrl(photoPath);
                        console.log('Profile photo - Path:', photoPath, 'URL:', imageUrl);
                        return (
                          <img
                            src={imageUrl}
                            alt="Profile"
                            className="w-full h-auto rounded-lg object-cover border-2 border-green-500/30 max-h-96"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'w-full h-64 bg-red-900/20 rounded-lg flex flex-col items-center justify-center border-2 border-red-500/30 text-red-400 font-mono text-xs p-4';
                              errorDiv.innerHTML = `
                                <p class="mb-2 font-bold">IMAGE_LOAD_ERROR</p>
                                <p class="text-red-400/70 break-all text-center text-[10px] mb-1">Path: ${photoPath}</p>
                                <p class="text-red-400/70 break-all text-center text-[10px] mb-2">URL: ${imageUrl}</p>
                                <p class="text-yellow-400/70 text-[10px]">Check browser console for details</p>
                              `;
                              img.parentElement?.appendChild(errorDiv);
                              console.error('Failed to load profile photo:', { photoPath, imageUrl });
                            }}
                            onLoad={() => {
                              console.log('Profile photo loaded successfully:', imageUrl);
                            }}
                          />
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-green-900/20 to-cyan-900/20 rounded-lg flex items-center justify-center border-2 border-green-500/30">
                      <User className="h-16 w-16 text-green-400/50" />
                    </div>
                  )}
                </div>

                {/* ID Card */}
                <div className="bg-black/60 border-2 border-green-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-mono text-green-400/70 mb-3 uppercase">ID_CARD</h3>
                  {verificationModal.user.id_card_path ? (
                    verificationModal.user.id_card_path.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-64 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-lg flex flex-col items-center justify-center border-2 border-green-500/30">
                        <Eye className="h-16 w-16 text-green-400/50 mb-2" />
                        <p className="text-sm text-green-400/70 font-mono mb-2">PDF_DOCUMENT</p>
                        <a
                          href={getImageUrl(verificationModal.user.id_card_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
                        >
                          VIEW_PDF
                        </a>
                      </div>
                    ) : (
                      <div className="relative">
                        {(() => {
                          const idCardPath = verificationModal.user.id_card_path || '';
                          const imageUrl = getImageUrl(idCardPath);
                          console.log('ID card - Path:', idCardPath, 'URL:', imageUrl);
                          return (
                            <img
                              src={imageUrl}
                              alt="ID Card"
                              className="w-full h-auto rounded-lg object-cover border-2 border-green-500/30 max-h-96"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'w-full h-64 bg-red-900/20 rounded-lg flex flex-col items-center justify-center border-2 border-red-500/30 text-red-400 font-mono text-xs p-4';
                                errorDiv.innerHTML = `
                                  <p class="mb-2 font-bold">IMAGE_LOAD_ERROR</p>
                                  <p class="text-red-400/70 break-all text-center text-[10px] mb-1">Path: ${idCardPath}</p>
                                  <p class="text-red-400/70 break-all text-center text-[10px] mb-2">URL: ${imageUrl}</p>
                                  <p class="text-yellow-400/70 text-[10px]">Check browser console for details</p>
                                `;
                                img.parentElement?.appendChild(errorDiv);
                                console.error('Failed to load ID card:', { idCardPath, imageUrl });
                              }}
                              onLoad={() => {
                                console.log('ID card loaded successfully:', imageUrl);
                              }}
                            />
                          );
                        })()}
                      </div>
                    )
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-lg flex items-center justify-center border-2 border-green-500/30">
                      <Eye className="h-16 w-16 text-green-400/50" />
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-black/60 border-2 border-green-500/30 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-green-400 font-mono mb-4">USER_INFORMATION</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20">
                    <User className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-green-400/50 font-mono uppercase">NAME</p>
                      <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20">
                    <User className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-green-400/50 font-mono uppercase">EMAIL</p>
                      <p className="text-sm font-semibold text-cyan-400 font-mono">{verificationModal.user.email}</p>
                    </div>
                  </div>
                  {verificationModal.user.age && (
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20">
                      <div className="h-5 w-5 flex items-center justify-center bg-green-500/20 rounded text-green-400 flex-shrink-0">
                        <span className="text-xs font-bold">A</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-400/50 font-mono uppercase">AGE</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.age}</p>
                      </div>
                    </div>
                  )}
                  {verificationModal.user.year && (
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20">
                      <div className="h-5 w-5 flex items-center justify-center bg-green-500/20 rounded text-green-400 flex-shrink-0">
                        <span className="text-xs font-bold">Y</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-400/50 font-mono uppercase">YEAR</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.year}</p>
                      </div>
                    </div>
                  )}
                  {verificationModal.user.university && (
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20 md:col-span-2">
                      <div className="h-5 w-5 flex items-center justify-center bg-green-500/20 rounded text-green-400 flex-shrink-0">
                        <span className="text-xs font-bold">U</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-green-400/50 font-mono uppercase">UNIVERSITY</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.university}</p>
                      </div>
                    </div>
                  )}
                  {verificationModal.user.department && (
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20 md:col-span-2">
                      <div className="h-5 w-5 flex items-center justify-center bg-green-500/20 rounded text-green-400 flex-shrink-0">
                        <span className="text-xs font-bold">D</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-green-400/50 font-mono uppercase">DEPARTMENT</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.department}</p>
                      </div>
                    </div>
                  )}
                  {verificationModal.user.roll_no && (
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20">
                      <div className="h-5 w-5 flex items-center justify-center bg-green-500/20 rounded text-green-400 flex-shrink-0">
                        <span className="text-xs font-bold">R</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-400/50 font-mono uppercase">ROLL_NUMBER</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.roll_no}</p>
                      </div>
                    </div>
                  )}
                  {verificationModal.user.student_id && (
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20">
                      <div className="h-5 w-5 flex items-center justify-center bg-green-500/20 rounded text-green-400 flex-shrink-0">
                        <span className="text-xs font-bold">ID</span>
                      </div>
                      <div>
                        <p className="text-xs text-green-400/50 font-mono uppercase">STUDENT_ID</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{verificationModal.user.student_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 justify-end pt-4 border-t border-green-500/20">
                <motion.button
                  onClick={() => handleRejectProfile(verificationModal.user!.id)}
                  className="px-6 py-2 bg-red-500/20 border-2 border-red-500/50 text-red-400 font-bold font-mono rounded-lg hover:bg-red-500/30 transition-all"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  REJECT
                </motion.button>
                <motion.button
                  onClick={() => verifyUser(verificationModal.user!.id, true)}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold font-mono rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  ACCEPT_VERIFICATION
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Paper Modal */}
        {editPaperModal.isOpen && editPaperModal.paper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditPaperModal({ isOpen: false, paper: null })}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-black/90 backdrop-blur-xl border-2 border-green-500/50 rounded-xl shadow-2xl shadow-green-500/20 p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-green-400 font-mono">
                EDIT_PAPER: {editPaperModal.paper.title}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                    COURSE_CODE
                  </label>
                  <input
                    type="text"
                    value={editPaperForm.course_id}
                    onChange={(e) => setEditPaperForm({ ...editPaperForm, course_id: e.target.value })}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    list="course-list"
                  />
                  <datalist id="course-list">
                    {courses.map(course => (
                      <option key={course.id} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      PAPER_TYPE
                    </label>
                    <select
                      value={editPaperForm.paper_type}
                      onChange={(e) => setEditPaperForm({ ...editPaperForm, paper_type: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="assignment">ASSIGNMENT</option>
                      <option value="quiz">QUIZ</option>
                      <option value="midterm">MIDTERM</option>
                      <option value="endterm">ENDTERM</option>
                      <option value="project">PROJECT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      YEAR
                    </label>
                    <input
                      type="number"
                      value={editPaperForm.year}
                      onChange={(e) => setEditPaperForm({ ...editPaperForm, year: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      min="2020"
                      max="2030"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-green-400/70 mb-2 uppercase">
                      SEMESTER
                    </label>
                    <select
                      value={editPaperForm.semester}
                      onChange={(e) => setEditPaperForm({ ...editPaperForm, semester: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg text-green-400 font-mono focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="">SELECT_SEMESTER</option>
                      <option value="Fall 2024">FALL_2024</option>
                      <option value="Spring 2024">SPRING_2024</option>
                      <option value="Summer 2024">SUMMER_2024</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2 justify-end pt-4 border-t border-green-500/20">
                  <motion.button
                    onClick={() => setEditPaperModal({ isOpen: false, paper: null })}
                    className="px-6 py-2 bg-gray-800 border-2 border-gray-700 text-gray-400 font-mono rounded-lg hover:border-gray-600 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    CANCEL
                  </motion.button>
                  <motion.button
                    onClick={() => editPaper(editPaperModal.paper!.id)}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold font-mono rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    SAVE_CHANGES
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Rejection Feedback Modal for Papers */}
      {rejectionModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setRejectionModal({ isOpen: false, paperId: 0, feedback: '' })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border-2 border-red-500/50 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-red-400 mb-4 font-mono">REJECT PAPER</h3>
            <label className="block text-sm font-mono text-red-400/70 mb-2 uppercase">
              REJECTION FEEDBACK (REQUIRED)
            </label>
            <textarea
              value={rejectionModal.feedback}
              onChange={(e) => setRejectionModal({ ...rejectionModal, feedback: e.target.value })}
              placeholder="Enter feedback for rejection (e.g., 'Incomplete information', 'File format not supported', etc.)"
              className="w-full px-4 py-3 bg-black/40 border-2 border-red-500/30 rounded-lg text-white font-mono focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              rows={5}
              autoFocus
            />
            <div className="flex space-x-4 justify-end mt-4">
              <motion.button
                onClick={() => setRejectionModal({ isOpen: false, paperId: 0, feedback: '' })}
                className="px-6 py-2 bg-gray-800 border-2 border-gray-700 text-gray-400 font-mono rounded-lg hover:border-gray-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CANCEL
              </motion.button>
              <motion.button
                onClick={submitRejection}
                className="px-6 py-2 bg-red-500/20 border-2 border-red-500/50 text-red-400 font-bold font-mono rounded-lg hover:bg-red-500/30 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                SUBMIT REJECTION
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Rejection Feedback Modal for Profiles */}
      {profileRejectionModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setProfileRejectionModal({ isOpen: false, userId: 0, feedback: '' })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border-2 border-red-500/50 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-red-400 mb-4 font-mono">REJECT PROFILE</h3>
            <label className="block text-sm font-mono text-red-400/70 mb-2 uppercase">
              REJECTION FEEDBACK (REQUIRED)
            </label>
            <textarea
              value={profileRejectionModal.feedback}
              onChange={(e) => setProfileRejectionModal({ ...profileRejectionModal, feedback: e.target.value })}
              placeholder="Enter feedback for rejection (e.g., 'ID card not clear', 'Missing information', etc.)"
              className="w-full px-4 py-3 bg-black/40 border-2 border-red-500/30 rounded-lg text-white font-mono focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              rows={5}
              autoFocus
            />
            <div className="flex space-x-4 justify-end mt-4">
              <motion.button
                onClick={() => setProfileRejectionModal({ isOpen: false, userId: 0, feedback: '' })}
                className="px-6 py-2 bg-gray-800 border-2 border-gray-700 text-gray-400 font-mono rounded-lg hover:border-gray-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CANCEL
              </motion.button>
              <motion.button
                onClick={submitProfileRejection}
                className="px-6 py-2 bg-red-500/20 border-2 border-red-500/50 text-red-400 font-bold font-mono rounded-lg hover:bg-red-500/30 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                SUBMIT REJECTION
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add CSS for glitch animation */}
      <style>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
