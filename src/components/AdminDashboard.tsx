import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Upload, Edit2, Trash2, LogOut, BarChart3, User, Eye } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import FilePreviewModal from './FilePreviewModal';

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

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingPapers, setPendingPapers] = useState<Paper[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // File Preview Modal State
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    filePath: '',
    paperId: 0
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

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, papersRes, coursesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/papers/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setPendingPapers(papersRes.data);
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

  const editPaper = async (paperId: number) => {
    try {
      // Use FormData for the request
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

  const openEditModal = (paper: Paper) => {
    setEditPaperModal({ isOpen: true, paper });
    setEditPaperForm({
      course_id: paper.course_code || '',
      paper_type: paper.paper_type,
      year: paper.year?.toString() || '',
      semester: paper.semester || ''
    });
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

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Upload className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
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
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 flex space-x-1"
        >
          {['dashboard', 'pending', 'courses'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <BarChart3 className="mr-2" />
              Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Papers', value: stats.total_papers, color: 'text-gray-800' },
                { label: 'Pending Review', value: stats.pending_papers, color: 'text-yellow-600' },
                { label: 'Approved', value: stats.approved_papers, color: 'text-green-600' },
                { label: 'Rejected', value: stats.rejected_papers, color: 'text-red-600' },
                { label: 'Total Courses', value: stats.total_courses, color: 'text-indigo-600' },
                { label: 'Total Users', value: stats.total_users, color: 'text-purple-600' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="card"
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pending Papers Tab */}
        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Pending Papers ({pendingPapers.length})
            </h2>
            {pendingPapers.length === 0 ? (
              <div className="card text-center text-gray-500 dark:text-gray-400">
                No pending papers to review
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPapers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{paper.title}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">{paper.course_code}</span> - {paper.course_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Uploaded by {paper.uploader_name} ({paper.uploader_email})
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                        {paper.paper_type}
                      </span>
                    </div>

                    {paper.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{paper.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {paper.year && `Year: ${paper.year}`}
                        {paper.semester && ` | ${paper.semester}`}
                      </div>
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => setPreviewModal({
                            isOpen: true,
                            fileName: paper.file_name,
                            filePath: paper.file_path || '',
                            paperId: paper.id
                          })}
                          className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye size={18} />
                          <span>View</span>
                        </motion.button>
                        <motion.button
                          onClick={() => openEditModal(paper)}
                          className="flex items-center space-x-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit2 size={18} />
                          <span>Edit</span>
                        </motion.button>
                        <motion.button
                          onClick={() => reviewPaper(paper.id, 'approved')}
                          className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle size={18} />
                          <span>Approve</span>
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) reviewPaper(paper.id, 'rejected', reason);
                          }}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle size={18} />
                          <span>Reject</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Courses</h2>

            {/* Course Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card mb-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Code
                    </label>
                    <input
                      type="text"
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                      className="input-field"
                      placeholder="CS1108"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Name
                    </label>
                    <input
                      type="text"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                      className="input-field"
                      placeholder="Python Programming"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    onClick={handleCourseSubmit}
                    disabled={loading || !courseForm.code || !courseForm.name}
                    className="px-6 py-2 btn-primary disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingCourse ? 'Update' : 'Create'} Course
                  </motion.button>
                  {editingCourse && (
                    <motion.button
                      onClick={() => {
                        setEditingCourse(null);
                        setCourseForm({ code: '', name: '', description: '' });
                      }}
                      className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
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
                  className="card flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {course.code} - {course.name}
                    </div>
                    {course.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                      className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      onClick={() => deleteCourse(course.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
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

      {/* Edit Paper Modal */}
      {editPaperModal.isOpen && editPaperModal.paper && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditPaperModal({ isOpen: false, paper: null })}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Edit Paper: {editPaperModal.paper.title}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={editPaperForm.course_id}
                  onChange={(e) => setEditPaperForm({ ...editPaperForm, course_id: e.target.value })}
                  className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paper Type
                  </label>
                  <select
                    value={editPaperForm.paper_type}
                    onChange={(e) => setEditPaperForm({ ...editPaperForm, paper_type: e.target.value })}
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
                    Year
                  </label>
                  <input
                    type="number"
                    value={editPaperForm.year}
                    onChange={(e) => setEditPaperForm({ ...editPaperForm, year: e.target.value })}
                    className="input-field"
                    min="2020"
                    max="2030"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={editPaperForm.semester}
                    onChange={(e) => setEditPaperForm({ ...editPaperForm, semester: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select semester</option>
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                    <option value="Summer 2024">Summer 2024</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={() => setEditPaperModal({ isOpen: false, paper: null })}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => editPaper(editPaperModal.paper!.id)}
                  className="px-6 py-2 btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;