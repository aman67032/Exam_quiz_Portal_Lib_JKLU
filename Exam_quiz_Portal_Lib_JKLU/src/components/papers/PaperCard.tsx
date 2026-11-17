import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import anime from 'animejs';
import {
  Eye,
  Download,
  Share2,
  Calendar,
  Check,
  GraduationCap,
  Layers,
  FileText,
  Sparkles,
  Copy,
  X,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
} from 'lucide-react';

export interface PaperCardProps {
  paper: {
    id: number;
    course_id: number;
    course_code?: string;
    course_name?: string;
    title: string;
    description?: string;
    paper_type: string;
    exam_session?: string | null;
    year: number;
    semester: string;
    department?: string;
    file_name: string;
    file_size?: number;
    uploaded_at: string;
    uploader_name?: string;
    public_link_id?: string;
    public_url?: string;
    download_count?: number;
  };
  onPreview: (paper: any) => void;
  onDownload: (paper: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (paper: any) => void;
}

const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onPreview,
  onDownload,
  isSelected = false,
  onToggleSelect,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const typeUpper = (paper.paper_type || 'ENDTERM').toUpperCase();
  const typeLabel =
    typeUpper === 'ENDTERM'
      ? 'End-Term Exam'
      : typeUpper === 'MIDTERM'
      ? 'Mid-Term Exam'
      : typeUpper;

  const typeBadgeStyle =
    typeUpper === 'ENDTERM'
      ? 'bg-[#E04F33]/15 text-[#E04F33] dark:text-[#FF6B4A] border-[#E04F33]/30'
      : typeUpper === 'MIDTERM'
      ? 'bg-[#896ABD]/15 text-[#6D4AFF] dark:text-[#C4B5FD] border-[#896ABD]/35'
      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

  const accentBarClass =
    typeUpper === 'ENDTERM'
      ? 'from-[#E04F33] via-[#A855F7] to-[#896ABD]'
      : typeUpper === 'MIDTERM'
      ? 'from-[#896ABD] via-[#A855F7] to-[#6366F1]'
      : 'from-emerald-500 to-teal-500';

