import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';
  const isDocument = ['doc', 'docx'].includes(fileExtension || '');

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/papers/${paperId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

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
      setPreviewError(true);
    }
  };

  return (
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
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Preview not available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    This file type cannot be previewed in the browser. Please download to view.
                  </p>
                </div>
              ) : isImage ? (
                <img
                  src={`${API_BASE_URL}/uploads/${filePath.split('/').pop()}`}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={() => setPreviewError(true)}
                />
              ) : isPdf ? (
                <iframe
                  src={`${API_BASE_URL}/uploads/${filePath.split('/').pop()}#toolbar=0`}
                  className="w-full h-full rounded-lg"
                  title={fileName}
                  onError={() => setPreviewError(true)}
                />
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
  );
};

export default FilePreviewModal;
