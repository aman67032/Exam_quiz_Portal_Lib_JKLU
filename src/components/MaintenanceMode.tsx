import { motion } from 'framer-motion';
import { Clock, Zap, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const shayaris = [
  {
    id: 1,
    lines: [
      "Bichde jo tujhse humne muskuraana chhod diya",
      "Dil toda jo tune humne dil lagana chhod diya",
      "Har raat tere gum mein jaam uthaya humne",
      "Aaj hosh mein aaye to mehkhana chhod diya"
    ]
  },
  {
    id: 2,
    lines: [
      "Baahon mein tu meri simat si jaaye,",
      "Tujhe dekhu kisi aur ke saath, toh saansein tham jaaye.",
      "Chhupa ke rakhi thi dil mein har ek baat,",
      "Par khauf hai, kahin mujhse pehle koi aur na keh jaaye"
    ]
  }
];

const MaintenanceMode = () => {
  const [currentShayari, setCurrentShayari] = useState(0);

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
        />
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
          className="text-5xl md:text-6xl font-bold mb-4 text-white"
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
          className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/30 rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left Arrow */}
            <button
              onClick={() => setCurrentShayari((prev) => (prev === 0 ? shayaris.length - 1 : prev - 1))}
              className="p-2 hover:bg-purple-400/20 rounded-lg transition-colors text-purple-300 hover:text-purple-100"
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
              <div className="flex items-start gap-3 mb-4">
                <Heart className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  {shayaris[currentShayari].lines.map((line, idx) => (
                    <p key={idx} className="text-purple-100 text-lg leading-relaxed italic font-light">
                      {idx === 0 ? `"${line}` : line}
                      {idx === shayaris[currentShayari].lines.length - 1 ? `"` : ""}
                    </p>
                  ))}
                </div>
              </div>
              <p className="text-purple-300 text-sm">— Suryaansh Sharma 😂</p>
              <p className="text-purple-400/60 text-xs mt-2">Use ← → arrow keys to switch</p>
            </motion.div>

            {/* Right Arrow */}
            <button
              onClick={() => setCurrentShayari((prev) => (prev === shayaris.length - 1 ? 0 : prev + 1))}
              className="p-2 hover:bg-purple-400/20 rounded-lg transition-colors text-purple-300 hover:text-purple-100"
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
                className={`h-2 rounded-full transition-all ${
                  idx === currentShayari ? 'bg-purple-400 w-6' : 'bg-purple-600 w-2'
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
