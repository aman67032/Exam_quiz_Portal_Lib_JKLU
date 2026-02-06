import { motion } from 'framer-motion';
import { Clock, Zap, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from 'react';
import Squares from './square_bg';
import MathPhysicsBackground from './MathPhysicsBackground';

const ColorBends = lazy(() => import('./color_band_bg'));

const shayaris = [
  {
    id: 1,
    lines: [
      "Tere jaaney ke baad bhi main aas lagaye baitha hoon,",
      "Toota hoon andar se, phir bhi ek khwaab sajaye baitha hoon.",
      "Tu mil jaaye wapas khuda se fariyaad lagaye baitha hoon,",
      "Bhulaane ko tujhe, jaam ko main dawa banaye baitha hoon.",
      "Teri kahani main har mehfil mein sunaaye baitha hoon,",
      "Jo kirdaar mila hi nahi mujhe,",
      "Usse main apni poori kahani banaye baitha hoon."
    ]
  },
  {
    id: 2,
    lines: [
      "Haan maana meri galti thi, main use maanta hoon,",
      "Par iske liye khud ko jhootha bana kar",
      "Khud ko hi roz todna, ye main nahi chahta hoon.",
      "Agar aaj tum kisi aur ke saath ho",
      "Sirf mujhe afsos dilane ke liye,",
      "Toh yaad rakhna, dil ke kisi kone mein",
      "Mera pyaar abhi bhi zinda hai tumhare liye.",
      "Duniya ke saamne majboor ban jaana aasaan hai,",
      "Par apne jazbaaton se jhoot bolna sabse mushkil,",
      "Kisi aur ka haath pakad ke",
      "Apne hi sach ka gala ghontna theek nahi, bilkul nahi."
    ],
    author: "A_man "
  }
];

const MaintenanceMode = () => {
  const [currentShayari, setCurrentShayari] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Swipe threshold
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe Left -> Next
      setCurrentShayari((prev) => (prev === shayaris.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      // Swipe Right -> Prev
      setCurrentShayari((prev) => (prev === 0 ? shayaris.length - 1 : prev - 1));
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentShayari((prev) => (prev === 0 ? shayaris.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentShayari((prev) => (prev === shayaris.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center pt-[env(safe-area-inset-top)] bg-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {isSmallScreen ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 via-pink-950 to-rose-950">
              <div className="absolute inset-0 opacity-60" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 60%)',
                willChange: 'opacity'
              }} />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-72 h-72 bg-amber-200/20 rounded-full blur-2xl top-[5%] left-[5%]" />
                <div className="absolute w-56 h-56 bg-orange-200/15 rounded-full blur-2xl bottom-[15%] right-[10%]" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/75 dark:from-gray-900/75 dark:via-gray-900/60 dark:to-gray-900/85" />
            </div>
          </>
        ) : (
          <>
            <Suspense fallback={<div className="w-full h-full bg-gray-900" />}>
              <ColorBends
                colors={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4']}
                speed={0.15}
                frequency={1.2}
                warpStrength={1.2}
                mouseInfluence={0.8}
                parallax={0.6}
                transparent={true}
                scale={1.5}
              />
            </Suspense>
            <div className="absolute inset-0 opacity-20">
              <MathPhysicsBackground />
            </div>
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <Squares
                speed={0.6}
                squareSize={48}
                borderColor={'rgba(255,255,255,0.35)'}
                hoverFillColor={'rgba(255,255,255,0.12)'}
                direction="diagonal"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/70" />
          </>
        )}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center px-4 max-w-2xl"
      >
        {/* Maintenance Icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block mb-8"
        >
          <Zap className="w-20 h-20 text-yellow-400" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg"
        >
          Under Maintenance
        </motion.h1>

        {/* Main message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-8"
        >
          <p className="text-xl md:text-2xl text-purple-200 mb-2">
            We're currently shifting our backend
          </p>
          <p className="text-lg text-purple-300 flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Wait "thodi si der" ... We will be right back!
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent my-8"
        />

        {/* Shayari Container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="bg-gray-900/60 border border-white/10 ring-1 ring-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group touch-pan-y"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between gap-4 relative z-10">
            {/* Left Arrow */}
            <button
              onClick={() => setCurrentShayari((prev) => (prev === 0 ? shayaris.length - 1 : prev - 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
              aria-label="Previous shayari"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Shayari Content */}
            <motion.div
              key={currentShayari}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              <div className="flex items-start gap-4 mb-4">
                <Heart className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1 fill-pink-500/20" />
                <div className="text-left">
                  {shayaris[currentShayari].lines.map((line, idx) => (
                    <p key={idx} className="text-white text-lg sm:text-xl leading-relaxed font-medium tracking-wide drop-shadow-md">
                      {idx === 0 ? `"${line}` : line}
                      {idx === shayaris[currentShayari].lines.length - 1 ? `"` : ""}
                    </p>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 font-semibold text-sm">— {shayaris[currentShayari].author || "Suryaansh Sharma 😂"}</p>
              <p className="text-gray-400 text-xs mt-3 hidden sm:block">Use ← → arrow keys to switch</p>
              <p className="text-gray-400 text-xs mt-3 sm:hidden">Swipe to read more</p>
            </motion.div>

            {/* Right Arrow */}
            <button
              onClick={() => setCurrentShayari((prev) => (prev === shayaris.length - 1 ? 0 : prev + 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
              aria-label="Next shayari"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {shayaris.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentShayari(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === currentShayari ? 'bg-white w-8' : 'bg-white/20 w-2 hover:bg-white/40'
                  }`}
                aria-label={`Go to shayari ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-12"
        >
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400"
              />
            ))}
          </div>
          <p className="text-purple-300 text-sm mt-4">Preparing your portal...</p>
        </motion.div>

        {/* Contact info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="text-purple-400 text-sm mt-8 hover:text-purple-300 transition-colors"
        >
          Questions? Contact us at counciloftechnicalaffairs@jklu.edu.in
        </motion.p>
      </motion.div>
    </div>
  );
};

export default MaintenanceMode;
