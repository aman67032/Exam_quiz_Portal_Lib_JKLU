import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import anime from 'animejs';
import {
  Search,
  X,
  SlidersHorizontal,
  BookOpen,
  Upload,
  LogOut,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  User,
} from 'lucide-react';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import JKLULogo from '@/components/layout/JKLULogo';
import Footer from '@/components/layout/Footer';
import AeroShards from '@/components/layout/AeroShards';
import PaperCard from '@/components/papers/PaperCard';
import FilePreviewModal from '@/components/papers/FilePreviewModal';
import { API } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import techAffairsLogo from '@/assets/technical-affairs-logo.png';

const QUICK_SEARCH_SHORTCUTS = [
  { label: 'DSA (Data Structures)', query: 'DSA' },
  { label: 'RL (Reinforcement Learning)', query: 'RL' },
  { label: 'DAA (Algorithms)', query: 'DAA' },
  { label: 'OS (Operating Systems)', query: 'OS' },
  { label: 'DBMS', query: 'DBMS' },
  { label: 'AI / ML', query: 'AI' },
  { label: 'LADE (Linear Algebra)', query: 'LADE' },
  { label: 'DE (Digital Electronics)', query: 'DE' },
  { label: 'FA (Financial Accounting)', query: 'FA' },
  { label: 'FRM (Risk Management)', query: 'FRM' },
  { label: 'Business Law', query: 'BL' },
];

const PAGE_SIZE = 24;

