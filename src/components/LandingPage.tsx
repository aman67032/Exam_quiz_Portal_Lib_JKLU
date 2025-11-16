import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, ArrowRight, Upload } from 'lucide-react';
import MathPhysicsBackground from './MathPhysicsBackground';
import logoImg from '../assets/logo (2).png';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-12 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <MathPhysicsBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-4 sm:mb-6 backdrop-blur-md bg-amber-50/30 dark:bg-amber-900/20 rounded-full p-2 sm:p-3 md:p-4 border border-amber-200/40 dark:border-amber-800/40 shadow-2xl"
          >
            <motion.img
              src={logoImg}
              alt="Paper Portal Logo"
              className="h-20 sm:h-28 md:h-32 lg:h-40 xl:h-48 w-auto mx-auto drop-shadow-2xl"
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 px-2"
          >
            <span className="bg-gradient-to-r from-amber-900 via-amber-800 via-amber-700 via-amber-600 to-blue-700 dark:from-amber-200 dark:via-amber-300 dark:via-amber-400 dark:to-blue-400 bg-clip-text text-transparent">
              Paper Portal
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-amber-900 dark:text-amber-200 mb-6 sm:mb-8 px-2"
          >
            Your Academic Paper Management System
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-12"
        >
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-amber-200/40 dark:border-amber-800/50 shadow-xl">
            <BookOpen className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-amber-700 dark:text-amber-400 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
              Browse Papers
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Access a vast collection of academic papers and study materials
            </p>
          </div>
          
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-amber-200/40 dark:border-amber-800/50 shadow-xl">
            <Upload className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-amber-700 dark:text-amber-400 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
              Upload Papers
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Share your academic papers with the community
            </p>
          </div>
          
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-amber-200/40 dark:border-amber-800/50 shadow-xl sm:col-span-2 md:col-span-1">
            <Shield className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-blue-700 dark:text-blue-400 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
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
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full"
        >
          <Link
            to="/login"
            className="group relative px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 overflow-hidden text-center min-h-[48px] flex items-center justify-center"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Sign In
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            />
          </Link>
          
          <Link
            to="/register"
            className="px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-200 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg border-2 border-amber-700 dark:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl text-center min-h-[48px] flex items-center justify-center"
          >
            Create Account
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-6 sm:mt-8 px-2"
        >
          Please login or register to access the portal
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LandingPage;

