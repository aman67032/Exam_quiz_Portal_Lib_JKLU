import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, FileText, Search, Filter, Eye } from 'lucide-react';
import axios from 'axios';
import FilePreviewModal from './FilePreviewModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
  uploaded_at: string;
}

const PublicHome: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    course_code: '',
    paper_type: '',
    year: ''
  });

  // Preview Modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    filePath: '',
    paperId: 0
  });

  const paperTypes = ['quiz', 'midterm', 'endterm', 'assignment', 'project'];
  const years = ['2025', '2024', '2023', '2022'];

  useEffect(() => {
    fetchPublicPapers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, papers]);

  const fetchPublicPapers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/papers/public/all`);
      setPapers(response.data);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = papers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(query) ||
          paper.description?.toLowerCase().includes(query) ||
          paper.course_code?.toLowerCase().includes(query) ||
          paper.uploader_name?.toLowerCase().includes(query)
      );
    }

    // Course filter
    if (filters.course_code) {
      filtered = filtered.filter((paper) => paper.course_code === filters.course_code);
    }

    // Paper type filter
    if (filters.paper_type) {
      filtered = filtered.filter((paper) => paper.paper_type === filters.paper_type);
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter((paper) => paper.year?.toString() === filters.year);
    }

    setFilteredPapers(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleDownload = async (paperId: number, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/papers/${paperId}/download`);

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download paper');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-lg border-b-4 border-blue-600"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <BookOpen className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paper Portal</h1>
                <p className="text-gray-600 dark:text-gray-400">Browse Approved Academic Papers</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Student Login
              </motion.a>
              <motion.a
                href="/admin-login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                Admin Login
              </motion.a>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <div className="space-y-6">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Search className="inline w-4 h-4 mr-2" />
                Search Papers
              </label>
              <input
                type="text"
                placeholder="Search by title, author, description, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="font-semibold text-gray-700 dark:text-gray-300">Filters</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.paper_type}
                  onChange={(e) => handleFilterChange('paper_type', e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Paper Types</option>
                  {paperTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter by course code..."
                  value={filters.course_code}
                  onChange={(e) => handleFilterChange('course_code', e.target.value.toUpperCase())}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Papers Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
          </div>
        ) : filteredPapers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center"
          >
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">No papers found</p>
            <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or filter criteria</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                      {paper.title}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full whitespace-nowrap ml-2">
                      {paper.paper_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {paper.course_code && (
                      <>
                        <span className="font-semibold">{paper.course_code}</span> - {paper.course_name}
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    By {paper.uploader_name} • {new Date(paper.uploaded_at).toLocaleDateString()}
                  </p>
                </div>

                {paper.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                    {paper.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {paper.year && `Year: ${paper.year}`}
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          fileName: paper.file_name,
                          filePath: paper.file_path || '',
                          paperId: paper.id
                        })
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDownload(paper.id, paper.file_name)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredPapers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-gray-600 dark:text-gray-400"
          >
            <p>
              Showing <span className="font-bold text-gray-900 dark:text-white">{filteredPapers.length}</span> of{' '}
              <span className="font-bold text-gray-900 dark:text-white">{papers.length}</span> papers
            </p>
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
        token=""
      />
    </div>
  );
};

export default PublicHome;
