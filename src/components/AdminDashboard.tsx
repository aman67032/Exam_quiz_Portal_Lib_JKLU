import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Edit2, Trash2, LogOut, BarChart3, User, Eye, Terminal, Database, Activity, Book } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import FilePreviewModal from './FilePreviewModal';
import { buildUploadUrl } from '../utils/uploads';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
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
    } catch (err) {
      showMessage('error', 'Failed to fetch data');
    }
    setLoading(false);
  };

  const reviewPaper = async (paperId: number, status: string, reason?: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/papers/${paperId}/review`, {
        status,
        rejection_reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', `Paper ${status} successfully`);
      fetchDashboardData();
    } catch (err) {
      showMessage('error', 'Failed to review paper');
    }
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

  const verifyUser = async (userId: number, approve: boolean, reason?: string) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/verify-user/${userId}`, {
        approve,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', `User ${approve ? 'verified' : 'rejected'} successfully`);
      setVerificationModal({ isOpen: false, user: null });
      fetchDashboardData();
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || 'Failed to verify user');
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
            <div className="flex items-center space-x-4">
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
            {['dashboard', 'pending', 'courses'].map(tab => (
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
                {tab === 'dashboard' ? 'DASHBOARD' : tab === 'pending' ? 'PENDING_REVIEW' : 'COURSE_MANAGEMENT'}
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
                <h2 className="text-2xl font-bold mb-4 font-mono bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                  <Database className="text-blue-400" size={28} />
                  PENDING_PAPERS [{pendingPapers.length}]
                </h2>
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
                          <div className="text-sm text-blue-400/50 font-mono">
                            {paper.year && `YEAR: ${paper.year}`}
                            {paper.semester && ` | SEMESTER: ${paper.semester}`}
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => setPreviewModal({
                                isOpen: true,
                                fileName: paper.file_name,
                                filePath: paper.file_path || '',
                                paperId: paper.id
                              })}
                              className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 rounded-lg font-mono transition-all"
                              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)' }}
                              whileTap={{ scale: 0.95 }}
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
                                const reason = prompt('Enter rejection reason:');
                                if (reason) reviewPaper(paper.id, 'rejected', reason);
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
                  onClick={() => {
                    const reason = prompt('Enter rejection reason (optional):');
                    verifyUser(verificationModal.user!.id, false, reason || undefined);
                  }}
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
