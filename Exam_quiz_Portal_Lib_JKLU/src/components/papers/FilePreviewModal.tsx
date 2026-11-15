import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image, AlertCircle } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { API } from '@/utils/api';
import { buildUploadUrl } from '@/utils/uploads';
import Loader from '@/components/ui/Loader';
import MobilePdfViewer from '@/components/papers/MobilePdfViewer';

// Helper function to construct image URL from path
const getImageUrl = (filePath: string | undefined): string => {
  return buildUploadUrl(filePath);
};

// Helper to get inline preview URL
const getPreviewUrl = (paperId: number): string => {
  return `${API.baseURL}/papers/${paperId}/preview`;
};

const getDownloadUrl = (paperId: number): string => {
  return `${API.baseURL}/papers/${paperId}/download`;
};

const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
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
  const [retryKey, setRetryKey] = useState(0); // Force reload on retry
  const [errorMessage, setErrorMessage] = useState<string>(''); // Store specific error message
  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobileDevice());
  const pdfUrlRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [toast, setToast] = useState({ 
    show: false, 
    message: '', 
    type: 'success' as 'success' | 'error' | 'info' 
  });

  // Sync mobile detection on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(detectMobileDevice());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
  };

  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';
  const isDocument = ['doc', 'docx'].includes(fileExtension || '');

  // Cleanup function to revoke blob URLs
  const cleanupBlobUrl = useCallback(() => {
    if (pdfUrlRef.current) {
      try {
        window.URL.revokeObjectURL(pdfUrlRef.current);
      } catch (e) {
        console.warn('Error revoking blob URL:', e);
      }
      pdfUrlRef.current = '';
    }
    setPdfUrl('');
  }, []);

  // Load PDF preview URL when modal opens
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanupBlobUrl();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanupBlobUrl]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setPreviewError(false);
      setPreviewLoading(true);
      setErrorMessage('');
      if (!isPdf) {
        // For images, loading will be handled by onLoad/onError
        setPreviewLoading(false);
      }
    } else {
      // Cleanup when modal closes
      setPreviewError(false);
      setPreviewLoading(true);
      setErrorMessage('');
      cleanupBlobUrl();
    }
  }, [isOpen, cleanupBlobUrl, isPdf]);

  // Load PDF when modal opens or paperId changes (only for desktop)
  useEffect(() => {
    if (!isOpen || !isPdf || isMobile) {
      // On mobile, skip blob URL creation
      if (isMobile) {
        setPreviewLoading(false);
      }
      return;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setPreviewLoading(true);
    setPreviewError(false);
    
    // Cleanup previous blob URL if exists
    cleanupBlobUrl();
    
    // Create blob URL from download endpoint for PDF preview
    const loadPdfPreview = async () => {
      try {
        const authToken = token || localStorage.getItem('token') || '';

        const response = await fetch(
          getPreviewUrl(paperId),
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            signal // Add abort signal
          }
        );

        if (signal.aborted) {
          return; // Request was cancelled
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to load PDF' }));
          const errorMsg = errorData.detail || `Failed to load PDF (${response.status})`;
          setErrorMessage(errorMsg);
          throw new Error(errorMsg);
        }

        const blob = await response.blob();
        
        if (signal.aborted) {
          return; // Request was cancelled after blob received
        }

        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        pdfUrlRef.current = blobUrl;
        setPdfUrl(blobUrl);
        setPreviewLoading(false);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Request was cancelled, don't show error
          return;
        }
        console.error('PDF preview error:', error);
        setPreviewError(true);
        setPreviewLoading(false);
        const errorMsg = error?.message || 'Failed to load PDF preview. Please download to view.';
        setErrorMessage(errorMsg);
        showToast(errorMsg, 'error');
      }
    };

    loadPdfPreview();
  }, [isOpen, isPdf, paperId, token, cleanupBlobUrl, retryKey, isMobile]);

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
      const errorMsg = error?.response?.data?.detail || 
                         error?.response?.data?.message || 
                         error?.message || 
                         'Failed to download file. The file may not exist on the server.';
      setErrorMessage(errorMsg);
      showToast(errorMsg, 'error');
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={onClose}
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl max-w-4xl w-full h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {isImage ? (
                  <Image className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                ) : isPdf ? (
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{fileName}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {isImage ? 'Image' : isPdf ? 'PDF Document' : 'Document'} Preview
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
                aria-label="Close"
                type="button"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
              {previewError ? (
                <div className="text-center p-8">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Preview not available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                    {errorMessage || (isPdf 
                      ? 'Unable to load PDF preview. The file may not exist on the server or there was an error loading it.'
                      : 'This file type cannot be previewed in the browser. Please download to view.')}
                  </p>
                  <div className="flex gap-3 justify-center">
                    {isPdf && (
                      <button
                        onClick={() => {
                          setPreviewError(false);
                          setPreviewLoading(true);
                          setErrorMessage('');
                          cleanupBlobUrl();
                          // Force reload by incrementing retry key
                          setRetryKey(prev => prev + 1);
                        }}
                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                      >
                        <span>Retry Preview</span>
                      </button>
                    )}
                    <button
                      onClick={handleDownload}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              ) : isImage ? (
                previewError ? (
                  <div className="text-center p-8">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Image not available</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                      {errorMessage || 'Failed to load image. This file may have been stored in a previous database and is no longer available.'}
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Try Download</span>
                    </button>
                  </div>
                ) : (
                  <img
                    src={getImageUrl(filePath)}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onLoad={() => {
                      setPreviewLoading(false);
                      setPreviewError(false);
                    }}
                    onError={() => {
                      console.error('Image load error:', { filePath, url: getImageUrl(filePath) });
                      const errorMsg = 'Failed to load image. This file may have been stored in a previous database and is no longer available.';
                      setErrorMessage(errorMsg);
                      setPreviewError(true);
                      setPreviewLoading(false);
                      showToast(errorMsg, 'error');
                    }}
                  />
                )
              ) : isPdf ? (
                <>
                  {isMobile ? (
                    // Mobile: Client-side PDF.js canvas preview + Open Full PDF button (no gview)
                    <div className="w-full h-full flex flex-col gap-2.5">
                      <MobilePdfViewer url={getPreviewUrl(paperId)} token={token} />
                      <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 shrink-0 -mb-1">
                        For better viewing &amp; zoom, open the full PDF:
                      </p>
                      <a
                        href={getPreviewUrl(paperId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors inline-flex items-center justify-center space-x-2 text-sm font-medium min-h-[42px] touch-manipulation w-full shrink-0"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Open Full PDF</span>
                      </a>
                    </div>
                  ) : (
                    // Desktop: Use iframe for preview
                    <>
                      {previewLoading ? (
                        <div className="text-center p-8">
                          <Loader />
                        </div>
                      ) : pdfUrl ? (
                        <iframe
                          key={pdfUrl} // Force re-render when URL changes
                          src={`${pdfUrl}#toolbar=0`}
                          className="w-full h-full min-h-[500px] rounded-lg border border-gray-200 dark:border-gray-700"
                          title={fileName}
                          onLoad={() => {
                            // Iframe loaded successfully
                            setPreviewLoading(false);
                          }}
                          onError={() => {
                            console.error('PDF iframe load error');
                            // Try to reload after a short delay
                            setTimeout(() => {
                              if (pdfUrlRef.current) {
                                // Blob URL might be invalid, try to reload
                                const currentUrl = pdfUrlRef.current;
                                setPdfUrl(''); // Clear to trigger reload
                                setTimeout(() => {
                                  setPdfUrl(currentUrl);
                                }, 100);
                              } else {
                                setPreviewError(true);
                                showToast('Failed to display PDF. Please download to view.', 'error');
                              }
                            }, 1000);
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-5 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
              <p className="hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {isImage ? 'Image files support: JPG, PNG, GIF' : 'PDF and document files'}
              </p>
              <div className="flex flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors font-medium text-sm min-h-[42px] sm:min-h-0 touch-manipulation"
                  type="button"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm flex items-center justify-center space-x-2 min-h-[42px] sm:min-h-0 touch-manipulation"
                  type="button"
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
