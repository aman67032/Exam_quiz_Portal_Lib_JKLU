import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Filter, LogOut, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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
}

const API_BASE_URL = 'http://localhost:8000';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    course_id: '',
    courseText: '',
    title: '',
    description: '',
    paper_type: 'assignment',
    year: new Date().getFullYear().toString(),
    yearText: '',
    semester: 'Fall 2024'
  });

  // Filters
  const [filters, setFilters] = useState({
    course_id: '',
    paper_type: '',
    year: '',
    semester: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCourses();
    fetchPapers();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error: any) {
      console.error('Error fetching courses:', error.response?.data || error.message);
    }
  };

  const fetchPapers = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${API_BASE_URL}/papers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPapers(response.data);
    } catch (error: any) {
      console.error('Error fetching papers:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // Validate course selection
    if (!uploadForm.course_id && !uploadForm.courseText) {
      alert('Please select or enter a course');
      return;
    }

    // Validate year selection
    if (!uploadForm.year && !uploadForm.yearText) {
      alert('Please select or enter a year');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('course_id', uploadForm.course_id || uploadForm.courseText);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('paper_type', uploadForm.paper_type);
    formData.append('year', uploadForm.year || uploadForm.yearText);
    formData.append('semester', uploadForm.semester);

    try {
      await axios.post(`${API_BASE_URL}/papers/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Paper uploaded successfully!');
      setSelectedFile(null);
      setUploadForm({
        course_id: '',
        courseText: '',
        title: '',
        description: '',
        paper_type: 'assignment',
        year: new Date().getFullYear().toString(),
        yearText: '',
        semester: 'Fall 2024'
      });
      fetchPapers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Upload failed. Please try again.';
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev: typeof filters) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchPapers();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Paper Portal
            </motion.h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Paper
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course (Select or Type)
                  </label>
                  <div className="space-y-2">
                    <select
                      value={uploadForm.course_id}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, course_id: e.target.value, courseText: '' }))}
                      className="input-field"
                    >
                      <option value="">Select from existing courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">OR</div>
                    <input
                      type="text"
                      value={uploadForm.courseText}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, courseText: e.target.value, course_id: '' }))}
                      placeholder="Type new course code (e.g., CS101)"
                      className="input-field"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {uploadForm.course_id ? `Selected: ${courses.find(c => c.id == uploadForm.course_id)?.code}` : uploadForm.courseText ? `New: ${uploadForm.courseText}` : 'Choose one option'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Paper title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={uploadForm.paper_type}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, paper_type: e.target.value }))}
                      className="input-field"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="midterm">Midterm</option>
                      <option value="endterm">Endterm</option>
                      <option value="project">Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year (Select or Type)
                    </label>
                    <div className="space-y-1">
                      <select
                        value={uploadForm.year}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value, yearText: '' }))}
                        className="input-field text-sm"
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
                        className="input-field text-sm"
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                    className="input-field"
                  >
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                    <option value="Summer 2024">Summer 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Paper'}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Papers List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  My Papers
                </h2>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Filters</span>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <select
                  name="course_id"
                  value={filters.course_id}
                  onChange={handleFilterChange}
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
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
                  className="input-field"
                >
                  <option value="">All Semesters</option>
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2024">Spring 2024</option>
                  <option value="Summer 2024">Summer 2024</option>
                </select>
              </div>

              {/* Papers List */}
              {loading ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-gray-600 dark:text-gray-400">Loading papers...</p>
                </div>
              ) : papers.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No papers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {papers.map((paper, index) => (
                    <motion.div
                      key={paper.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{paper.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Uploaded: {new Date(paper.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(paper.status)}`}>
                          {paper.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Course and Type Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Course</p>
                          <p className="font-medium text-gray-900 dark:text-white">{paper.course_code}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{paper.course_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Type</p>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">{paper.paper_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Year</p>
                          <p className="font-medium text-gray-900 dark:text-white">{paper.year || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Semester</p>
                          <p className="font-medium text-gray-900 dark:text-white">{paper.semester || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Description */}
                      {paper.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          {paper.description}
                        </p>
                      )}

                      {/* File Info */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        📄 {paper.file_name} ({(paper.file_size ? (paper.file_size / 1024).toFixed(2) : '0')} KB)
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;