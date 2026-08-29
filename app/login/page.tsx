'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const demoAccounts = [
  { role: 'Customer', email: 'customer@example.com', password: 'customer123', color: 'text-blue-400' },
  { role: 'Staff', email: 'staff@gamecafe.th', password: 'staff123', color: 'text-green-400' },
  { role: 'Accounting', email: 'finance@gamecafe.th', password: 'finance123', color: 'text-yellow-400' },
  { role: 'Manager', email: 'manager@gamecafe.th', password: 'manager123', color: 'text-purple-400' },
  { role: 'Admin', email: 'admin@gamecafe.th', password: 'admin123', color: 'text-red-400' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const quickLogin = async (acc: (typeof demoAccounts)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setLoading(true);
    const res = await signIn('credentials', { email: acc.email, password: acc.password, redirect: false });
    setLoading(false);
    if (!res?.error) { router.push('/'); router.refresh(); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md page-enter">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black tracking-wider" style={{ fontFamily: 'Orbitron' }}>
              CLOUD<span className="text-[#00d4ff]">SPACE</span>
            </h1>
          </Link>
          <p className="text-[#94a3b8] mt-2">เข้าสู่ระบบเพื่อเช่า Cloud PC</p>
        </div>

        {/* Card */}
        <div className="card-neon p-8 border border-[#1e2035]">
          <h2 className="text-xl font-bold text-white mb-6">เข้าสู่ระบบ</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-1.5">อีเมล</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-cyber w-full px-4 py-3 rounded-lg border text-sm"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-1.5">รหัสผ่าน</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-cyber w-full px-4 py-3 rounded-lg border text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-cyber w-full py-3 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="text-center text-sm text-[#94a3b8] mt-6">
            ยังไม่มีบัญชี?{' '}
            <Link href="/register" className="text-[#00d4ff] hover:underline">สมัครสมาชิก</Link>
          </p>
        </div>


      </div>
    </div>
  );
}
