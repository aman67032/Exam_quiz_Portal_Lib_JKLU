import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Filter, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeErrorMessage } from '@/utils/errorSanitizer';
import Toast from '@/components/ui/Toast';
import Loader from '@/components/ui/Loader';
import AeroShards from '@/components/layout/AeroShards';
import StudentNavbar from '@/components/layout/StudentNavbar';

const MAX_UPLOAD_BYTES = 500 * 1024; // 500 KB

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
  uploaded_by?: number;
  course_code?: string;
  course_name?: string;
  admin_feedback?: {
    message?: string;
    rejected_at?: string;
    rejected_by?: number;
  } | null;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    course_id: '',
    courseText: '',
    courseName: '',
    title: '',
    description: '',
    paper_type: 'assignment',
    quiz_set: '',
    year: new Date().getFullYear().toString(),
    yearText: '',
    semester: '1st Sem'
  });

  // Filters
  const [filters, setFilters] = useState({
    course_id: '',
    paper_type: '',
    year: '',
    semester: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchCourses = useCallback(async () => {
    try {
      const response = await API.getCourses();
      setCourses(response.data);
    } catch {
      // ignore silent course load error
    }
  }, []);

  const fetchPapers = useCallback(async () => {
    try {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      const params: Record<string, any> = {
        my_papers_only: true
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await API.getPapers(params);
      setPapers(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_UPLOAD_BYTES) {
      showToast('File size must be 500 KB or less.', 'error');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(user as any)?.id_verified && localStorage.getItem('idVerified') !== 'yes') {
      showToast('Please upload your ID card in Profile to enable uploads', 'error');
      navigate('/profile');
      return;
    }
    if (!selectedFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }
    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      showToast('File size must be 500 KB or less.', 'error');
      return;
    }
    if (!uploadForm.course_id && (!uploadForm.courseText || !uploadForm.courseName)) {
      showToast('Please select or enter both course code and name', 'error');
      return;
    }
    if (uploadForm.paper_type === 'quiz' && !uploadForm.quiz_set) {
      showToast('Please select a quiz set (A to F)', 'error');
      return;
    }
    if (!uploadForm.year && !uploadForm.yearText) {
      showToast('Please select or enter a year', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    if (uploadForm.course_id) {
      formData.append('course_id', uploadForm.course_id);
    } else if (uploadForm.courseText && uploadForm.courseName) {
      formData.append('course_code', uploadForm.courseText);
      formData.append('course_name', uploadForm.courseName);
    }

    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('paper_type', uploadForm.paper_type);

    if (uploadForm.paper_type === 'quiz' && uploadForm.quiz_set) {
      formData.append('quiz_set', uploadForm.quiz_set);
    }

    const yearValue = uploadForm.year || uploadForm.yearText;
    if (yearValue) {
      formData.append('year', yearValue.toString());
    }

    formData.append('semester', uploadForm.semester);

    try {
      await API.uploadPaper(formData);
      showToast('Paper uploaded successfully!', 'success');
      setSelectedFile(null);
      setUploadForm({
        course_id: '',
        courseText: '',
        courseName: '',
        title: '',
        description: '',
        paper_type: 'assignment',
        quiz_set: '',
        year: new Date().getFullYear().toString(),
        yearText: '',
        semester: '1st Sem'
      });
      fetchPapers();
    } catch (error: any) {
      showToast(sanitizeErrorMessage(error?.message, 'Error'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'approved':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'rejected':
        return 'text-red-700 dark:text-red-400 bg-red-500/15 border-red-500/30';
      default:
        return 'text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30';
    }
  }, []);

  const handleDownload = async (paperId: number, fileName: string) => {
    try {
      const response = await API.downloadPaper(paperId, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('File downloaded successfully!', 'success');
    } catch (error: any) {
      showToast(sanitizeErrorMessage(error?.message, 'Error'), 'error');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-[#0A0A0C]/80 border border-[#E5E2DC] dark:border-[#232329] rounded-xl text-sm text-[#0A0A0C] dark:text-[#F5F4F0] placeholder-[#5C5B57]/60 dark:placeholder-[#94938E]/60 focus:outline-none focus:border-[#896ABD] dark:focus:border-[#A855F7] transition-colors';

  const isVerified = Boolean((user as any)?.id_verified || localStorage.getItem('idVerified') === 'yes');

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] pt-[env(safe-area-inset-top)]">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AeroShards />
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <StudentNavbar active="dashboard" subtitle="Student Dashboard" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5">
        {/* Verification Status Bar */}
        <div className="rounded-2xl p-4 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
              {isVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isVerified ? 'University ID Verified' : 'ID Verification Required to Upload'}
              </p>
              <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
                {isVerified
                  ? 'You can upload past question papers (PDF up to 500 KB).'
                  : 'Complete your Roll Number, Student ID, and ID Card upload in Profile.'}
              </p>
            </div>
          </div>
          {!isVerified && (
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-xl bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              Verify in Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Upload Paper Form */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#896ABD] to-[#E04F33] text-white shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">Upload Paper</h2>
                <p className="text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">
                  PDF · MAX 500 KB
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                  Course (Select or Enter)
                </label>
                <select
                  value={uploadForm.course_id}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, course_id: e.target.value, courseText: '', courseName: '' }))}
                  className={inputClass}
                >
                  <option value="">Select from existing courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
                <div className="text-center text-[11px] font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">
                  OR
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={uploadForm.courseText}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, courseText: e.target.value, course_id: '' }))}
                    placeholder="Code (e.g., CS1109)"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={uploadForm.courseName}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, courseName: e.target.value, course_id: '' }))}
                    placeholder="Name (e.g., Python)"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={inputClass}
                  placeholder="Paper title"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Type
                  </label>
                  <select
                    value={uploadForm.paper_type}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, paper_type: e.target.value, quiz_set: '' }))}
                    className={inputClass}
                  >
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="midterm">Midterm</option>
                    <option value="endterm">Endterm</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Semester
                  </label>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, semester: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="1st Sem">1st Sem</option>
                    <option value="2nd Sem">2nd Sem</option>
                    <option value="3rd Sem">3rd Sem</option>
                    <option value="4th Sem">4th Sem</option>
                    <option value="5th Sem">5th Sem</option>
                    <option value="6th Sem">6th Sem</option>
                    <option value="7th Sem">7th Sem</option>
                    <option value="8th Sem">8th Sem</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Year
                  </label>
                  <select
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, year: e.target.value, yearText: '' }))}
                    className={inputClass}
                  >
                    <option value="">Select year</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Or Type Year
                  </label>
                  <input
                    type="number"
                    value={uploadForm.yearText}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, yearText: e.target.value, year: '' }))}
                    placeholder="e.g., 2025"
                    className={inputClass}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>

              {uploadForm.paper_type === 'quiz' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Quiz Set
                  </label>
                  <select
                    value={uploadForm.quiz_set}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, quiz_set: e.target.value }))}
                    className={inputClass}
                    required
                  >
                    <option value="">Select Set</option>
                    <option value="A">Set A</option>
                    <option value="B">Set B</option>
                    <option value="C">Set C</option>
                    <option value="D">Set D</option>
                    <option value="E">Set E</option>
                    <option value="F">Set F</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                  File (Max 500 KB)
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#0A0A0C]/80 border border-[#E5E2DC] dark:border-[#232329] rounded-xl text-xs sm:text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#896ABD]/15 file:text-[#896ABD] dark:file:text-[#C084FC] cursor-pointer"
                  accept=".pdf"
                  required
                />
                {selectedFile && (
                  <p className="text-xs text-[#5C5B57] dark:text-[#94938E] font-mono-tabular">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#896ABD] to-[#E04F33] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload Paper'}</span>
              </button>
            </form>
          </motion.section>

          {/* My Papers List */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-7 rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm flex flex-col"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#896ABD]/15 text-[#896ABD] dark:text-[#C084FC]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <span>My Submissions</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono-tabular bg-[#896ABD]/15 text-[#896ABD] dark:text-[#C084FC]">
                      {papers.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
                    Track approval status and feedback
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">
                <Filter className="w-3.5 h-3.5 text-[#896ABD]" />
                <span>Filters</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <select
                name="course_id"
                value={filters.course_id}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code}
                  </option>
                ))}
              </select>

              <select
                name="paper_type"
                value={filters.paper_type}
                onChange={handleFilterChange}
                className={inputClass}
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
                className={inputClass}
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>

              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="">All Semesters</option>
                <option value="1st Sem">1st Sem</option>
                <option value="2nd Sem">2nd Sem</option>
                <option value="3rd Sem">3rd Sem</option>
                <option value="4th Sem">4th Sem</option>
                <option value="5th Sem">5th Sem</option>
                <option value="6th Sem">6th Sem</option>
                <option value="7th Sem">7th Sem</option>
                <option value="8th Sem">8th Sem</option>
              </select>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader />
              </div>
            ) : papers.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#896ABD]/10 border border-[#896ABD]/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[#896ABD]" />
                </div>
                <p className="text-sm font-semibold">No papers submitted yet</p>
                <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
                  Use the upload form to submit your first question paper.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{paper.title}</h3>
                        <p className="text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">
                          {new Date(paper.uploaded_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono-tabular font-semibold border uppercase shrink-0 ${getStatusColor(paper.status)}`}>
                        {paper.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111117] border border-[#E5E2DC] dark:border-[#232329]">
                        <span className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E] block">Course</span>
                        <span className="font-semibold">{paper.course_code || 'N/A'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111117] border border-[#E5E2DC] dark:border-[#232329]">
                        <span className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E] block">Type</span>
                        <span className="font-semibold capitalize">{paper.paper_type}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111117] border border-[#E5E2DC] dark:border-[#232329]">
                        <span className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E] block">Year</span>
                        <span className="font-semibold">{paper.year || 'N/A'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111117] border border-[#E5E2DC] dark:border-[#232329]">
                        <span className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E] block">Semester</span>
                        <span className="font-semibold">{paper.semester || 'N/A'}</span>
                      </div>
                    </div>

                    {paper.status === 'rejected' && paper.admin_feedback && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-400">
                        <span className="font-semibold">Feedback: </span>
                        {paper.admin_feedback.message || 'Your submission was rejected.'}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E2DC] dark:border-[#232329] text-xs">
                      <span className="text-[#5C5B57] dark:text-[#94938E] truncate max-w-full">
                        {paper.file_name} ({paper.file_size ? (paper.file_size / 1024).toFixed(1) : '0'} KB)
                      </span>
                      {paper.status === 'approved' && (
                        <button
                          onClick={() => handleDownload(paper.id, paper.file_name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
