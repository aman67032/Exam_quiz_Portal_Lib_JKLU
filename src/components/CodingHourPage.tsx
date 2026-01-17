import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, Calendar, Sparkles, Clock, HelpCircle, Megaphone, FileText, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import logoImg from '../assets/logo (2).png';
import JKLULogo from './JKLULogo';

interface Question {
    id: number;
    title: string;
}

interface DailyContest {
    id: number;
    course_id: number;
    date: string;
    title: string | null;
    description: string | null;
    created_at: string;
    questions: Question[];
}

interface Course {
    id: number;
    code: string;
    name: string;
    description: string;
}

interface Announcement {
    id: number;
    course_id?: number | null;
    title: string;
    content: string;
    attachment_url?: string;
    created_at: string;
}

const CodingHourPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    useTheme();

    const [contests, setContests] = useState<DailyContest[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const headers: HeadersInit = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

                // Fetch course details
                try {
                    const courseRes = await fetch(`${apiUrl}/courses/${courseId}`, { headers });
                    if (!courseRes.ok) throw new Error('Failed to fetch course');
                    const courseData = await courseRes.json();
                    setCourse(courseData);
                } catch (e) {
                    console.error('Failed to fetch course:', e);
                }

                // Fetch contests (New Endpoint)
                try {
                    // Start checking for new contests first
                    const contestsRes = await fetch(`${apiUrl}/contests/course/${courseId}`, { headers });
                    if (contestsRes.ok) {
                        const contestsData = await contestsRes.json();
                        setContests(contestsData);
                    } else {
                        // Fallback to legacy challenges if needed, or just show empty
                        // But for now, we want to migrate fully to contests.
                        console.warn('Failed to fetch contests');
                        setContests([]);
                    }
                } catch (e) {
                    console.error('Failed to fetch contests:', e);
                    setContests([]);
                }

                // Fetch Announcements
                try {
                    const annRes = await fetch(`${apiUrl}/coding-announcements?course_id=${courseId}`, { headers });
                    if (annRes.ok) {
                        const annData = await annRes.json();
                        setAnnouncements(annData);
                    }
                } catch (e) {
                    console.error('Failed to fetch announcements:', e);
                }
            } catch (err) {
                console.error(err);
                setContests([]);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchData();
        }
    }, [courseId, token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'Course not found'}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
            {/* Navbar */}
            <motion.header
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 backdrop-blur-md sm:backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/40 shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link to="/home" className="flex items-center gap-3 group">
                                <div className="hidden sm:block">
                                    <JKLULogo size="sm" className="opacity-90 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <img src={logoImg} alt="Paper Portal Logo" className="h-10 w-auto object-contain" />
                                <div className="hidden md:block">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Paper Portal</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Weekly Coding Hour</p>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={user.is_admin ? '/admin' : '/dashboard'}
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-sm shadow-lg"
                                    >
                                        {user.is_admin ? 'Admin' : 'Dashboard'}
                                    </Link>
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all md:flex hidden"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <div className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 z-0" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/home')}
                        className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"
                    >
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-200 dark:border-purple-800">
                                <Sparkles className="w-3 h-3" />
                                {course.code}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                                {course.name}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed border-l-4 border-purple-500 pl-4">
                                {course.description}
                            </p>
                        </div>

                        <div className="hidden lg:block p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 shadow-xl">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                    <Code className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{contests.length}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Challenges</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Challenges Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
                {/* Announcements Section */}
                {announcements.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-6 flex items-center gap-2">
                            <Megaphone className="text-blue-400" />
                            Announcements
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {announcements.map((ann, idx) => (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">
                                            {new Date(ann.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{ann.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-4">{ann.content}</p>

                                    {ann.attachment_url && (
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/${ann.attachment_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/20 px-3 py-2 rounded-lg w-fit border border-blue-500/20 hover:bg-blue-900/30"
                                        >
                                            <FileText size={14} />
                                            <span>View Attachment</span>
                                            <Download size={14} className="ml-1" />
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-8">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Challenges</h2>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {contests.map((contest, index) => (
                        <motion.div
                            key={contest.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/coding-hour/${courseId}/challenge/${contest.id}`)}
                            className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-2xl hover:border-purple-500/30 transition-all duration-300 cursor-pointer overflow-hidden z-0"
                        >
                            {/* Hover Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:shadow-md transition-all duration-300">
                                    <Code className="w-6 h-6 text-gray-400 group-hover:text-purple-600 dark:text-gray-500 dark:group-hover:text-purple-400 transition-colors" />
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    #{index + 1}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                                {contest.title || contest.date}
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono">
                                {contest.date}
                            </p>

                            <div className="space-y-1 mb-6">
                                {contest.questions.slice(0, 2).map((q, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                        <HelpCircle className="w-3 h-3 text-purple-500/70" />
                                        <span className="truncate">{q.title}</span>
                                    </div>
                                ))}
                                {contest.questions.length > 2 && (
                                    <p className="text-xs text-purple-500 font-medium pl-5">
                                        +{contest.questions.length - 2} more...
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700 group-hover:border-purple-100 dark:group-hover:border-purple-900/30 transition-colors">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{contest.questions.length} Questions</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-purple-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {contests.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32"
                    >
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 mb-6 relative">
                            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-20" />
                            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Contests Available</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">Check back later for new coding contests. We add new problems every week!</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default CodingHourPage;

