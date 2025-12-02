import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, IdCard, CheckCircle2, Upload, ArrowLeft, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
import { buildUploadUrl } from '../utils/uploads';
import Loader from './Loader';
import JKLULogo from './JKLULogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://exam-portal-backend-jklu-solomaze.vercel.app';

type Me = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at?: string;
  roll_no?: string;
  student_id?: string;
  id_card_path?: string;
  id_verified?: boolean;
  admin_feedback?: {
    message?: string;
    rejected_at?: string;
    rejected_by?: number;
  } | null;
};

const Profile: React.FC = () => {
  const { } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [extra, setExtra] = useState({
    rollno: '',
    studentId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data as any;
        setMe(data);
        setExtra({
          rollno: data.roll_no || '',
          studentId: data.student_id || ''
        });
      } catch (e: any) {
        setToast({ show: true, message: 'Failed to load profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ show: true, message, type });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!extra.rollno || extra.rollno.trim() === '') {
      newErrors.rollno = 'Roll Number is required';
    }
    
    if (!extra.studentId || extra.studentId.trim() === '') {
      newErrors.studentId = 'Student ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Save profile to backend
    setSaving(true);
    try {
      let updated: any = null;
      
      await axios.put(`${API_BASE_URL}/profile`, {
        roll_no: extra.rollno || undefined,
        student_id: extra.studentId || undefined,
      }, { headers: { Authorization: `Bearer ${token}` }});

      if (idFile) {
        const fd = new FormData();
        fd.append('file', idFile);
        const res = await axios.post(`${API_BASE_URL}/profile/id-card`, fd, { headers: { Authorization: `Bearer ${token}` }});
        updated = res.data;
      } else {
        // If no file uploaded, just refresh
        const res = await axios.get(`${API_BASE_URL}/me`, { headers: { Authorization: `Bearer ${token}` }});
        updated = res.data;
      }

      // Sync local flags for compatibility
      localStorage.setItem('idVerified', updated.id_verified ? 'yes' : 'no');

      // Refresh profile data
      setMe(updated);
      setExtra({
        rollno: updated.roll_no || '',
        studentId: updated.student_id || ''
      });

      // Clear file input
      setIdFile(null);
      
      // Clear errors and exit edit mode
      setErrors({});
      setIsEditing(false);

      showToast(idFile ? 'Profile and ID submitted. Awaiting admin verification.' : 'Profile saved successfully!', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setErrors({});
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    // Reset to original values
    if (me) {
      setExtra({
        rollno: me.roll_no || '',
        studentId: me.student_id || ''
      });
    }
    setIdFile(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Custom Profile Page Background */}
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/60 dark:from-slate-950 dark:via-purple-950/30 dark:to-indigo-950/40" />
        
        {/* Geometric Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(30deg, transparent 24%, rgba(168, 85, 247, 0.5) 25%, rgba(168, 85, 247, 0.5) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.5) 75%, rgba(139, 92, 246, 0.5) 76%, transparent 77%, transparent),
              linear-gradient(60deg, transparent 24%, rgba(99, 102, 241, 0.5) 25%, rgba(99, 102, 241, 0.5) 26%, transparent 27%, transparent 74%, rgba(79, 70, 229, 0.5) 75%, rgba(79, 70, 229, 0.5) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Subtle Circles Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 dark:bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-300/30 dark:bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl" />
        </div>
        
        {/* Subtle Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-purple-100/20 via-transparent to-transparent dark:from-purple-900/10" />
        
        {/* Bottom Accent Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-indigo-100/20 via-transparent to-transparent dark:from-indigo-900/10" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen">
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/30 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left side - JKLU Logo on mobile, Profile title on desktop */}
          <div className="flex items-center gap-3 sm:gap-0">
            {/* JKLU Logo - Left side on mobile only */}
            <div className="flex items-center flex-shrink-0 sm:hidden">
              <JKLULogo size="sm" className="opacity-90 hover:opacity-100" />
            </div>
            {/* Profile Title */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold text-xl"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <IdCard className="h-6 w-6 text-purple-500 dark:text-purple-400" />
              </motion.div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Profile
              </span>
            </motion.div>
          </div>

          {/* Right side - Back button and JKLU Logo on desktop */}
          <div className="flex items-center gap-4 sm:gap-6">
            <motion.a 
              href="/dashboard" 
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to dashboard</span>
            </motion.a>
            {/* JKLU Logo - Right side on desktop */}
            <div className="hidden sm:flex items-center flex-shrink-0">
              <JKLULogo size="sm" className="opacity-90 hover:opacity-100" />
            </div>
          </div>
        </div>
      </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader />
          </div>
        ) : me && me.id_verified ? (
          // Beautiful verified profile view
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left Side - ID Card */}
            <div className="lg:col-span-1 space-y-4">
              {/* ID Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-2xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-2xl p-6 hover:shadow-purple-500/20 hover:scale-[1.01] transition-all duration-300"
              >
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: -5 }}
                    className="p-1.5 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg"
                  >
                    <IdCard className="h-4 w-4 text-white" />
                  </motion.div>
                  <span className="text-gray-800 dark:text-gray-200">ID Card</span>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="ml-auto"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  </motion.div>
                </h3>
                {me.id_card_path ? (
                  <div className="relative">
                    {me.id_card_path.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-64 bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl flex flex-col items-center justify-center">
                        <IdCard className="h-16 w-16 text-emerald-500 mb-2" />
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">PDF Document</p>
                        <motion.a 
                          href={buildUploadUrl(me.id_card_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold hover:underline"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          View PDF
                        </motion.a>
                      </div>
                    ) : (
                      <img 
                        src={buildUploadUrl(me.id_card_path)} 
                        alt="ID Card" 
                        className="w-full rounded-xl object-cover shadow-lg ring-2 ring-emerald-400/40"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.style.display = 'none';
                          console.error('Failed to load ID card:', { idCardPath: me.id_card_path, imageUrl: buildUploadUrl(me.id_card_path) });
                        }}
                        onLoad={() => {
                          console.log('ID card loaded successfully:', buildUploadUrl(me.id_card_path));
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl flex items-center justify-center">
                    <IdCard className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Side - Profile Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="backdrop-blur-2xl bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <User className="h-6 w-6 text-white" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      Profile Details
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/30"
                      whileHover={{ scale: 1.05 }}
                      animate={{ 
                        boxShadow: [
                          '0 0 0px rgba(16, 185, 129, 0)',
                          '0 0 10px rgba(16, 185, 129, 0.5)',
                          '0 0 0px rgba(16, 185, 129, 0)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-semibold">Verified</span>
                    </motion.div>
                    {!isEditing && (
                      <motion.button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">Edit</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <motion.form 
                    onSubmit={handleSave}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Profile</h3>
                      <motion.button
                        type="button"
                        onClick={handleCancel}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-5 w-5" />
                      </motion.button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                          Roll Number <span className="text-red-500">*</span>
                        </label>
                        <input 
                          value={extra.rollno} 
                          onChange={(e)=>setExtra({...extra, rollno: e.target.value})} 
                          placeholder="eg. 20XXBtech/BBA/BDES123"
                          required
                          className={`w-full px-6 py-4 text-base bg-white dark:bg-gray-800/90 border-2 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 shadow-sm hover:shadow-md ${
                            errors.rollno 
                              ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/30' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {errors.rollno && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.rollno}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                          Student ID <span className="text-red-500">*</span>
                        </label>
                        <input 
                          value={extra.studentId} 
                          onChange={(e)=>setExtra({...extra, studentId: e.target.value})} 
                          required
                          className={`w-full px-6 py-4 text-base bg-white dark:bg-gray-800/90 border-2 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 shadow-sm hover:shadow-md ${
                            errors.studentId 
                              ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/30' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {errors.studentId && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.studentId}</p>}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                        whileHover={{ scale: saving ? 1 : 1.02 }}
                        whileTap={{ scale: saving ? 1 : 0.98 }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        Basic Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <motion.div 
                          className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                          whileHover={{ scale: 1.02, x: 4 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <User className="h-5 w-5 text-white flex-shrink-0" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Full Name</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{me.name}</p>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                          whileHover={{ scale: 1.02, x: 4 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <Mail className="h-5 w-5 text-white flex-shrink-0" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Email</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 break-all">{me.email}</p>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    {(extra.rollno || extra.studentId) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <div className="h-1 w-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                          Academic Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {extra.rollno && (
                            <motion.div 
                              className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-cyan-200/50 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors"
                              whileHover={{ scale: 1.02, x: 4 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.0 }}
                            >
                              <div className="h-8 w-8 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg text-white flex-shrink-0">
                                <span className="text-xs font-bold">R</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Roll Number</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{extra.rollno}</p>
                              </div>
                            </motion.div>
                          )}
                          {extra.studentId && (
                            <motion.div 
                              className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-cyan-200/50 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors"
                              whileHover={{ scale: 1.02, x: 4 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.1 }}
                            >
                              <div className="h-8 w-8 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg text-white flex-shrink-0">
                                <span className="text-xs font-bold">ID</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Student ID</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{extra.studentId}</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : me ? (
          // Unverified or default view
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Profile card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-2xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-2xl p-6 hover:shadow-purple-500/20 hover:scale-[1.01] transition-all duration-300"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"
                >
                  <User className="h-5 w-5 text-white" />
                </motion.div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Your details
                </span>
              </h2>
              <div className="space-y-4 text-sm">
                <motion.div 
                  className="flex items-center gap-2 text-gray-800 dark:text-gray-100 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50"
                  whileHover={{ x: 4, scale: 1.02 }}
                >
                  <User className="h-4 w-4 text-purple-500 dark:text-purple-400" /> 
                  <span className="font-semibold">{me.name}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50"
                  whileHover={{ x: 4, scale: 1.02 }}
                >
                  <Mail className="h-4 w-4 text-purple-500 dark:text-purple-400" /> 
                  <span className="break-all">{me.email}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-white/50 dark:bg-gray-700/50"
                  whileHover={{ x: 4, scale: 1.02 }}
                >
                  <CheckCircle2 className={`h-4 w-4 ${me.id_verified ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`} />
                  <span className="font-medium">ID verification: <span className={me.id_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{me.id_verified ? 'Verified' : 'Not verified'}</span></span>
                </motion.div>
                
                {/* Admin Feedback - Display in red when profile is rejected */}
                {!me.id_verified && me.admin_feedback && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500/50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 font-bold text-lg">⚠️</span>
                      <div className="flex-1">
                        <h4 className="text-red-800 dark:text-red-300 font-bold text-sm mb-1">Profile Rejection Feedback</h4>
                        <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">
                          {me.admin_feedback.message || 'Your profile has been rejected. Please review and correct the information.'}
                        </p>
                        {me.admin_feedback.rejected_at && (
                          <p className="text-red-600 dark:text-red-500 text-xs mt-2 opacity-75">
                            Rejected on: {new Date(me.admin_feedback.rejected_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        <p className="text-red-600 dark:text-red-500 text-xs mt-2 font-semibold">
                          Please correct your profile information and resubmit for verification.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div 
                    className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Roll No:</span> <span className="text-gray-600 dark:text-gray-400">{extra.rollno || '-'}</span>
                  </motion.div>
                  <motion.div 
                    className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Student ID:</span> <span className="text-gray-600 dark:text-gray-400">{extra.studentId || '-'}</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

          {/* Edit & upload card */}
          <motion.form 
            onSubmit={handleSave} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-2xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-2xl p-6 space-y-4 hover:shadow-purple-500/20 hover:scale-[1.01] transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.2, rotate: -5 }}
                className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"
              >
                <IdCard className="h-5 w-5 text-white" />
              </motion.div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Upload ID card
              </span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload a clear photo of your university ID to enable future uploads.</p>
            <motion.div whileHover={{ scale: 1.01 }}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="w-full px-6 py-4 text-base bg-white dark:bg-gray-800/90 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-900/30 dark:file:text-purple-300 hover:file:bg-purple-100 dark:hover:file:bg-purple-900/50"
              />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Roll Number <span className="text-red-500">*</span>
                </label>
                <input 
                  value={extra.rollno} 
                  onChange={(e)=>setExtra({...extra, rollno: e.target.value})} 
                  placeholder="eg. 20XXBtech/BBA/BDES123"
                  required
                  className={`w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all ${
                    errors.rollno 
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400' 
                      : 'border-gray-200/50 dark:border-gray-600/50 focus:border-purple-500 dark:focus:border-purple-400'
                  }`}
                />
                {errors.rollno && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.rollno}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input 
                  value={extra.studentId} 
                  onChange={(e)=>setExtra({...extra, studentId: e.target.value})} 
                  required
                  className={`w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all ${
                    errors.studentId 
                      ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400' 
                      : 'border-gray-200/50 dark:border-gray-600/50 focus:border-purple-500 dark:focus:border-purple-400'
                  }`}
                />
                {errors.studentId && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.studentId}</p>}
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02, boxShadow: '0 10px 25px rgba(168, 85, 247, 0.4)' }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            >
              <motion.div
                animate={{ rotate: saving ? 360 : 0 }}
                transition={{ duration: saving ? 1 : 0, repeat: saving ? Infinity : 0, ease: "linear" }}
              >
                <Upload className="h-4 w-4" />
              </motion.div>
              {saving ? 'Saving...' : 'Save profile'}
            </motion.button>
          </motion.form>
          </motion.div>
        ) : null}
        </main>
      </div>
    </div>
  );
};

export default Profile;


