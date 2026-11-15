import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, IdCard, CheckCircle2, Upload, Edit2, X, AlertCircle } from 'lucide-react';
import { sanitizeErrorMessage } from '@/utils/errorSanitizer';
import { API } from '@/utils/api';
import Toast from '@/components/ui/Toast';
import Loader from '@/components/ui/Loader';
import AeroShards from '@/components/layout/AeroShards';
import StudentNavbar from '@/components/layout/StudentNavbar';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
const MAX_UPLOAD_BYTES = 500 * 1024; // 500 KB

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
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idCardBlobUrl, setIdCardBlobUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [extra, setExtra] = useState({
    rollno: '',
    studentId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const token = localStorage.getItem('token');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ show: true, message, type });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data as Me;
        setMe(data);
        setExtra({
          rollno: data.roll_no || '',
          studentId: data.student_id || ''
        });
      } catch {
        showToast('Error', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  useEffect(() => {
    if (!me?.id_card_path) {
      setIdCardBlobUrl(null);
      return;
    }
    let active = true;
    let objectUrl: string | null = null;
    const base = me.id_card_path.split('/').pop() || me.id_card_path;
    API.client
      .get(`/uploads/${encodeURIComponent(base)}`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data);
        setIdCardBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!active) return;
        setIdCardBlobUrl(null);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [me?.id_card_path]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_UPLOAD_BYTES) {
      showToast('File size must be 500 KB or less.', 'error');
      e.target.value = '';
      setIdFile(null);
      return;
    }
    setIdFile(file);
  };

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

    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (idFile && idFile.size > MAX_UPLOAD_BYTES) {
      showToast('File size must be 500 KB or less.', 'error');
      return;
    }

    setSaving(true);
    try {
      let updated: Me;

      await axios.put(
        `${API_BASE_URL}/profile`,
        {
          roll_no: extra.rollno || undefined,
          student_id: extra.studentId || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (idFile) {
        const fd = new FormData();
        fd.append('file', idFile);
        const res = await axios.post(`${API_BASE_URL}/profile/id-card`, fd, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updated = res.data;
      } else {
        const res = await axios.get(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updated = res.data;
      }

      localStorage.setItem('idVerified', updated.id_verified ? 'yes' : 'no');
      setMe(updated);
      setExtra({
        rollno: updated.roll_no || '',
        studentId: updated.student_id || ''
      });
      setIdFile(null);
      setErrors({});
      setIsEditing(false);

      showToast(idFile ? 'Profile and ID submitted. Awaiting admin verification.' : 'Profile saved successfully!', 'success');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        !err?.response || (status !== undefined && status >= 500)
          ? 'Error'
          : sanitizeErrorMessage(err?.response?.data?.detail, 'Error');
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (me) {
      setExtra({
        rollno: me.roll_no || '',
        studentId: me.student_id || ''
      });
    }
    setIdFile(null);
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-[#0A0A0C]/80 border rounded-xl text-sm text-[#0A0A0C] dark:text-[#F5F4F0] placeholder-[#5C5B57]/60 dark:placeholder-[#94938E]/60 focus:outline-none transition-colors ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-[#E5E2DC] dark:border-[#232329] focus:border-[#896ABD] dark:focus:border-[#A855F7]'
    }`;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] pt-[env(safe-area-inset-top)]">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AeroShards />
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <StudentNavbar active="profile" subtitle="Student Profile" />

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader />
          </div>
        ) : me && me.id_verified ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6"
          >
            {/* Left Side - ID Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold">University ID Card</h3>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {me.id_card_path && idCardBlobUrl ? (
                  me.id_card_path.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-56 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex flex-col items-center justify-center gap-2">
                      <IdCard className="w-12 h-12 text-[#896ABD]" />
                      <p className="text-xs font-medium text-[#5C5B57] dark:text-[#94938E]">PDF Document</p>
                      <a
                        href={idCardBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#896ABD] dark:text-[#C084FC] hover:underline"
                      >
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={idCardBlobUrl}
                      alt="ID Card"
                      className="w-full rounded-xl object-cover border border-[#E5E2DC] dark:border-[#232329]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-56 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex items-center justify-center">
                    <IdCard className="w-12 h-12 text-[#5C5B57]" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Profile Details */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#896ABD] to-[#E04F33] text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Profile Details</h2>
                      <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">Verified student account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setErrors({});
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Edit Academic Info</h3>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="p-1.5 rounded-lg text-[#5C5B57] hover:bg-[#FAF9F6] dark:hover:bg-[#18181F]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                          Roll Number *
                        </label>
                        <input
                          value={extra.rollno}
                          onChange={(e) => setExtra({ ...extra, rollno: e.target.value })}
                          placeholder="eg. 20XXBtech123"
                          required
                          className={inputClass(Boolean(errors.rollno))}
                        />
                        {errors.rollno && <p className="text-xs text-red-500">{errors.rollno}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                          Student ID *
                        </label>
                        <input
                          value={extra.studentId}
                          onChange={(e) => setExtra({ ...extra, studentId: e.target.value })}
                          required
                          className={inputClass(Boolean(errors.studentId))}
                        />
                        {errors.studentId && <p className="text-xs text-red-500">{errors.studentId}</p>}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E2DC] dark:border-[#232329] text-sm font-medium hover:bg-[#FAF9F6] dark:hover:bg-[#18181F]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#896ABD] to-[#E04F33] text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex items-center gap-3">
                      <User className="w-4 h-4 text-[#896ABD] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">Full Name</p>
                        <p className="text-sm font-semibold truncate">{me.name}</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#896ABD] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">Email</p>
                        <p className="text-sm font-semibold break-all">{me.email}</p>
                      </div>
                    </div>
                    {extra.rollno && (
                      <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329]">
                        <p className="text-[11px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">Roll Number</p>
                        <p className="text-sm font-semibold mt-0.5">{extra.rollno}</p>
                      </div>
                    )}
                    {extra.studentId && (
                      <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329]">
                        <p className="text-[11px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">Student ID</p>
                        <p className="text-sm font-semibold mt-0.5">{extra.studentId}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : me ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* Account Summary */}
            <div className="rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#896ABD]/15 text-[#896ABD] dark:text-[#C084FC]">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight">Your Details</h2>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#896ABD] shrink-0" />
                  <span className="font-semibold truncate">{me.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#896ABD] shrink-0" />
                  <span className="break-all text-xs sm:text-sm">{me.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329] flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">
                    ID verification: <span className="text-amber-600 dark:text-amber-400">Not verified</span>
                  </span>
                </div>
              </div>

              {!me.id_verified && me.admin_feedback && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-400 space-y-1">
                  <p className="font-semibold">Profile Rejection Feedback</p>
                  <p>{me.admin_feedback.message || 'Your profile was rejected. Please review and resubmit.'}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329]">
                  <span className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E] block">Roll No</span>
                  <span className="font-semibold">{extra.rollno || '-'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#0A0A0C]/70 border border-[#E5E2DC] dark:border-[#232329]">
                  <span className="text-[10px] font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E] block">Student ID</span>
                  <span className="font-semibold">{extra.studentId || '-'}</span>
                </div>
              </div>
            </div>

            {/* Upload ID Card & Edit Form */}
            <form
              onSubmit={handleSave}
              className="rounded-2xl p-5 sm:p-6 bg-white/90 dark:bg-[#111117]/90 backdrop-blur-md border border-[#E5E2DC] dark:border-[#232329] shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#896ABD] to-[#E04F33] text-white">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Upload ID Card</h2>
                  <p className="text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">MAX 500 KB · JPG, PNG, PDF</p>
                </div>
              </div>

              <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">
                Upload a clear photo of your university ID to unlock paper uploads.
              </p>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#0A0A0C]/80 border border-[#E5E2DC] dark:border-[#232329] rounded-xl text-xs sm:text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#896ABD]/15 file:text-[#896ABD] dark:file:text-[#C084FC] cursor-pointer"
              />
              {idFile && (
                <p className="text-xs font-mono-tabular text-[#5C5B57] dark:text-[#94938E]">
                  {idFile.name} ({(idFile.size / 1024).toFixed(1)} KB)
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Roll Number *
                  </label>
                  <input
                    value={extra.rollno}
                    onChange={(e) => setExtra({ ...extra, rollno: e.target.value })}
                    placeholder="eg. 20XXBtech123"
                    required
                    className={inputClass(Boolean(errors.rollno))}
                  />
                  {errors.rollno && <p className="text-xs text-red-500">{errors.rollno}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-tabular uppercase text-[#5C5B57] dark:text-[#94938E]">
                    Student ID *
                  </label>
                  <input
                    value={extra.studentId}
                    onChange={(e) => setExtra({ ...extra, studentId: e.target.value })}
                    required
                    className={inputClass(Boolean(errors.studentId))}
                  />
                  {errors.studentId && <p className="text-xs text-red-500">{errors.studentId}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#896ABD] to-[#E04F33] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          </motion.div>
        ) : null}
      </main>
    </div>
  );
};

export default Profile;
