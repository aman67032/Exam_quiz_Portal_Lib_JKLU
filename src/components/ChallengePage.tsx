import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Code, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

const ChallengePage: React.FC = () => {
    const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>();
    const navigate = useNavigate();
    const { token } = useAuth(); // Added user to destructuring to fix potential login check issues if needed later

    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('question');

    useEffect(() => {
        try {
            setLoading(true);
            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`; // Now 'token' is safely used or ignored if undefined
            }
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            try {
                const res = await fetch(`${apiUrl}/challenges/${challengeId}`, { headers });
                if (!res.ok) throw new Error('Failed to fetch challenge');
                const data = await res.json();
                setChallenge(data);
            } catch (e) {
                console.error('Failed to fetch challenge:', e);
                // No fallback to sample data
            }
        } catch (err) {
            console.error(err);
            // Ensure no sample data fallback
        } finally {
            setLoading(false);
        }
    };

    if (challengeId) {
        fetchChallenge();
    }
}, [challengeId, token]);

// Scroll Spy Effect
useEffect(() => {
    const handleScroll = () => {
        const sections = ['question', 'code', 'explanation', 'media'];
        const scrollPosition = window.scrollY + 200; // Offset for header

        for (const section of sections) {
            const element = document.getElementById(section);
            if (element && element.offsetTop <= scrollPosition) {
                setActiveSection(section);
            }
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
}, []);

const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        const offset = 100; // Height of sticky header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        setActiveSection(id);
    }
};

if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

if (error || !challenge) {
    return (
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'Challenge not found'}</p>
            <button onClick={() => navigate(`/coding-hour/${courseId}`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Back to Course</button>
        </div>
    );
}

const sections = [
    { id: 'question', label: 'Question', icon: BookOpen },
    { id: 'code', label: 'Code Solution', icon: Code },
    { id: 'explanation', label: 'Explanation', icon: FileText },
    { id: 'media', label: 'Media', icon: ImageIcon, disabled: !challenge.media_link },
];

return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Main Header - Sticky */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/coding-hour/${courseId}`)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                            {challenge.date} Challenge
                        </h1>
                    </div>

                    {/* Mobile Navigation - Horizontal Scroll */}
                    <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar py-2 max-w-[50%] xs:max-w-[60%]">
                        {sections.filter(s => !s.disabled).map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`p-2 rounded-lg transition-colors ${activeSection === section.id
                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <section.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Desktop Sidebar Navigation - Listen to Scroll */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-4">
                            On this page
                        </p>
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => !section.disabled && scrollToSection(section.id)}
                                disabled={section.disabled}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeSection === section.id
                                    ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-md border border-purple-100 dark:border-purple-900/50 transform scale-105'
                                    : section.disabled
                                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                                    }`}
                            >
                                <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="flex-1 min-w-0 space-y-12 pb-20">
                    {/* Question Section */}
                    <section id="question" className="scroll-mt-24">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Problem Statement</h2>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                                        {challenge.question}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Code Section */}
                    <section id="code" className="scroll-mt-24">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Solution Code</h2>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(challenge.code_snippet)}
                                        className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg hover:bg-gray-700"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    language="python"
                                    style={vscDarkPlus}
                                    customStyle={{ margin: 0, padding: '2rem', borderRadius: 0, fontSize: '0.9rem' }}
                                    showLineNumbers
                                >
                                    {challenge.code_snippet}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    </section>

                    {/* Explanation Section */}
                    <section id="explanation" className="scroll-mt-24">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detailed Explanation</h2>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {challenge.explanation}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Media Section */}
                    {challenge.media_link && (
                        <section id="media" className="scroll-mt-24">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                            <ImageIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media & Visuals</h2>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2">
                                        {challenge.media_link.endsWith('.pdf') ? (
                                            <iframe
                                                src={challenge.media_link}
                                                className="w-full h-[500px] rounded-lg"
                                                title="Challenge PDF"
                                            />
                                        ) : (
                                            <img
                                                src={challenge.media_link}
                                                alt="Challenge Media"
                                                className="w-full h-auto rounded-lg object-contain"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    </div>
);
};

export default ChallengePage;
