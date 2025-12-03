import { motion } from 'framer-motion';
import { Clock, Zap, Heart } from 'lucide-react';

const MaintenanceMode = () => {
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
            Wait "thodi se" der... We will be right back!
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
          <div className="flex items-start gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="text-left">
              <p className="text-purple-100 text-lg leading-relaxed italic font-light">
                "Bichde jo tujhse humne muskuraana chhod diya
              </p>
              <p className="text-purple-100 text-lg leading-relaxed italic font-light">
                Dil toda jo tune humne dil lagana chhod diya
              </p>
              <p className="text-purple-100 text-lg leading-relaxed italic font-light">
                Har raat tere gum mein jaam uthaya humne
              </p>
              <p className="text-purple-100 text-lg leading-relaxed italic font-light">
                Aaj hosh mein aaye to mehkhana chhod diya"
              </p>
            </div>
          </div>
          <p className="text-purple-300 text-sm mt-4">— Suryaansh Sharma 😂</p>
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
