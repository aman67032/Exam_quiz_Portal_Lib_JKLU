import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, FileText, Loader2, Code, Calendar,
    Terminal, Clock, Trash2, Edit2, CheckCircle,
    AlertCircle, LogOut
} from 'lucide-react';
import JKLULogo from './JKLULogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://exampaperportal-production.up.railway.app';

interface Course {
    id: number;
    code: string;
    name: string;
}

interface Challenge {
    id: number;
    course_id: number;
    date: string;
    question: string;
    code_snippet: string;
    explanation: string;
    media_link?: string;
}

const HostDashboard: React.FC = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Matrix Rain Ref
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        course_id: '',
        date: '',
        question: '',
        code_snippet: '',
        explanation: '',
        media_link: ''
    });
    const [uploadingFile, setUploadingFile] = useState(false);

    // Matrix Rain Effect
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

            ctx.fillStyle = '#00ff41'; // Matrix Green
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
        // Redirect if not a host (admin or sub_admin)
        if (!user?.is_admin && user?.admin_role !== 'coding_ta' && !user?.is_sub_admin) {
            navigate('/');
            return;
        }
        if (token) {
            fetchCourses();
            fetchChallenges();
        }
    }, [user, navigate, token]);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/courses`);
            let coursesData = response.data;

            // If user is a Coding TA, only show specific Coding Hour courses
            if (user?.admin_role === 'coding_ta' || user?.is_sub_admin) {
                coursesData = coursesData.filter((c: Course) =>
                    c.code === 'CODING_PYTHON' ||
                    c.code === 'CODING_DAA' ||
                    c.name.toLowerCase().includes('coding hour')
                );
            }

            setCourses(coursesData);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/admin/daily-challenges`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChallenges(response.data);
        } catch (error) {
            console.error('Failed to fetch challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploadingFile(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await axios.post(`${API_BASE_URL}/challenges/upload`, formDataUpload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData(prev => ({ ...prev, media_link: response.data.media_link }));
            alert('File uploaded successfully!');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'File upload failed');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${API_BASE_URL}/challenges`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Challenge created successfully!');
            setShowCreateModal(false);
            setFormData({
                course_id: '',
                date: '',
                question: '',
                code_snippet: '',
                explanation: '',
                media_link: ''
            });
            fetchChallenges();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create challenge');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this challenge?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/challenges/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChallenges(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete challenge:', error);
            alert('Failed to delete challenge');
        }
    };

    return (
        <div className="min-h-screen relative bg-black text-gray-200 font-sans overflow-hidden">
            {/* Matrix Rain Canvas */}
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full opacity-20 pointer-events-none"
            />

            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 bg-black/40 backdrop-blur-md border-b border-green-500/30 shadow-lg shadow-green-900/20"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <JKLULogo size="sm" className="opacity-90" />
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                                    Host Command Center
                                </h1>
                                <p className="text-xs text-green-500/70 font-mono">system.admin_role = 'coding_ta'</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/20 border border-green-500/30">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-mono text-green-400">SYSTEM ONLINE</span>
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                                {user?.name}
                            </span>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats / Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Terminal className="text-green-500" />
                            Active Challenges
                        </h2>
                        <p className="text-gray-400">Manage daily coding problems for students.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg shadow-green-900/30 transition-all font-medium border border-green-400/30"
                    >
                        <Plus size={20} />
                        Deploy New Challenge
                    </motion.button>
                </div>

                {loading && !showCreateModal ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="animate-spin text-green-500" size={48} />
                        <p className="text-green-400 font-mono text-sm animate-pulse">Wait... Accessing Database...</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {challenges.map((challenge, index) => (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-gray-900/60 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-500" />
                                        <span className="font-mono text-green-400 font-bold">{challenge.date}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            // Add edit logic later if needed
                                            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(challenge.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1" title={challenge.question}>
                                    {challenge.question}
                                </h3>

                                <div className="relative mb-4 group/code">
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                    </div>
                                    <pre className="bg-black/50 p-4 pt-6 rounded-lg text-xs font-mono text-green-300 overflow-x-auto border border-white/5 h-32 scrollbar-thin scrollbar-thumb-gray-700">
                                        <code>{challenge.code_snippet}</code>
                                    </pre>
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-white/5 pt-4">
                                    <span className="flex items-center gap-1.5">
                                        <Code className="w-3 h-3" />
                                        ID: {challenge.id}
                                    </span>
                                    {challenge.media_link && (
                                        <a
                                            href={challenge.media_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <FileText className="w-3 h-3" />
                                            Attachment
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-green-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(34,197,94,0.1)] scrollbar-thin scrollbar-thumb-gray-700"
                        >
                            <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-green-500/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Terminal className="text-green-500" />
                                    Initialize Challenge
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Course Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        TARGET_COURSE
                                    </label>
                                    <select
                                        value={formData.course_id}
                                        onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
                                        required
                                    >
                                        <option value="">SELECT COURSE...</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                [{course.code}] {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        EXECUTION_DATE
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
                                        placeholder="Day 1"
                                        required
                                    />
                                </div>

                                {/* Question */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        PROBLEM_STATEMENT
                                    </label>
                                    <textarea
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 min-h-[100px]"
                                        placeholder="Describe the algorithm to implementation..."
                                        required
                                    />
                                </div>

                                {/* Code Snippet */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        SOURCE_CODE_TEMPLATE
                                    </label>
                                    <textarea
                                        value={formData.code_snippet}
                                        onChange={(e) => setFormData({ ...formData, code_snippet: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-green-300 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 min-h-[150px]"
                                        placeholder="def solution():\n    pass"
                                        required
                                    />
                                </div>

                                {/* Explanation */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        LOGIC_EXPLANATION
                                    </label>
                                    <textarea
                                        value={formData.explanation}
                                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 min-h-[100px]"
                                        placeholder="Explain time complexity and approach..."
                                        required
                                    />
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        ATTACHMENT_DATA (Optional)
                                    </label>
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleFileUpload(file);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-gray-400 flex items-center gap-2 hover:bg-black/60 transition-colors">
                                                <UploadIcon />
                                                {uploadingFile ? 'Uploading...' : 'Choose File...'}
                                            </div>
                                        </div>
                                    </div>
                                    {formData.media_link && (
                                        <div className="flex items-center gap-2 text-green-400 text-sm mt-2 font-mono">
                                            <CheckCircle size={14} />
                                            <span>UPLOAD_COMPLETE</span>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="flex gap-4 pt-4 border-t border-green-500/20">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all font-mono"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || uploadingFile}
                                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg shadow-green-900/40 transition-all font-bold tracking-wide font-mono disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Terminal size={18} />}
                                        DEPLOY
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper for Upload Icon
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

export default HostDashboard;
