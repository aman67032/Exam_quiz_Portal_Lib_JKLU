import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, IdCard, CheckCircle2, Upload, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

type Me = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at?: string;
};

const Profile: React.FC = () => {
  const { } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [extra, setExtra] = useState({
    age: '',
    year: '',
    university: '',
    department: '',
    rollno: '',
    studentId: ''
  });
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
          age: data.age ? String(data.age) : '',
          year: data.year || '',
          university: data.university || '',
          department: data.department || '',
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

  // reserved utility for potential image previews

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save profile to backend
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/profile`, {
        age: extra.age ? Number(extra.age) : undefined,
        year: extra.year || undefined,
        university: extra.university || undefined,
        department: extra.department || undefined,
        roll_no: extra.rollno || undefined,
        student_id: extra.studentId || undefined,
      }, { headers: { Authorization: `Bearer ${token}` }});

      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        await axios.post(`${API_BASE_URL}/profile/photo`, fd, { headers: { Authorization: `Bearer ${token}` }});
      }

      let updated: any = null;
      if (idFile) {
        const fd = new FormData();
        fd.append('file', idFile);
        const res = await axios.post(`${API_BASE_URL}/profile/id-card`, fd, { headers: { Authorization: `Bearer ${token}` }});
        updated = res.data;
      } else {
        const res = await axios.get(`${API_BASE_URL}/me`, { headers: { Authorization: `Bearer ${token}` }});
        updated = res.data;
      }

      // Sync local flags for compatibility
      localStorage.setItem('idVerified', updated.id_verified ? 'yes' : 'no');
      if (updated.photo_path) localStorage.setItem('profile.photo.path', updated.photo_path);

      showToast(idFile ? 'Profile and ID submitted. Awaiting admin verification.' : 'Profile saved.', 'success');
    } catch (e: any) {
      showToast('Failed to save ID card', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-cyan-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <header className="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold">
            <IdCard className="h-5 w-5 text-purple-500" /> Profile
          </div>
          <a href="/dashboard" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
          {/* Profile card */}
          <div className="backdrop-blur-2xl bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" /> Your details
            </h2>
            {loading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
            ) : me ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-4">
                  <img src={localStorage.getItem('profile.photo') || ''} alt="avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-400/40" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
                  <div className="text-xs text-gray-500">{localStorage.getItem('profile.photo') ? 'Profile photo' : 'No photo uploaded'}</div>
                </div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100"><User className="h-4 w-4 text-purple-500" /> {me.name}</div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail className="h-4 w-4 text-purple-500" /> {me.email}</div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className={`h-4 w-4 ${localStorage.getItem('idVerified') === 'yes' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  ID verification: {localStorage.getItem('idVerified') === 'yes' ? 'Verified' : 'Not verified'}
                </div>
                <div className="grid grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
                  <div><span className="font-semibold">Age:</span> {extra.age || '-'}</div>
                  <div><span className="font-semibold">Year:</span> {extra.year || '-'}</div>
                  <div><span className="font-semibold">University:</span> {extra.university || '-'}</div>
                  <div><span className="font-semibold">Department:</span> {extra.department || '-'}</div>
                  <div><span className="font-semibold">Roll No:</span> {extra.rollno || '-'}</div>
                  <div><span className="font-semibold">Student ID:</span> {extra.studentId || '-'}</div>
                </div>
                {localStorage.getItem('idFileName') && (
                  <div className="text-xs text-gray-500">File: {localStorage.getItem('idFileName')}</div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500"><AlertCircle className="h-4 w-4" /> Failed to load user</div>
            )}
          </div>

          {/* Edit & upload card */}
          <form onSubmit={handleSave} className="backdrop-blur-2xl bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/30 dark:border-gray-700/40 shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IdCard className="h-5 w-5 text-purple-500" /> Upload ID card
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload a clear photo of your university ID to enable future uploads.</p>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Profile Photo</label>
                <input type="file" accept="image/*" onChange={(e)=>setPhotoFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Age</label>
                <input value={extra.age} onChange={(e)=>setExtra({...extra, age: e.target.value})} type="number" min={15} max={80} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Year</label>
                <select value={extra.year} onChange={(e)=>setExtra({...extra, year: e.target.value})} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm">
                  <option value="">Select</option>
                  <option>1st</option>
                  <option>2nd</option>
                  <option>3rd</option>
                  <option>4th</option>
                  <option>5th</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">University</label>
                <input value={extra.university} onChange={(e)=>setExtra({...extra, university: e.target.value})} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Department</label>
                <input value={extra.department} onChange={(e)=>setExtra({...extra, department: e.target.value})} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Roll Number</label>
                <input value={extra.rollno} onChange={(e)=>setExtra({...extra, rollno: e.target.value})} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Student ID</label>
                <input value={extra.studentId} onChange={(e)=>setExtra({...extra, studentId: e.target.value})} className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-sm" />
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={saving || !idFile}
              whileHover={{ scale: saving || !idFile ? 1 : 1.02 }}
              whileTap={{ scale: saving || !idFile ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> {saving ? 'Saving...' : 'Save profile'}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;


