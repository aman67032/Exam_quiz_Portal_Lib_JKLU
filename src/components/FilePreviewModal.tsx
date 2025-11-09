import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image, AlertCircle } from 'lucide-react';
import Toast from './Toast';
import { API } from '../utils/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Helper function to construct image URL from path
const getImageUrl = (filePath: string | undefined): string => {
  if (!filePath) return '';
  
  // If path already starts with http:// or https://, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Extract filename from path (handles both Windows and Unix paths)
  let fileName = filePath.split(/[\\\/]/).pop() || filePath;
  
  // Remove 'uploads/' prefix if present in filename
  fileName = fileName.replace(/^uploads[\\\/]/, '');
  
  // If path already contains 'uploads/', use it directly
  if (filePath.includes('uploads/') || filePath.includes('uploads\\')) {
    // Extract everything after 'uploads/' or 'uploads\'
    const match = filePath.match(/uploads[\\\/](.+)$/);
    if (match && match[1]) {
      fileName = match[1].replace(/[\\\/]/g, '/'); // Normalize to forward slashes
    }
  }
  
  // Construct URL
  return `${API_BASE_URL}/uploads/${fileName}`;
};

// Helper to get preview URL using download endpoint
const getPreviewUrl = (paperId: number, token: string): string => {
  const authToken = token || localStorage.getItem('token') || '';
  return `${API_BASE_URL}/papers/${paperId}/download${authToken ? `?token=${authToken}` : ''}`;
};

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  filePath: string;
  paperId: number;
  token: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  filePath,
  paperId,
  token
}) => {
  const [previewError, setPreviewError] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const pdfUrlRef = useRef<string>('');
  const [toast, setToast] = useState({ 
    show: false, 
    message: '', 
    type: 'success' as 'success' | 'error' | 'info' 
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
  };

  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';
  const isDocument = ['doc', 'docx'].includes(fileExtension || '');

  // Load PDF preview URL when modal opens
  useEffect(() => {
    if (isOpen && isPdf && !previewError) {
      setPreviewLoading(true);
      let blobUrl: string | null = null;
      
      // Create blob URL from download endpoint for PDF preview
      const loadPdfPreview = async () => {
        try {
          const authToken = token || localStorage.getItem('token') || '';
          const response = await fetch(
            `${API_BASE_URL}/papers/${paperId}/download`,
            {
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to load PDF' }));
            throw new Error(errorData.detail || 'Failed to load PDF');
          }

          const blob = await response.blob();
          blobUrl = window.URL.createObjectURL(blob);
          pdfUrlRef.current = blobUrl;
          setPdfUrl(blobUrl);
          setPreviewLoading(false);
        } catch (error: any) {
          console.error('PDF preview error:', error);
          setPreviewError(true);
          setPreviewLoading(false);
          const errorMessage = error?.message || 'Failed to load PDF preview. Please download to view.';
          showToast(errorMessage, 'error');
        }
      };

      loadPdfPreview();

      // Cleanup blob URL on unmount or when dependencies change
      return () => {
        if (blobUrl) {
          window.URL.revokeObjectURL(blobUrl);
        }
        if (pdfUrlRef.current) {
          window.URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = '';
        }
      };
    } else if (!isOpen) {
      // Reset states when modal closes
      setPreviewError(false);
      setPreviewLoading(true);
      if (pdfUrlRef.current) {
        window.URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = '';
      }
      setPdfUrl('');
    }
  }, [isOpen, isPdf, paperId, token]);

  const handleDownload = async () => {
    try {
      // Use API client for consistent error handling
      const response = await API.downloadPaper(paperId);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('File downloaded successfully!', 'success');
    } catch (error: any) {
      console.error('Download error:', error);
      // Extract error message from API response
      const errorMessage = error?.response?.data?.detail || 
                         error?.response?.data?.message || 
                         error?.message || 
                         'Failed to download file. The file may not exist on the server.';
      showToast(errorMessage, 'error');
      setPreviewError(true);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {isImage ? (
                  <Image className="w-6 h-6 text-blue-500" />
                ) : isPdf ? (
                  <FileText className="w-6 h-6 text-red-500" />
                ) : (
                  <FileText className="w-6 h-6 text-orange-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{fileName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isImage ? 'Image' : isPdf ? 'PDF Document' : 'Document'} Preview
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              {previewError ? (
                <div className="text-center p-8">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Preview not available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {isPdf 
                      ? 'Unable to load PDF preview. The file may not exist on the server or there was an error loading it.'
                      : 'This file type cannot be previewed in the browser. Please download to view.'}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                </div>
              ) : isImage ? (
                <img
                  src={getImageUrl(filePath)}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={() => {
                    console.error('Image load error:', { filePath, url: getImageUrl(filePath) });
                    setPreviewError(true);
                    showToast('Failed to load image. Please try downloading the file.', 'error');
                  }}
                />
              ) : isPdf ? (
                <>
                  {previewLoading ? (
                    <div className="text-center p-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-600 dark:text-gray-400">Loading PDF preview...</p>
                    </div>
                  ) : pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=0`}
                      className="w-full h-full min-h-[500px] rounded-lg border border-gray-200 dark:border-gray-700"
                      title={fileName}
                      onError={() => {
                        console.error('PDF iframe load error');
                        setPreviewError(true);
                        showToast('Failed to display PDF. Please download to view.', 'error');
                      }}
                    />
                  ) : (
                    <div className="text-center p-8">
                      <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to load PDF preview</p>
                      <button
                        onClick={handleDownload}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  )}
                </>
              ) : isDocument ? (
                <div className="text-center">
                  <FileText className="w-24 h-24 text-orange-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Document Preview</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Document files cannot be previewed directly. Download to view in your application.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Document</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">File type not recognized</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isImage ? 'Image files support: JPG, PNG, GIF' : 'PDF and document files'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default FilePreviewModal;
