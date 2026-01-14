import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, X, FileText, Loader2 } from 'lucide-react';

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
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

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

    useEffect(() => {
        // Redirect if not a host (admin or sub_admin)
        if (!user?.is_admin && !user?.is_sub_admin) {
            navigate('/');
            return;
        }
        fetchCourses();
        fetchChallenges();
    }, [user, navigate]);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/courses`);
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/challenges/course/1`, {
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
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_BASE_URL}/challenges/upload`, formData, {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Host Dashboard</h1>
                        <p className="text-purple-300 text-sm">Manage Coding Challenges</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                        <Plus size={20} />
                        Create Challenge
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading && !showCreateModal ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-purple-400" size={48} />
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {challenges.map((challenge) => (
                            <div
                                key={challenge.id}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{challenge.date}</h3>
                                    {challenge.media_link && (
                                        <a
                                            href={challenge.media_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-400 hover:text-purple-300"
                                        >
                                            <FileText size={20} />
                                        </a>
                                    )}
                                </div>
                                <p className="text-gray-300 mb-4">{challenge.question}</p>
                                <pre className="bg-black/30 p-4 rounded-lg text-sm text-green-400 overflow-x-auto mb-4">
                                    {challenge.code_snippet}
                                </pre>
                                <p className="text-gray-400 text-sm">{challenge.explanation}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Create New Challenge</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Course Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Course
                                </label>
                                <select
                                    value={formData.course_id}
                                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="">Select a course</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Date (e.g., "Day 1", "Week 2")
                                </label>
                                <input
                                    type="text"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Day 1"
                                    required
                                />
                            </div>

                            {/* Question */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Question
                                </label>
                                <textarea
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                    placeholder="Describe the coding challenge..."
                                    required
                                />
                            </div>

                            {/* Code Snippet */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Code Snippet
                                </label>
                                <textarea
                                    value={formData.code_snippet}
                                    onChange={(e) => setFormData({ ...formData, code_snippet: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                                    placeholder="def solution():\n    pass"
                                    required
                                />
                            </div>

                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Explanation
                                </label>
                                <textarea
                                    value={formData.explanation}
                                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                    placeholder="Explain the solution approach..."
                                    required
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Media (Optional PDF/Image)
                                </label>
                                <div className="flex gap-4">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file);
                                            }
                                        }}
                                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                    />
                                    {uploadingFile && <Loader2 className="animate-spin text-purple-400" size={24} />}
                                </div>
                                {formData.media_link && (
                                    <p className="text-green-400 text-sm mt-2">✓ File uploaded successfully</p>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploadingFile}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating...' : 'Create Challenge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostDashboard;
