import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, User, Shield } from 'lucide-react';

interface PaperCardProps {
  paper: {
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
  };
  index: number;
  onPreview: (paperId: number, fileName: string, filePath: string) => void;
  onDownload: (paperId: number, fileName: string) => void;
}

const PaperCard: React.FC<PaperCardProps> = memo(({ paper, index, onPreview, onDownload }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 group"
    >
      <div className="mb-3 sm:mb-4">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors min-w-0">
            {paper.title}
          </h3>
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
            {paper.paper_type}
          </span>
        </div>
        {paper.course_code && (
          <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 sm:mb-2 flex items-center gap-1 flex-wrap">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="truncate">{paper.course_code}</span>
            {paper.course_name && <span className="text-gray-600 dark:text-gray-400 truncate">- {paper.course_name}</span>}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          <span className="truncate">{paper.uploader_name}</span>
          <span>•</span>
          <span>{new Date(paper.uploaded_at).toLocaleDateString()}</span>
        </p>
      </div>

      {paper.description && (
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
          {paper.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-gray-700/50 gap-2">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
          {paper.year && `Year ${paper.year}`}
        </div>
        <div className="flex space-x-1.5 sm:space-x-2 flex-shrink-0">
          <motion.button
            onClick={() => onPreview(paper.id, paper.file_name, paper.file_path || '')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 sm:p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
          <motion.button
            onClick={() => onDownload(paper.id, paper.file_name)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 sm:p-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
            title="Download"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

PaperCard.displayName = 'PaperCard';

export default PaperCard;

