import React from 'react';
import { ConfirmDialogState } from '../types';

interface ConfirmDialogModalProps {
  dialog: ConfirmDialogState;
  onResolve: (confirmed: boolean) => void;
}

const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({ dialog, onResolve }) => {
  if (!dialog.isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={() => onResolve(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E6E4DD] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#111115] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-[#0A0A0C] dark:text-[#F5F4F0] mb-2">
          {dialog.title}
        </h3>
        <p className="text-sm text-[#5C5B57] dark:text-[#94938E] mb-6 leading-relaxed">
          {dialog.message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="px-4 py-2 rounded-lg border border-[#E6E4DD] dark:border-white/10 text-sm font-medium text-[#5C5B57] dark:text-[#94938E] hover:bg-[#F3F1EA] dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              dialog.tone === 'danger'
                ? 'bg-[#E04F33] hover:bg-[#c94127]'
                : 'bg-[#4F46E5] hover:bg-[#4338CA]'
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialogModal;
