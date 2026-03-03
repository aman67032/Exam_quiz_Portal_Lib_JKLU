import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, Loader2, Code, Calendar,
    Terminal, Trash2, Edit,
    LogOut, ChevronDown,
    Megaphone, Upload, Download
} from 'lucide-react';
import JKLULogo from './JKLULogo';
import MatrixBackground from './MatrixBackground';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://learnjklu-backend.vercel.app';

interface Course {
    id: number;
    code: string;
    name: string;
}

interface Question {
    id?: number;
    order: number;
    title: string;
    question: string;
    code_snippets: { [key: string]: string };
    explanation: string;
    media_link?: string;
}

interface Contest {
    id: number;
    course_id: number;
    date: string;
    title?: string;
    description?: string;
    questions: Question[];
}

interface Announcement {
    id: number;
    course_id?: number | null;
    title: string;
    content: string;
    attachment_url?: string;
    download_url?: string;
    created_at: string;
}

const SUPPORTED_LANGUAGES = ['c', 'python', 'cpp', 'java', 'javascript'];

const CodingHourAdmin: React.FC = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
    const [editingContestId, setEditingContestId] = useState<number | null>(null);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: '',
        course_id: '',
        file: null as File | null
    });

    // Form state for multi-question contest
    const [contestForm, setContestForm] = useState({
        course_id: '',
        date: '',
        title: '',
        description: ''
    });

    const [questions, setQuestions] = useState<Question[]>([{
        order: 1,
        title: '',
        question: '',
        code_snippets: { python: '' },
        explanation: '',
        media_link: ''
    }]);

    // Matrix Rain effect is now handled by MatrixBackground component

    useEffect(() => {
        // Redirect if not a host (admin or sub_admin)
        if (!user?.is_admin && user?.admin_role !== 'coding_ta' && !user?.is_sub_admin) {
            navigate('/');
            return;
        }
        if (token) {
            fetchCourses();
            fetchContests();
            fetchAnnouncements();
        }
    }, [user, navigate, token]);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/courses`);
            let coursesData = response.data;

            // If user is a Coding TA, only show specific Coding Hour courses
            if (user?.admin_role === 'coding_ta' || user?.is_sub_admin) {
                coursesData = coursesData.filter((c: Course) =>
                    c.code === 'CODING_C' ||
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

    const fetchContests = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/admin/contests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContests(response.data);
        } catch (error) {
            console.error('Failed to fetch contests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/coding-announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(res.data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            order: questions.length + 1,
            title: '',
            question: '',
            code_snippets: { python: '' },
            explanation: '',
            media_link: ''
        }]);
        setExpandedQuestion(questions.length);
    };

    const removeQuestion = (index: number) => {
        if (questions.length === 1) {
            alert('Contest must have at least one question');
            return;
        }
        const newQuestions = questions.filter((_, i) => i !== index);
        // Reorder
        newQuestions.forEach((q, i) => q.order = i + 1);
        setQuestions(newQuestions);
        if (expandedQuestion === index) {
            setExpandedQuestion(0);
        }
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const toggleLanguage = (questionIndex: number, lang: string) => {
        const newQuestions = [...questions];
        const codeSnippets = { ...newQuestions[questionIndex].code_snippets };

        if (codeSnippets[lang]) {
            // Remove language if it exists
            if (Object.keys(codeSnippets).length === 1) {
                alert('At least one language must be selected');
                return;
            }
            delete codeSnippets[lang];
        } else {
            // Add language
            codeSnippets[lang] = '';
        }

        newQuestions[questionIndex].code_snippets = codeSnippets;
        setQuestions(newQuestions);
    };

    const updateCodeSnippet = (questionIndex: number, lang: string, code: string) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].code_snippets[lang] = code;
        setQuestions(newQuestions);
    };

    const handleEdit = (contest: Contest) => {
        setEditingContestId(contest.id);
        setContestForm({
            course_id: contest.course_id.toString(),
            date: contest.date,
            title: contest.title || '',
            description: contest.description || ''
        });

        // Deep copy questions to avoid reference issues
        setQuestions(contest.questions.map(q => ({
            ...q,
            code_snippets: { ...q.code_snippets } // Ensure deep copy of nested object
        })));

        setShowCreateModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate that all questions have at least one language with code
            // AND ensure 'c' is present for Coding Hour C if we want to be strict,
            // or just ensure 'c' is generally present as requested.
            // User requested: "make 'c' as mandatory instead of python"
            // Conditional validation for Language Enforcement
            const selectedCourseId = parseInt(contestForm.course_id);
            const selectedCourse = courses.find(c => c.id === selectedCourseId);

            // User requested: "make C compulsory for the 'Coding Hour - C' course only"
            const isCodingHourC = selectedCourse?.name === 'Coding Hour - C' || selectedCourse?.code === 'CODING_C';

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (isCodingHourC) {
                    if (!q.code_snippets['c'] || q.code_snippets['c'].trim() === '') {
                        alert(`Question ${i + 1} must have C code snippet (Mandatory for Coding Hour - C).`);
                        setLoading(false);
                        return;
                    }
                } else {
                    // For other courses, enforce at least one language is present?
                    // Or "dont make python compulsory" implies no strict check, or just check if *any* snippet exists.
                    if (Object.keys(q.code_snippets).length === 0 || Object.values(q.code_snippets).every(val => !val || val.trim() === '')) {
                        alert(`Question ${i + 1} must have at least one code snippet.`);
                        setLoading(false);
                        return;
                    }
                }
            }

            const contestData = {
                course_id: parseInt(contestForm.course_id),
                date: contestForm.date,
                title: contestForm.title || `${contestForm.date} Challenge`,
                description: contestForm.description || null,
                questions: questions
            };

            if (editingContestId) {
                await axios.put(`${API_BASE_URL}/contests/${editingContestId}`, contestData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Contest updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/contests`, contestData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Contest created successfully!');
            }

            setShowCreateModal(false);
            resetForm();
            fetchContests();
        } catch (error: any) {
            console.error('Submit error:', error);
            alert(error.response?.data?.detail || 'Failed to save contest');
        } finally {
            setLoading(false);
        }
    };

    const handleAnnouncementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('title', announcementForm.title);
            formData.append('content', announcementForm.content);
            if (announcementForm.course_id) {
                formData.append('course_id', announcementForm.course_id);
            }
            if (announcementForm.file) {
                formData.append('file', announcementForm.file);
            }

            await axios.post(`${API_BASE_URL}/admin/coding-announcements`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Announcement posted successfully!');
            setShowAnnouncementModal(false);
            setAnnouncementForm({ title: '', content: '', course_id: '', file: null });
            fetchAnnouncements();
        } catch (error: any) {
            console.error('Announcement submit error:', error);
            alert(error.response?.data?.detail || 'Failed to post announcement');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/coding-announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAnnouncements();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete announcement');
        }
    };

    const resetForm = () => {
        setContestForm({
            course_id: '',
            date: '',
            title: '',
            description: ''
        });
        setQuestions([{
            order: 1,
            title: '',
            question: '',
            code_snippets: { python: '' },
            explanation: '',
            media_link: ''
        }]);
        setExpandedQuestion(0);
        setEditingContestId(null);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this contest?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/contests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContests(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete contest:', error);
            alert('Failed to delete contest');
        }
    };

    return (
        <div className="min-h-screen relative bg-black text-gray-200 font-sans">
            <MatrixBackground />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-black/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <JKLULogo size="sm" className="w-8 h-8 sm:w-10 sm:h-10" />
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 leading-tight">
                                    Coding Hour Admin
                                </h1>
                                <p className="text-[10px] sm:text-xs text-emerald-500/80 font-mono tracking-wider">
                                    ROOT_ACCESS: coding_ta
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right hidden xs:block">
                                    <p className="text-xs font-medium text-white line-clamp-1">{user?.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Host</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={logout}
                                    className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 transition-colors"
                                >
                                    <LogOut size={18} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Hero Section / Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10 sm:mb-14">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase"
                        >
                            <Terminal size={12} />
                            Deployment Dashboard
                        </motion.div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                            Coding <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Hour</span>
                        </h2>
                        <p className="text-gray-400 text-sm sm:text-base max-w-xl">
                            Initialize and manage coding challenges for students across automated judge systems.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAnnouncementModal(true)}
                            className="flex-1 lg:flex-none px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                            <Megaphone size={18} className="text-teal-400" />
                            Announce
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="flex-1 lg:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        >
                            <Plus size={20} />
                            New Contest
                        </motion.button>
                    </div>
                </div>

                {loading && !showCreateModal ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Code size={20} className="text-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white tracking-widest font-mono">SYNCHRONIZING...</h3>
                            <p className="text-xs text-emerald-500/60 font-mono mt-1">Acquiring secure connection to main.db</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        {contests.map((contest, index) => (
                            <motion.div
                                key={contest.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white/[0.03] backdrop-blur-md border border-white/5 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-500 overflow-hidden"
                            >
                                {/* Glow Effect on card */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[50px] group-hover:bg-emerald-500/20 transition-all duration-500"></div>

                                <div className="flex justify-between items-start relative z-10 mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase">
                                            <Calendar className="w-3 h-3" />
                                            {contest.date}
                                        </div>
                                        <h3 className="text-lg font-black text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                            {contest.title || "No Title"}
                                        </h3>
                                    </div>

                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                                        <button
                                            onClick={() => handleEdit(contest)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 border border-white/5 transition-all"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contest.id)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-px bg-white/5"></div>
                                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Questions</span>
                                        <div className="flex-1 h-px bg-white/5"></div>
                                    </div>

                                    <div className="space-y-2.5">
                                        {contest.questions.slice(0, 3).map((q, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                                                <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono">
                                                    0{i + 1}
                                                </div>
                                                <span className="text-xs text-gray-400 line-clamp-1 font-medium">{q.title}</span>
                                            </div>
                                        ))}
                                        {contest.questions.length > 3 && (
                                            <div className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest pt-1">
                                                + {contest.questions.length - 3} More Challenges
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-between items-center text-[10px] font-mono text-gray-600 border-t border-white/5">
                                        <span className="flex items-center gap-1">
                                            <Terminal size={12} className="text-emerald-500/40" />
                                            SEQ_ID: {contest.id}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                            {contest.questions.length} TOTAL
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Announcements Section */}
            {announcements.length > 0 && (
                <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <Megaphone className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">Public <span className="text-blue-400">Broadcasts</span></h3>
                            <p className="text-gray-500 text-sm">Official updates and notices for all participants.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {announcements.map((ann) => (
                            <motion.div
                                key={ann.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="group bg-white/[0.02] backdrop-blur-md border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-mono text-blue-400 tracking-widest uppercase bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                                            Broadcast_{ann.id}
                                        </span>
                                        <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase">{ann.title}</h4>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAnnouncement(ann.id)}
                                        className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-3">{ann.content}</p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <span className="text-[10px] text-gray-600 font-mono">TS: {new Date(ann.created_at).toLocaleDateString()}</span>
                                    {(ann.download_url || ann.attachment_url) && (
                                        <a
                                            href={ann.download_url || `${API_BASE_URL}/uploads/${ann.attachment_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-tighter hover:bg-blue-500/20 transition-all"
                                        >
                                            <Download size={12} />
                                            {ann.download_url ? 'Download Attachment' : 'View Attachment'}
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            className="bg-gray-900 sm:border sm:border-emerald-500/20 sm:rounded-3xl w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-4xl overflow-hidden shadow-2xl flex flex-col relative"
                        >
                            {/* Glow behind modal */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-emerald-500/10 blur-[80px] pointer-events-none"></div>
                            <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-white/5 p-5 sm:p-7 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <Terminal size={20} />
                                        </div>
                                        {editingContestId ? 'Edit_Challenge' : 'New_Challenge'}
                                    </h2>
                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 ml-11 uppercase tracking-widest hidden sm:block">
                                        System.Protocol // Write_Access
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Contest Metadata */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Course Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                            TARGET_COURSE
                                        </label>
                                        <select
                                            value={contestForm.course_id}
                                            onChange={(e) => setContestForm({ ...contestForm, course_id: e.target.value })}
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
                                            value={contestForm.date}
                                            onChange={(e) => setContestForm({ ...contestForm, date: e.target.value })}
                                            className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
                                            placeholder="Week 1 - Day 1"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        CONTEST_TITLE (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={contestForm.title}
                                        onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
                                        placeholder="Introduction to Algorithms"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-green-400 mb-2 font-mono">
                                        DESCRIPTION (Optional)
                                    </label>
                                    <textarea
                                        value={contestForm.description}
                                        onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 min-h-[80px]"
                                        placeholder="Brief description of the contest..."
                                    />
                                </div>

                                {/* Questions Section */}
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                                                <Code size={18} />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                                Challenges ({questions.length})
                                            </h3>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            onClick={addQuestion}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-black rounded-lg uppercase tracking-tight"
                                        >
                                            <Plus size={14} />
                                            Add New
                                        </motion.button>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((question, qIndex) => (
                                            <div
                                                key={qIndex}
                                                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${expandedQuestion === qIndex
                                                    ? 'bg-white/[0.04] border-emerald-500/30'
                                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                                            >
                                                {/* Question Header */}
                                                <div
                                                    className="flex justify-between items-center p-4 sm:p-5 cursor-pointer select-none"
                                                    onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
                                                >
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono transition-colors ${expandedQuestion === qIndex ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                                                            {qIndex + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-bold text-white truncate pr-4">
                                                                {question.title || 'NULL_REFERENCE'}
                                                            </h4>
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                {Object.keys(question.code_snippets).map(lang => (
                                                                    <span key={lang} className="text-[8px] font-black font-mono border border-emerald-500/30 text-emerald-400 px-1 py-0.5 rounded uppercase">
                                                                        {lang}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {questions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeQuestion(qIndex);
                                                                }}
                                                                className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                        <motion.div
                                                            animate={{ rotate: expandedQuestion === qIndex ? 180 : 0 }}
                                                        >
                                                            <ChevronDown className="text-gray-600" size={20} />
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                {/* Question Details */}
                                                <AnimatePresence>
                                                    {expandedQuestion === qIndex && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-5 sm:p-6 space-y-6 pt-0 border-t border-white/5">
                                                                <div className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-emerald-500/70 tracking-widest uppercase ml-1">Title</label>
                                                                        <input
                                                                            type="text"
                                                                            value={question.title}
                                                                            onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
                                                                            className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:border-emerald-500/30 text-sm"
                                                                            required
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-emerald-500/70 tracking-widest uppercase ml-1">Scenario_Data</label>
                                                                        <textarea
                                                                            value={question.question}
                                                                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                                            className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:border-emerald-500/30 min-h-[120px] text-sm leading-relaxed"
                                                                            required
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-emerald-500/70 tracking-widest uppercase ml-1">Active_Compilers</label>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                                                <button
                                                                                    key={lang}
                                                                                    type="button"
                                                                                    onClick={() => toggleLanguage(qIndex, lang)}
                                                                                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-tighter uppercase transition-all ${question.code_snippets[lang]
                                                                                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                                                                        : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                                                                                        }`}
                                                                                >
                                                                                    {lang}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        {Object.keys(question.code_snippets).map(lang => (
                                                                            <div key={lang} className="space-y-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                                                    <label className="text-[10px] font-black text-emerald-500/50 tracking-widest uppercase">{lang}_Snippet</label>
                                                                                </div>
                                                                                <textarea
                                                                                    value={question.code_snippets[lang]}
                                                                                    onChange={(e) => updateCodeSnippet(qIndex, lang, e.target.value)}
                                                                                    className="w-full px-4 py-4 bg-black/60 border border-emerald-500/10 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500/30 min-h-[180px] custom-scrollbar"
                                                                                    required
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-emerald-500/70 tracking-widest uppercase ml-1">Approach_Explanation</label>
                                                                        <textarea
                                                                            value={question.explanation}
                                                                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                                            className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:border-emerald-500/30 min-h-[100px] text-sm"
                                                                            required
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-emerald-500/70 tracking-widest uppercase ml-1">Diagram_URI (Optional)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={question.media_link || ''}
                                                                            onChange={(e) => updateQuestion(qIndex, 'media_link', e.target.value)}
                                                                            className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-gray-400 focus:outline-none focus:border-emerald-500/30 text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Controls */}
                                <div className="sticky bottom-0 bg-gray-900/80 backdrop-blur-xl border-t border-white/5 p-5 sm:p-7 flex gap-3 z-10">
                                    <motion.button
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-gray-400 font-bold uppercase tracking-widest text-xs"
                                    >
                                        Abort
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Terminal size={18} />}
                                        {editingContestId ? 'Push_Updates' : 'Finalize_Deployment'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Announcement Modal */}
            <AnimatePresence>
                {showAnnouncementModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            className="bg-gray-900 sm:border sm:border-blue-500/20 sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-2xl overflow-hidden shadow-2xl flex flex-col relative"
                        >
                            <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-white/5 p-5 sm:p-7 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                            <Megaphone size={20} />
                                        </div>
                                        Post_Broadcast
                                    </h2>
                                </div>
                                <motion.button
                                    whileHover={{ rotate: 90 }}
                                    onClick={() => setShowAnnouncementModal(false)}
                                    className="p-2 text-gray-500 hover:text-white"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>

                            <form onSubmit={handleAnnouncementSubmit} className="p-5 sm:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-500 tracking-widest font-mono uppercase ml-1">Title</label>
                                    <input
                                        type="text"
                                        value={announcementForm.title}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                        className="w-full px-4 py-4 bg-white/[0.03] border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 text-sm"
                                        required
                                        placeholder="Announcement Title"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-500 tracking-widest font-mono uppercase ml-1">Transmission_Data</label>
                                    <textarea
                                        value={announcementForm.content}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                                        className="w-full px-4 py-4 bg-white/[0.03] border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 min-h-[150px] text-sm"
                                        required
                                        placeholder="Broadcast details..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-blue-500 tracking-widest font-mono uppercase ml-1">Target_Scope</label>
                                        <select
                                            value={announcementForm.course_id}
                                            onChange={(e) => setAnnouncementForm({ ...announcementForm, course_id: e.target.value })}
                                            className="w-full px-4 py-4 bg-white/[0.03] border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-gray-900">Global / All Courses</option>
                                            {courses.map((course) => (
                                                <option key={course.id} value={course.id} className="bg-gray-900">
                                                    {course.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-blue-500 tracking-widest font-mono uppercase ml-1">Packet_Attachment</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={(e) => setAnnouncementForm({ ...announcementForm, file: e.target.files ? e.target.files[0] : null })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                                            />
                                            <div className="w-full px-4 py-4 bg-white/[0.03] border border-white/5 rounded-xl text-gray-500 flex items-center gap-2 truncate text-sm">
                                                <Upload size={16} />
                                                <span className="truncate">{announcementForm.file ? announcementForm.file.name : 'Max 2MB File'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Commence_Transmission'}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default CodingHourAdmin;
