import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Eye, User, Shield } from 'lucide-react';

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
      className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 group"
    >
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {paper.title}
          </h3>
          <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-full whitespace-nowrap ml-2 shadow-md">
            {paper.paper_type}
          </span>
        </div>
        {paper.course_code && (
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>{paper.course_code}</span>
            {paper.course_name && <span className="text-gray-600 dark:text-gray-400">- {paper.course_name}</span>}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2">
          <User className="w-3.5 h-3.5" />
          <span>{paper.uploader_name}</span>
          <span>•</span>
          <span>{new Date(paper.uploaded_at).toLocaleDateString()}</span>
        </p>
      </div>

      {paper.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
          {paper.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {paper.year && `Year ${paper.year}`}
        </div>
        <div className="flex space-x-2">
          <motion.button
            onClick={() => onPreview(paper.id, paper.file_name, paper.file_path || '')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => onDownload(paper.id, paper.file_name)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

PaperCard.displayName = 'PaperCard';

export default PaperCard;