const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Server-paginated state (only 24 items loaded per page to protect DB & bandwidth)
  const [papers, setPapers] = useState<any[]>([]);
  const [totalPapers, setTotalPapers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [matchedAcronyms, setMatchedAcronyms] = useState<
    Array<{ acronym: string; expansions: string[] }>
  >([]);
  const [availableYears, setAvailableYears] = useState<number[]>([
    2026, 2025, 2024, 2023, 2022, 2021, 2020,
  ]);
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  const [totalInCatalog, setTotalInCatalog] = useState<number>(654);

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter controls
  const [searchInput, setSearchInput] = useState<string>(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(searchParams.get('q') || '');
  const [selectedDept, setSelectedDept] = useState<string>(searchParams.get('dept') || 'ALL');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>(searchParams.get('sem') || 'ALL');
  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('year') || 'ALL');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    searchParams.get('course') || 'ALL'
  );
  const [sortBy, setSortBy] = useState<string>('newest');

  // Preview Modal
  const [previewPaper, setPreviewPaper] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const autoOpenedPaperRef = useRef<string | null>(null);

  // Load lightweight course list once
  useEffect(() => {
    let mounted = true;
    API.getCourses()
      .then((res) => {
        if (!mounted) return;
        setCourses(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Sync URL query params
  useEffect(() => {
    const qParam = searchParams.get('q');
    const deptParam = searchParams.get('dept');
    const semParam = searchParams.get('sem');
    const typeParam = searchParams.get('type');
    const yearParam = searchParams.get('year');

    if (qParam !== null) {
      setSearchInput(qParam);
      setDebouncedQuery(qParam);
    }
    if (deptParam !== null) setSelectedDept(deptParam);
    if (semParam !== null) setSelectedSemester(semParam);
    if (typeParam !== null) setSelectedType(typeParam);
    if (yearParam !== null) setSelectedYear(yearParam);

    if (searchParams.get('focus') === 'search') {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  // Debounce search input (220ms) so typing doesn't spam the backend/database
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page to 1 when any dropdown/pill filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, selectedType, selectedSemester, selectedYear, selectedCourseCode, sortBy]);

  // Fetch paginated slice (24 items) from backend smart search engine
  useEffect(() => {
    let active = true;
    setLoading(true);

    API.getPublicPapersPaginated(currentPage, PAGE_SIZE, {
      q: debouncedQuery || undefined,
      department: selectedDept !== 'ALL' ? selectedDept : undefined,
      paper_type: selectedType !== 'ALL' ? selectedType : undefined,
      semester: selectedSemester !== 'ALL' ? selectedSemester : undefined,
      year: selectedYear !== 'ALL' ? selectedYear : undefined,
      course_code: selectedCourseCode !== 'ALL' ? selectedCourseCode : undefined,
      sort: sortBy,
    })
      .then((res) => {
        if (!active) return;
        const data = res.data;
        const loadedItems = Array.isArray(data?.items) ? data.items : [];
        setPapers(loadedItems);
        setTotalPapers(Number(data?.total || 0));

        // Auto-open preview if ?paper=<id> was shared
        const sharedPaperId = searchParams.get('paper');
        if (sharedPaperId && autoOpenedPaperRef.current !== sharedPaperId) {
          const match = loadedItems.find((p: any) => String(p.id) === sharedPaperId);
          if (match) {
            autoOpenedPaperRef.current = sharedPaperId;
            setPreviewPaper(match);
            setPreviewUrl(`${API.baseURL}/papers/${match.id}/preview`);
          }
        }
        setTotalPages(Number(data?.pages || 1));
        setMatchedAcronyms(Array.isArray(data?.matched_acronyms) ? data.matched_acronyms : []);
        if (data?.facets?.availableYears?.length) {
          setAvailableYears(data.facets.availableYears);
        }
        if (data?.facets?.departmentCounts) {
          setDeptCounts(data.facets.departmentCounts);
        }
        if (data?.facets?.totalInCatalog) {
          setTotalInCatalog(data.facets.totalInCatalog);
        }
      })
      .catch((err) => {
        console.error('Failed to load paginated papers:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    currentPage,
    debouncedQuery,
    selectedDept,
    selectedType,
    selectedSemester,
    selectedYear,
    selectedCourseCode,
    sortBy,
  ]);

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Animate cards on page/filter load
  useEffect(() => {
    if (!loading && papers.length > 0) {
      anime.remove('.paper-card-anim');
      anime({
        targets: '.paper-card-anim',
        translateY: [14, 0],
        opacity: [0, 1],
        duration: 360,
        delay: anime.stagger(16, { start: 10 }),
        easing: 'easeOutCubic',
      });
    }
  }, [papers, loading]);

  // Filter course dropdown options by selected department & semester
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedDept !== 'ALL' && c.department && c.department !== selectedDept) return false;
      if (selectedSemester !== 'ALL' && c.semester && String(c.semester) !== selectedSemester)
        return false;
      return true;
    });
  }, [courses, selectedDept, selectedSemester]);

  const [selectedPaperIds, setSelectedPaperIds] = useState<number[]>([]);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchNotice, setBatchNotice] = useState('');

  const handleToggleSelect = (paper: any) => {
    setBatchNotice('');
    setSelectedPaperIds((prev) => {
      if (prev.includes(paper.id)) {
        return prev.filter((id) => id !== paper.id);
      }
      if (prev.length >= 5) {
        setBatchNotice('Maximum 5 papers can be selected at once.');
        return prev;
      }
      return [...prev, paper.id];
    });
  };

  const handleBatchDownload = async () => {
    if (selectedPaperIds.length === 0 || batchDownloading) return;
    setBatchDownloading(true);
    setBatchNotice('');
    try {
      const response = await API.client.post(
        '/papers/batch-download',
        { ids: selectedPaperIds.slice(0, 5) },
        { responseType: 'blob', timeout: 55000 }
      );
      const blob = new Blob([response.data], { type: 'application/zip' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'LearnJKLU_Papers_Batch.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setBatchNotice(
        err?.response?.data?.detail ||
          err?.message ||
          'Batch download limit reached or failed. Please try again shortly.'
      );
    } finally {
      setBatchDownloading(false);
    }
  };

  const handlePreview = (paper: any) => {
    const url = `${API.baseURL}/papers/${paper.id}/preview`;
    setPreviewPaper(paper);
    setPreviewUrl(url);
  };

  const handleDownload = (paper: any) => {
    const url = `${API.baseURL}/papers/${paper.id}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', paper.file_name || `${paper.course_code || 'paper'}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    selectedDept !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedSemester !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedCourseCode !== 'ALL';

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedDept('ALL');
    setSelectedType('ALL');
    setSelectedSemester('ALL');
    setSelectedYear('ALL');
    setSelectedCourseCode('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] overflow-x-hidden">
      {/* WebGPU AeroShards Interactive 3D Background Layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transform-gpu"
        style={{ width: '100%', height: '100vh' }}
      >
        <AeroShards
          shardColor="#896ABD"
          accentColor="#A855F7"
          placement="full"
          material="glass"
          markers="plus"
          count={900}
          depthOfField={0.65}
          vignette={0.3}
          mouseInteraction
          pulseOnClick
          holdToGather
          lightMode={false}
          shardSize={1}
          spread={1}
          twist={1}
          billow={1}
          speed={1}
          scale={1}
          glow={0.35}
          grain={0.06}
          dpr={1.5}
          intro
          mouseStrength={0.6}
          parallax={0.5}
          paused={false}
        />
      </div>

      {/* Sticky Navigation Bar — Mobile Optimized */}
      <header className="sticky top-0 z-40 border-b border-[#E5E2DC]/80 dark:border-white/10 bg-[#FAF9F6]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
            >
              <JKLULogo size="xs" className="sm:hidden shrink-0" />
              <JKLULogo size="sm" className="hidden sm:block shrink-0" />
              <img
                src={(techAffairsLogo as any)?.src || techAffairsLogo}
                alt="Council of Technical Affairs"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md object-cover border border-[#E5E2DC] dark:border-[#232329] shrink-0"
              />
              <div className="h-5 w-[1px] bg-[#E5E2DC] dark:border-[#232329] hidden sm:block" />
              <span className="font-semibold tracking-tight text-xs sm:text-base truncate">
                Learn JKLU
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/90 dark:bg-[#121216]/90 border border-[#E5E2DC] dark:border-white/10 text-xs font-medium">
              <BookOpen className="w-3.5 h-3.5 text-[#E04F33]" />
              <span>Question Paper Archive (2020–2026)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeSwitcher />

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium max-w-[160px] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Signed in: {user.name.split(' ')[0]}</span>
                </span>
                {user.is_admin || user.is_sub_admin || user.admin_role ? (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-2.5 sm:px-3 py-1.5 rounded-md bg-[#E04F33] text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-md bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="sm:hidden">{user.name.split(' ')[0]}</span>
                      <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <button
                      onClick={() => navigate('/profile')}
                      title="Profile"
                      className="p-1.5 rounded-md border border-[#E5E2DC] dark:border-[#232329] bg-white dark:bg-[#121216] text-[#0A0A0C] dark:text-[#F5F4F0] hover:border-[#896ABD] transition-colors"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Sign Out"
                  className="p-1.5 rounded-md border border-[#E5E2DC] dark:border-[#232329] text-[#5C5B57] hover:text-[#E04F33] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 rounded-md border border-[#E5E2DC] dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-medium hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] transition-colors"
                >
                  Student Login
                </button>
                <button
                  onClick={() => navigate('/admin-login')}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-md bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] text-xs font-medium hover:bg-[#E04F33] dark:hover:bg-[#E04F33] dark:hover:text-white transition-colors"
                >
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-7">
        {/* Unified Smart Search & Multi-Faceted Filter Console */}
        <section className="rounded-2xl p-5 sm:p-7 space-y-5 bg-white/86 dark:bg-[#111117]/84 backdrop-blur-md border border-[#E5E2DC]/90 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#E04F33] dark:text-[#C084FC] font-semibold">
                  JKLU VERIFIED ARCHIVE · {totalInCatalog} PAPERS · {courses.length || 306} COURSES
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                Search &amp; Filter Past Question Papers
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#5C5B57] dark:text-[#A09F9A] font-mono-tabular">
              <span>supports short-forms (DSA, RL, DAA, OS) &amp; typo correction</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-[#E5E2DC] dark:border-white/15">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#896ABD] dark:text-[#A855F7] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by acronym (DSA, RL, DAA, OS, DBMS, FRM), course code (CS1135, AS1207), or subject name..."
              className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6]/90 dark:bg-[#0A0A0C]/90 text-sm focus:outline-none focus:border-[#896ABD] dark:focus:border-[#A855F7] transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setDebouncedQuery('');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5C5B57] hover:text-[#0A0A0C] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Smart Acronym Expansion Feedback Banner */}
          {matchedAcronyms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#896ABD]/12 border border-[#896ABD]/30 text-xs">
              <span className="inline-flex items-center gap-1 font-mono-tabular font-semibold text-[#896ABD] dark:text-[#C084FC]">
                <Sparkles className="w-3.5 h-3.5" />
                Smart Acronym Connected:
              </span>
              {matchedAcronyms.map((item) => (
                <span
                  key={item.acronym}
                  className="font-mono-tabular text-[#0A0A0C] dark:text-[#F5F4F0]"
                >
                  <strong>{item.acronym}</strong> → {item.expansions.join(', ')}
                </span>
              ))}
            </div>
          )}

          {/* Quick Acronym & Subject Chips — Wrapped cleanly without ugly horizontal scrollbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono-tabular text-[#5C5B57] dark:text-[#A09F9A] shrink-0 mr-1">
              Quick Short-Forms:
            </span>
            {QUICK_SEARCH_SHORTCUTS.map((chip) => {
              const isSelected = searchInput.trim().toUpperCase() === chip.query.toUpperCase();
              return (
                <button
                  key={chip.query}
                  onClick={() => {
                    if (isSelected) {
                      setSearchInput('');
                      setDebouncedQuery('');
                    } else {
                      setSearchInput(chip.query);
                      setDebouncedQuery(chip.query);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono-tabular shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-[#896ABD] text-white border-[#896ABD] shadow-sm'
                      : 'bg-[#FAF9F6] dark:bg-white/[0.04] border-[#E5E2DC] dark:border-white/10 text-[#5C5B57] dark:text-[#C4C3BE] hover:border-[#896ABD] hover:text-[#896ABD] dark:hover:border-[#A855F7] dark:hover:text-[#C084FC]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Multi-Dimensional Filter Grid */}
          <div className="pt-4 border-t border-[#E5E2DC]/80 dark:border-white/10 space-y-4">
            {/* Row 1: Programme Pills & Exam Type Pills */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Programme Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#A09F9A] mr-1">
                  Programme:
                </span>
                {(['ALL', 'B.TECH', 'BBA', 'BCA', 'M.TECH', 'B.DES', 'PHD', 'MBA'] as const).map(
                  (dept) => {
                    const count = dept === 'ALL' ? totalInCatalog : deptCounts[dept];
                    return (
                      <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-medium transition-colors border ${
                          selectedDept === dept
                            ? 'bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] border-[#0A0A0C] dark:border-[#F5F4F0]'
                            : 'bg-transparent border-[#E5E2DC] dark:border-white/15 text-[#5C5B57] dark:text-[#C4C3BE] hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0]'
                        }`}
                      >
                        {dept === 'ALL' ? 'All' : dept}
                        {count !== undefined ? ` (${count})` : ''}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Exam Type Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#A09F9A] mr-1">
                  Exam Type:
                </span>
                {(['ALL', 'ENDTERM', 'MIDTERM'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular transition-colors border ${
                      selectedType === t
                        ? 'bg-[#E04F33] text-white border-[#E04F33]'
                        : 'bg-transparent border-[#E5E2DC] dark:border-white/15 text-[#5C5B57] dark:text-[#C4C3BE] hover:border-[#E04F33]'
                    }`}
                  >
                    {t === 'ALL' ? 'All Exams' : t === 'ENDTERM' ? 'End-Term' : 'Mid-Term'}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Semester, Year, Course Subject Dropdown, and Sort Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Semester Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono-tabular uppercase tracking-wider text-[#5C5B57] dark:text-[#A09F9A]">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6] dark:bg-[#0A0A0C] text-xs font-mono-tabular focus:outline-none focus:border-[#896ABD]"
                >
                  <option value="ALL">All Semesters (Sem 1–8)</option>
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono-tabular uppercase tracking-wider text-[#5C5B57] dark:text-[#A09F9A]">
                  Examination Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6] dark:bg-[#0A0A0C] text-xs font-mono-tabular focus:outline-none focus:border-[#896ABD]"
                >
                  <option value="ALL">All Years (2020–2026)</option>
                  {availableYears.map((y) => (
                    <option key={y} value={String(y)}>
                      {y} Examination Session
                    </option>
                  ))}
                </select>
              </div>

              {/* Course / Subject Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono-tabular uppercase tracking-wider text-[#5C5B57] dark:text-[#A09F9A]">
                  Course / Subject ({filteredCourses.length})
                </label>
                <select
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6] dark:bg-[#0A0A0C] text-xs font-mono-tabular focus:outline-none focus:border-[#896ABD]"
                >
                  <option value="ALL">All Courses ({filteredCourses.length})</option>
                  {filteredCourses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.paper_count || 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono-tabular uppercase tracking-wider text-[#5C5B57] dark:text-[#A09F9A] flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Sort Results</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-[#FAF9F6] dark:bg-[#0A0A0C] text-xs font-mono-tabular focus:outline-none focus:border-[#896ABD]"
                >
                  <option value="newest">Newest Session First (2026 → 2020)</option>
                  <option value="oldest">Oldest Session First (2020 → 2026)</option>
                  <option value="code_asc">Course Code (A → Z)</option>
                  <option value="popular">Most Downloaded</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Results Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/80 dark:bg-[#111117]/80 backdrop-blur-md border border-[#E5E2DC]/80 dark:border-white/10">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-[#5C5B57] dark:text-[#C4C3BE]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#896ABD] dark:text-[#A855F7]" />
              <span>
                Showing{' '}
                <strong className="text-[#0A0A0C] dark:text-[#F5F4F0]">
                  {papers.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                  {Math.min(currentPage * PAGE_SIZE, totalPapers)}
                </strong>{' '}
                of <strong className="text-[#0A0A0C] dark:text-[#F5F4F0]">{totalPapers}</strong>{' '}
                matching papers (Page {currentPage} of {totalPages})
              </span>
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono-tabular text-[#E04F33] bg-[#E04F33]/10 hover:bg-[#E04F33]/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono-tabular text-[#5C5B57] dark:text-[#A09F9A]">
            Server-side paginated ({PAGE_SIZE} papers/page)
          </span>
        </div>

        {/* Papers Grid — Spacious 3-Column Layout with Large Course Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 sm:p-7 min-h-[268px] bg-white/85 dark:bg-[#111117]/85 backdrop-blur-xl border border-[#E5E2DC] dark:border-white/10 animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between">
                  <div className="h-6 w-28 bg-[#E5E2DC] dark:bg-[#232329] rounded-lg" />
                  <div className="h-6 w-24 bg-[#E5E2DC] dark:bg-[#232329] rounded-lg" />
                </div>
                <div className="space-y-3 my-4">
                  <div className="h-6 w-4/5 bg-[#E5E2DC] dark:bg-[#232329] rounded-lg" />
                  <div className="h-4 w-3/5 bg-[#E5E2DC] dark:bg-[#232329] rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-[#E5E2DC] dark:bg-[#232329] rounded-xl" />
                  <div className="h-12 bg-[#E5E2DC] dark:bg-[#232329] rounded-xl" />
                  <div className="h-12 bg-[#E5E2DC] dark:bg-[#232329] rounded-xl" />
                </div>
                <div className="h-10 w-full bg-[#E5E2DC] dark:bg-[#232329] rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="rounded-2xl p-12 text-center space-y-3 bg-white/90 dark:bg-[#111117]/88 backdrop-blur-xl border border-[#E5E2DC] dark:border-white/10">
            <p className="text-base font-medium">No question papers match your current filter.</p>
            <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
              Try searching with a short-form (e.g., DSA, RL, OS, DBMS, FA) or resetting filters.
            </p>
            <button onClick={clearFilters} className="btn-primary text-xs mt-2">
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  isSelected={selectedPaperIds.includes(paper.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>

            {/* Server-Side Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/88 dark:bg-[#111117]/88 backdrop-blur-md border border-[#E5E2DC]/80 dark:border-white/10">
                <span className="text-xs font-mono-tabular text-[#5C5B57] dark:text-[#C4C3BE]">
                  Page {currentPage} of {totalPages} ({totalPapers} total papers)
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-white dark:bg-[#121216] text-xs font-mono-tabular disabled:opacity-40 hover:border-[#896ABD] dark:hover:border-[#A855F7] flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        (p >= currentPage - 2 && p <= currentPage + 2)
                    )
                    .map((pageNum, idx, arr) => {
                      const prevNum = arr[idx - 1];
                      const showEllipsis = prevNum && pageNum - prevNum > 1;
                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span className="px-1.5 text-xs font-mono-tabular text-[#5C5B57]">
                              …
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-9 h-9 rounded-xl text-xs font-mono-tabular font-medium border transition-colors ${
                              currentPage === pageNum
                                ? 'bg-[#896ABD] text-white border-[#896ABD]'
                                : 'bg-white dark:bg-[#121216] border-[#E5E2DC] dark:border-white/15 hover:border-[#896ABD] dark:hover:border-[#A855F7]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E2DC] dark:border-white/15 bg-white dark:bg-[#121216] text-xs font-mono-tabular disabled:opacity-40 hover:border-[#896ABD] dark:hover:border-[#A855F7] flex items-center gap-1 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Batch Download Bar (Max 5 PDFs) */}
      {(selectedPaperIds.length > 0 || batchNotice) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl rounded-2xl px-4 py-3 bg-[#0A0A0C]/95 dark:bg-[#16161D]/95 text-[#FAF9F6] border border-white/15 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="text-xs font-mono-tabular font-semibold">
              Selected {selectedPaperIds.length} / 5 PDFs
            </div>
            {batchNotice && <div className="text-[11px] text-[#FF8A75]">{batchNotice}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedPaperIds([]);
                setBatchNotice('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono-tabular border border-white/20 hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={selectedPaperIds.length === 0 || batchDownloading}
              onClick={handleBatchDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#896ABD] hover:bg-[#7A5BAE] disabled:opacity-50 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{batchDownloading ? 'Bundling ZIP...' : 'Download All (ZIP)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPaper && previewUrl && (
        <FilePreviewModal
          isOpen={Boolean(previewPaper)}
          onClose={() => {
            setPreviewPaper(null);
            setPreviewUrl(null);
          }}
          fileName={previewPaper.file_name || `${previewPaper.course_code}.pdf`}
          filePath={previewPaper.file_path || ''}
          paperId={previewPaper.id}
          token={localStorage.getItem('token') || ''}
        />
      )}

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default PublicHome;
