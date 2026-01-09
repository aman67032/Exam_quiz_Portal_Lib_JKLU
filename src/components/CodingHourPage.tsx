import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface DailyChallenge {
    id: number;
    course_id: number;
    date: string;
    question: string;
    code_snippet: string;
    explanation: string;
    media_link: string | null;
    created_at: string;
}

interface Course {
    id: number;
    code: string;
    name: string;
    description: string;
}

const CodingHourPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    // Theme context might be different or unused in this component, but keeping imports consistent
    const { theme } = useTheme();

    const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const SAMPLE_CHALLENGES: DailyChallenge[] = [
                {
                    id: 1,
                    course_id: parseInt(courseId || '101'),
                    date: '2025-01-10',
                    question: 'Write a function to reverse a string in Python.',
                    code_snippet: 'def reverse_string(s):\n    return s[::-1]',
                    explanation: 'Slicing with a step of -1 mimics walking through the string backwards.',
                    media_link: null,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    course_id: parseInt(courseId || '101'),
                    date: '2025-01-11',
                    question: 'Find the factorial of a number using recursion.',
                    code_snippet: 'def factorial(n):\n    return 1 if n == 0 else n * factorial(n-1)',
                    explanation: 'Base case is 0! = 1. Recursive step multiplies n by (n-1)!',
                    media_link: null,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    course_id: parseInt(courseId || '101'),
                    date: '2025-01-12',
                    question: 'Check if a number is prime.',
                    code_snippet: 'def is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0: return False\n    return True',
                    explanation: 'Loop from 2 to sqrt(n). If any divider found, not prime.',
                    media_link: null,
                    created_at: new Date().toISOString()
                }
            ];

            const SAMPLE_COURSE: Course = {
                id: parseInt(courseId || '101'),
                code: 'CH001',
                name: 'Coding Hour - Python',
                description: 'Master Python with daily challenges ranging from basic syntax to advanced algorithms.'
            };

            try {
                setLoading(true);
                // Auth header optional for these read-only public endpoints
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
                    console.warn('Using sample course data');
                    setCourse(SAMPLE_COURSE);
                }

                // Fetch challenges
                try {
                    const challengesRes = await fetch(`${apiUrl}/challenges/course/${courseId}`, { headers });
                    if (!challengesRes.ok) throw new Error('Failed to fetch challenges');
                    const challengesData = await challengesRes.json();
                    setChallenges(challengesData.length ? challengesData : SAMPLE_CHALLENGES);
                } catch (e) {
                    console.warn('Using sample challenges data');
                    setChallenges(SAMPLE_CHALLENGES);
                }
            } catch (err) {
                console.error(err);
                // Last resort fallback
                setCourse(SAMPLE_COURSE);
                setChallenges(SAMPLE_CHALLENGES);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(user ? '/dashboard' : '/home')}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Code className="w-8 h-8 text-purple-500" />
                            {course.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{course.description}</p>
                    </div>
                </div>

                {/* Challenges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {challenges.map((challenge, index) => (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/coding-hour/${courseId}/challenge/${challenge.id}`)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group border border-gray-100 dark:border-gray-700"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                                        <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        Challenge #{index + 1}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {challenge.date}
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                    Click to view the daily challenge and solution.
                                </p>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center group-hover:bg-purple-50 dark:group-hover:bg-purple-900/10 transition-colors">
                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    Start Coding
                                </span>
                                <span className="text-lg text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                                    →
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {challenges.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No challenges yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Check back later for new coding challenges.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodingHourPage;
