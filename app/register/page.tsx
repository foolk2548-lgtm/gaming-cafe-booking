'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', displayName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, email: form.email, password: form.password, displayName: form.displayName, phone: form.phone }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return; }
    router.push('/login?registered=1');
  };

  const fields = [
    { name: 'displayName', label: 'ชื่อที่แสดง', type: 'text', placeholder: 'ชื่อ-นามสกุล' },
    { name: 'username', label: 'ชื่อผู้ใช้', type: 'text', placeholder: 'username (ภาษาอังกฤษ)' },
    { name: 'email', label: 'อีเมล', type: 'email', placeholder: 'example@email.com' },
    { name: 'phone', label: 'เบอร์โทรศัพท์', type: 'tel', placeholder: '08X-XXX-XXXX' },
    { name: 'password', label: 'รหัสผ่าน', type: 'password', placeholder: 'อย่างน้อย 6 ตัวอักษร' },
    { name: 'confirmPassword', label: 'ยืนยันรหัสผ่าน', type: 'password', placeholder: 'กรอกรหัสผ่านอีกครั้ง' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black tracking-wider" style={{ fontFamily: 'Orbitron' }}>
              CLOUD<span className="text-[#00d4ff]">SPACE</span>
            </h1>
          </Link>
          <p className="text-[#94a3b8] mt-2">สมัครสมาชิกเพื่อเช่า Cloud PC</p>
        </div>

        <div className="card-neon p-8 border border-[#1e2035]">
          <h2 className="text-xl font-bold text-white mb-6">สมัครสมาชิก</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-sm text-[#94a3b8] mb-1.5">{f.label}</label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  required={f.name !== 'phone'}
                  className="input-cyber w-full px-4 py-3 rounded-lg border text-sm"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            {/* Perks reminder */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              🎁 สมาชิกใหม่รับส่วนลด <strong>100 บาท</strong> สำหรับบิลแรกที่ 600 บาทขึ้นไป!
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-cyber w-full py-3 rounded-lg font-bold text-sm disabled:opacity-50"
            >
              {loading ? '⏳ กำลังสมัคร...' : '🚀 สมัครสมาชิก'}
            </button>
          </form>

          <p className="text-center text-sm text-[#94a3b8] mt-6">
            มีบัญชีแล้ว?{' '}
            <Link href="/login" className="text-[#00d4ff] hover:underline">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
