import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, FileText, Loader2, Code, Calendar,
    Terminal, Trash2, Edit2, CheckCircle,
    LogOut, ChevronDown, ChevronUp
} from 'lucide-react';
import JKLULogo from './JKLULogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://exampaperportal-production.up.railway.app';

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

const SUPPORTED_LANGUAGES = ['python', 'c', 'cpp', 'java', 'javascript'];

const HostDashboard: React.FC = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

    // Matrix Rain Ref
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            fetchContests();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate that all questions have at least one language with code
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const hasCode = Object.values(q.code_snippets).some(code => code.trim() !== '');
                if (!hasCode) {
                    alert(`Question ${i + 1} must have code in at least one language`);
                    setLoading(false);
                    return;
                }
            }

            const contestData = {
                course_id: parseInt(contestForm.course_id),
                date: contestForm.date,
                title: contestForm.title || `${contestForm.date} Challenge`,
                description: contestForm.description || null,
                questions: questions
            };

            await axios.post(`${API_BASE_URL}/contests`, contestData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Contest created successfully!');
            setShowCreateModal(false);
            resetForm();
            fetchContests();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create contest');
        } finally {
            setLoading(false);
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
                            Active Contests
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
                        Deploy New Contest
                    </motion.button>
                </div>

                {loading && !showCreateModal ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="animate-spin text-green-500" size={48} />
                        <p className="text-green-400 font-mono text-sm animate-pulse">Wait... Accessing Database...</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {contests.map((contest, index) => (
                            <motion.div
                                key={contest.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-gray-900/60 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-500" />
                                        <span className="font-mono text-green-400 font-bold">{contest.date}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDelete(contest.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1" title={contest.title || contest.date}>
                                    {contest.title || contest.date}
                                </h3>

                                <div className="mb-4">
                                    <div className="text-sm text-gray-400 mb-2">
                                        {contest.questions.length} Question{contest.questions.length !== 1 ? 's' : ''}
                                    </div>
                                    {contest.questions.slice(0, 2).map((q, i) => (
                                        <div key={i} className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                            <Code className="w-3 h-3" />
                                            <span className="line-clamp-1">{q.title}</span>
                                        </div>
                                    ))}
                                    {contest.questions.length > 2 && (
                                        <div className="text-xs text-gray-600">
                                            +{contest.questions.length - 2} more...
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-white/5 pt-4">
                                    <span className="flex items-center gap-1.5">
                                        <Code className="w-3 h-3" />
                                        ID: {contest.id}
                                    </span>
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-green-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(34,197,94,0.1)] scrollbar-thin scrollbar-thumb-gray-700 my-8"
                        >
                            <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-green-500/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Terminal className="text-green-500" />
                                    Initialize Contest
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                                <div className="border-t border-green-500/20 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Code className="text-green-500" />
                                            Questions ({questions.length})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addQuestion}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg border border-green-500/30 transition-all"
                                        >
                                            <Plus size={16} />
                                            Add Question
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((question, qIndex) => (
                                            <div
                                                key={qIndex}
                                                className="border border-green-500/20 rounded-lg overflow-hidden bg-black/20"
                                            >
                                                {/* Question Header */}
                                                <div
                                                    className="flex justify-between items-center p-4 bg-green-900/10 cursor-pointer hover:bg-green-900/20 transition-colors"
                                                    onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-green-400 font-mono font-bold">Q{qIndex + 1}</span>
                                                        <span className="text-white font-medium">
                                                            {question.title || 'Untitled Question'}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            {Object.keys(question.code_snippets).map(lang => (
                                                                <span
                                                                    key={lang}
                                                                    className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded border border-green-500/30"
                                                                >
                                                                    {lang.toUpperCase()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {questions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeQuestion(qIndex);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                        {expandedQuestion === qIndex ? (
                                                            <ChevronUp className="text-green-400" size={20} />
                                                        ) : (
                                                            <ChevronDown className="text-green-400" size={20} />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Question Details */}
                                                {expandedQuestion === qIndex && (
                                                    <div className="p-4 space-y-4">
                                                        {/* Title */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-400 mb-2">
                                                                Question Title
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={question.title}
                                                                onChange={(e) => updateQuestion(qIndex, 'title', e.target.value)}
                                                                className="w-full px-4 py-2 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500"
                                                                placeholder="e.g., Binary Search Implementation"
                                                                required
                                                            />
                                                        </div>

                                                        {/* Problem Statement */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-400 mb-2">
                                                                Problem Statement
                                                            </label>
                                                            <textarea
                                                                value={question.question}
                                                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                                className="w-full px-4 py-2 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 min-h-[100px]"
                                                                placeholder="Describe the problem..."
                                                                required
                                                            />
                                                        </div>

                                                        {/* Language Selection */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-400 mb-2">
                                                                Programming Languages
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {SUPPORTED_LANGUAGES.map(lang => (
                                                                    <label
                                                                        key={lang}
                                                                        className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${question.code_snippets[lang]
                                                                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                                                                : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!question.code_snippets[lang]}
                                                                            onChange={() => toggleLanguage(qIndex, lang)}
                                                                            className="sr-only"
                                                                        />
                                                                        {lang.toUpperCase()}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Code Editors for Selected Languages */}
                                                        <div className="space-y-3">
                                                            {Object.keys(question.code_snippets).map(lang => (
                                                                <div key={lang}>
                                                                    <label className="block text-sm font-medium text-green-400 mb-2">
                                                                        {lang.toUpperCase()} Code
                                                                    </label>
                                                                    <textarea
                                                                        value={question.code_snippets[lang]}
                                                                        onChange={(e) => updateCodeSnippet(qIndex, lang, e.target.value)}
                                                                        className="w-full px-4 py-2 bg-black/60 border border-green-500/20 rounded-lg text-green-300 font-mono text-sm focus:outline-none focus:border-green-500 min-h-[150px]"
                                                                        placeholder={`Enter ${lang} code...`}
                                                                        required
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Explanation */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-400 mb-2">
                                                                Explanation
                                                            </label>
                                                            <textarea
                                                                value={question.explanation}
                                                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                                className="w-full px-4 py-2 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500 min-h-[100px]"
                                                                placeholder="Explain the approach, time complexity, etc..."
                                                                required
                                                            />
                                                        </div>

                                                        {/* Media Link */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-green-400 mb-2">
                                                                Media Link (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={question.media_link || ''}
                                                                onChange={(e) => updateQuestion(qIndex, 'media_link', e.target.value)}
                                                                className="w-full px-4 py-2 bg-black/40 border border-green-500/20 rounded-lg text-white focus:outline-none focus:border-green-500"
                                                                placeholder="https://example.com/diagram.png"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-4 pt-4 border-t border-green-500/20">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all font-mono"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
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

export default HostDashboard;