  // Extract clean session label from exam_session or parenthetical in title
  const sessionText = React.useMemo(() => {
    if (paper.exam_session) return paper.exam_session;
    const match = /\(([^)]+)\)/.exec(paper.title || '');
    if (match && match[1]) return match[1];
    return `${typeLabel} · ${paper.year} Session`;
  }, [paper.exam_session, paper.title, typeLabel, paper.year]);

  const getShareUrl = () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://exam-quiz-portal-lib-jklu.vercel.app';
    const params = new URLSearchParams();
    if (paper.course_code) params.set('q', paper.course_code);
    params.set('paper', String(paper.id));
    return `${origin}/home?${params.toString()}`;
  };

  const shareUrl = getShareUrl();
  const shareTitle = `${paper.course_code ? `${paper.course_code} — ` : ''}${paper.course_name || paper.title}`;
  const shareText = `Check out this JKLU past question paper: ${shareTitle} (${paper.year})`;

  const handleOpenShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareOpen(true);
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        scale: [1, 1.015, 1],
        duration: 320,
        easing: 'easeOutQuad',
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareOpen(false);
      } catch {
        // User cancelled native share sheet
      }
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Verified PDF';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onPreview(paper)}
      className={`paper-card-anim relative overflow-hidden rounded-2xl p-6 sm:p-7 flex flex-col justify-between cursor-pointer group bg-white/90 dark:bg-[#111117]/90 backdrop-blur-sm border shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgb(0,0,0,0.35)] hover:shadow-[0_16px_44px_rgba(137,106,189,0.18)] hover:border-[#896ABD]/60 dark:hover:border-[#A855F7]/50 hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-200 min-h-[268px] transform-gpu ${
        isSelected
          ? 'border-[#896ABD] ring-2 ring-[#896ABD]/40 dark:border-[#A855F7] dark:ring-[#A855F7]/40'
          : 'border-[#E5E2DC]/90 dark:border-white/10'
      }`}
    >
      {/* Subtle Top Gradient Accent Line */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentBarClass} opacity-75 group-hover:opacity-100 transition-opacity`}
      />

      <div>
        {/* Top Row: Select Checkbox + Course Code Badge + Programme Pill + Exam Type */}
        <div className="flex items-center justify-between gap-2.5 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(paper);
                }}
                aria-label={isSelected ? 'Deselect paper' : 'Select paper for batch download'}
                title={isSelected ? 'Selected' : 'Select for batch download (max 5)'}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-[#896ABD] border-[#896ABD] text-white'
                    : 'bg-white/80 dark:bg-white/5 border-[#D4D0C8] dark:border-white/20 text-transparent hover:border-[#896ABD]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="font-mono-tabular text-xs sm:text-sm font-bold tracking-tight px-3 py-1 rounded-lg bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] shadow-sm">
              {paper.course_code || 'COURSE'}
            </span>
            {paper.department && (
              <span className="inline-flex items-center gap-1 font-mono-tabular text-xs font-medium px-2.5 py-1 rounded-lg bg-[#FAF9F6] dark:bg-white/5 border border-[#E5E2DC] dark:border-white/10 text-[#5C5B57] dark:text-[#C4C3BE]">
                <GraduationCap className="w-3.5 h-3.5 text-[#896ABD] dark:text-[#A855F7]" />
                {paper.department}
              </span>
            )}
          </div>

          <span
            className={`font-mono-tabular text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${typeBadgeStyle}`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Main Subject Name & Session Subtitle */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight leading-snug text-[#0A0A0C] dark:text-[#F5F4F0] group-hover:text-[#E04F33] dark:group-hover:text-[#C084FC] transition-colors line-clamp-2">
            {paper.course_name || paper.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-[#5C5B57] dark:text-[#A09F9A]">
            <Sparkles className="w-3.5 h-3.5 text-[#896ABD] dark:text-[#A855F7] shrink-0" />
            <span className="truncate font-medium">{sessionText}</span>
          </div>
        </div>

        {/* Structured Metadata Pills */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-white/[0.04] border border-[#E5E2DC]/80 dark:border-white/[0.07] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E04F33] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#8E8D88]">
                Year
              </div>
              <div className="text-xs sm:text-sm font-mono-tabular font-semibold text-[#0A0A0C] dark:text-[#F5F4F0] truncate">
                {paper.year}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-white/[0.04] border border-[#E5E2DC]/80 dark:border-white/[0.07] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#896ABD] dark:text-[#A855F7] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#8E8D88]">
                Semester
              </div>
              <div className="text-xs sm:text-sm font-mono-tabular font-semibold text-[#0A0A0C] dark:text-[#F5F4F0] truncate">
                Sem {paper.semester}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-white/[0.04] border border-[#E5E2DC]/80 dark:border-white/[0.07] flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#8E8D88]">
                Size
              </div>
              <div className="text-xs sm:text-sm font-mono-tabular font-semibold text-[#0A0A0C] dark:text-[#F5F4F0] truncate">
                {formatSize(paper.file_size)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div
        className="mt-5 pt-4 border-t border-[#E5E2DC]/80 dark:border-white/10 flex items-center gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onPreview(paper)}
          title="Instant PDF Preview"
          className="flex-1 h-11 px-3 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6]/80 dark:bg-white/[0.05] hover:border-[#896ABD] dark:hover:border-[#A855F7] hover:bg-white dark:hover:bg-white/10 text-[#0A0A0C] dark:text-[#F5F4F0] text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all active:scale-95"
        >
          <Eye className="w-4 h-4 text-[#896ABD] dark:text-[#C084FC] shrink-0" />
          <span>Preview</span>
        </button>

        <button
          onClick={() => onDownload(paper)}
          title="Download Official Question Paper PDF"
          className="flex-1 h-11 px-3 rounded-xl bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] hover:bg-[#E04F33] dark:hover:bg-[#A855F7] dark:hover:text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm transition-all active:scale-95"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Download PDF</span>
        </button>

        <button
          onClick={handleOpenShare}
          title="Share Question Paper"
          className="w-11 h-11 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6]/80 dark:bg-white/[0.05] hover:border-[#896ABD] dark:hover:border-[#A855F7] text-[#5C5B57] dark:text-[#C4C3BE] inline-flex items-center justify-center transition-all active:scale-95 shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Share Popup Modal (Apps + Copy Link) */}
      {shareOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShareOpen(false)}
          >
            <div
              className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#14141B] border border-[#E5E2DC] dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#896ABD] dark:text-[#C084FC] font-semibold">
                    Share Question Paper
                  </span>
                  <h4 className="text-base font-bold text-[#0A0A0C] dark:text-[#F5F4F0] truncate mt-0.5">
                    {shareTitle}
                  </h4>
                </div>
                <button
                  onClick={() => setShareOpen(false)}
                  className="p-1.5 rounded-lg text-[#5C5B57] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Close share popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Share Apps Grid */}
              <div className="grid grid-cols-4 gap-2.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[11px] font-medium">WhatsApp</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Telegram</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Email</span>
                </a>

                {typeof navigator !== 'undefined' && 'share' in navigator ? (
                  <button
                    onClick={handleNativeShare}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#896ABD]/15 hover:bg-[#896ABD]/25 text-[#6D4AFF] dark:text-[#C4B5FD] transition-colors"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-[11px] font-medium">More Apps</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#896ABD]/15 hover:bg-[#896ABD]/25 text-[#6D4AFF] dark:text-[#C4B5FD] transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span className="text-[11px] font-medium">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {/* Copy Link Input Row */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C] border border-[#E5E2DC] dark:border-white/10">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 bg-transparent text-xs font-mono-tabular text-[#5C5B57] dark:text-[#C4C3BE] px-2 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] hover:bg-[#896ABD] dark:hover:bg-[#A855F7] dark:hover:text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PaperCard;
