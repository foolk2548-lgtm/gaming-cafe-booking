'use client';

import { useState, useEffect } from 'react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "authenticated" | "unauthenticated" | "loading";
}

export default function ProfileSettingsModal({ isOpen, onClose, status }: ProfileSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Tab state: 'profile' or 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [formData, setFormData] = useState({
    displayName: '',
    avatarUrl: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      if (status !== 'authenticated') return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/users/profile');
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            displayName: data.displayName || '',
            avatarUrl: data.avatarUrl || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, status]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ text: 'รหัสผ่านไม่ตรงกัน', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          avatarUrl: formData.avatarUrl,
          ...(formData.password && { password: formData.password }),
        }),
      });

      if (res.ok) {
        setMessage({ text: 'อัปเดตข้อมูลสำเร็จ', type: 'success' });
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        const err = await res.json();
        setMessage({ text: err.error || 'เกิดข้อผิดพลาด', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-md bg-[#1e2035] border border-[#3b3e66] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3b3e66]/50">
          <h2 className="text-xl font-bold text-white">ตั้งค่าบัญชีผู้ใช้</h2>
          <button 
            onClick={onClose}
            className="text-[#94a3b8] hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#3b3e66]/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile' 
                ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]' 
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            ข้อมูลส่วนตัว
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'security' 
                ? 'text-[#ec4899] border-b-2 border-[#ec4899]' 
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            ความปลอดภัย
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
              
              {message.text && (
                <div
                  className={`p-3 rounded-xl text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col items-center">
                    <div 
                      className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#1e2035] bg-[#3b3e66] shadow-[0_0_15px_rgba(0,212,255,0.3)] cursor-pointer group/avatar"
                      onClick={() => document.getElementById('modal-avatar-upload')?.click()}
                    >
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-white/50 flex items-center justify-center w-full h-full">
                          {formData.displayName.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <span className="text-xs text-white font-medium">เปลี่ยนรูป</span>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      id="modal-avatar-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setFormData({ ...formData, avatarUrl: e.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                      ชื่อแสดงผล (Display Name)
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#0a0a16] border border-[#3b3e66] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                      placeholder="ชื่อที่ต้องการให้แสดง"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                      รหัสผ่านใหม่
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a16] border border-[#3b3e66] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ec4899] focus:ring-1 focus:ring-[#ec4899] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a16] border border-[#3b3e66] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ec4899] focus:ring-1 focus:ring-[#ec4899] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3b3e66]/50 bg-[#1e2035]/50">
          <button
            type="submit"
            form="profile-form"
            disabled={isSaving || isLoading}
            className="w-full relative group/btn flex items-center justify-center gap-2 overflow-hidden rounded-xl p-[2px] transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6] via-[#00d4ff] to-[#ec4899] opacity-70 group-hover/btn:opacity-100 transition-opacity"></span>
            <span className="relative w-full bg-[#05050f] px-4 py-3 rounded-[10px] text-white font-bold group-hover/btn:bg-opacity-0 transition-all duration-300">
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
