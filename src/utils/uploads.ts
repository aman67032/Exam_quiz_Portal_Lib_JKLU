const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://web-production-6beea.up.railway.app';

/**
 * Build a fully-qualified URL for files stored in the backend uploads directory.
 * Handles absolute URLs, Windows/Unix separators, and encodes special characters.
 */
export const buildUploadUrl = (filePath?: string): string => {
  if (!filePath) return '';

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  let relativePath = filePath;

  // Remove any leading uploads/ or uploads\ prefix
  relativePath = relativePath.replace(/^uploads[\\\/]/, '');

  // If original path contains uploads/ somewhere in the middle, keep only part after it
  const match = relativePath.match(/uploads[\\\/](.+)$/);
  if (match && match[1]) {
    relativePath = match[1];
  }

  // Normalize separators and encode each segment
  const encoded = relativePath
    .split(/[\\\/]/)
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${API_BASE_URL}/uploads/${encoded}`;
};

export const API_BASE_UPLOADS_URL = `${API_BASE_URL}/uploads`;

