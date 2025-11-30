import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, ArrowRight, Upload } from 'lucide-react';
import MathPhysicsBackground from './MathPhysicsBackground';
import logoImg from '../assets/logo (2).png';
import JKLULogo from './JKLULogo';
import Footer from './Footer';

const LandingPage: React.FC = () => {

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main Content - 100vh */}
      <div className="h-screen flex items-center justify-center px-3 sm:px-4 pt-16 sm:pt-6 pb-6 sm:pb-8 md:py-12 relative overflow-hidden">
      {/* JKLU Logo - Top Right */}
      <div className="fixed top-3 right-3 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-50">
          <JKLULogo size="md" className="opacity-90 hover:opacity-100" />
      </div>
      <MathPhysicsBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-3 sm:mb-4 md:mb-6 backdrop-blur-md bg-amber-50/30 dark:bg-amber-900/20 rounded-full p-1.5 sm:p-2 md:p-3 lg:p-4 border border-amber-200/40 dark:border-amber-800/40 shadow-2xl"
          >
            <motion.img
              src={logoImg}
              alt="Paper Portal Logo"
              className="h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28 w-auto mx-auto drop-shadow-2xl"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 px-2 leading-tight sm:leading-normal"
          >
            <span className="bg-gradient-to-r from-amber-900 via-amber-800 via-amber-700 via-amber-600 to-blue-700 dark:from-amber-200 dark:via-amber-300 dark:via-amber-400 dark:to-blue-400 bg-clip-text text-transparent">
              Paper Portal
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-amber-900 dark:text-amber-200 mb-4 sm:mb-6 md:mb-8 px-2 leading-relaxed"
          >
            Your Academic Paper Management System
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-6 md:mb-8 lg:mb-12"
        >
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl md:rounded-2xl p-3.5 sm:p-4 md:p-5 lg:p-6 border border-amber-200/40 dark:border-amber-800/50 shadow-xl">
            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 text-amber-700 dark:text-amber-400 mb-2 sm:mb-3 md:mb-4" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-amber-900 dark:text-amber-200 mb-1.5 sm:mb-2">
              Browse Papers
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Access a vast collection of academic papers and study materials
            </p>
          </div>
          
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl md:rounded-2xl p-3.5 sm:p-4 md:p-5 lg:p-6 border border-amber-200/40 dark:border-amber-800/50 shadow-xl">
            <Upload className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 text-amber-700 dark:text-amber-400 mb-2 sm:mb-3 md:mb-4" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-amber-900 dark:text-amber-200 mb-1.5 sm:mb-2">
              Upload Papers
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Share your academic papers with the community
            </p>
          </div>
          
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-lg sm:rounded-xl md:rounded-2xl p-3.5 sm:p-4 md:p-5 lg:p-6 border border-amber-200/40 dark:border-amber-800/50 shadow-xl sm:col-span-2 md:col-span-1">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 text-blue-700 dark:text-blue-400 mb-2 sm:mb-3 md:mb-4" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-amber-900 dark:text-amber-200 mb-1.5 sm:mb-2">
              Secure Access
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Only @jklu.edu.in email addresses are allowed
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center items-stretch sm:items-center w-full"
        >
          <Link
            to="/home"
            className="group relative px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 lg:py-4 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 overflow-hidden text-center min-h-[44px] sm:min-h-[48px] flex items-center justify-center touch-manipulation"
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
              Get Started
              <ArrowRight className="h-4 w-4 sm:h-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-4 sm:mt-6 md:mt-8 px-2 leading-relaxed"
        >
          Browse papers instantly. Access your dashboard after registration.
        </motion.p>
      </motion.div>
      </div>

      {/* Footer - Below viewport, requires scrolling */}
      <Footer />
    </div>
  );
};

export default LandingPage;

