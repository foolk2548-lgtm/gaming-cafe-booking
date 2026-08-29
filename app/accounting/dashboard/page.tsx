'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Booking } from '@/lib/types';

export default function AccountingDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    if (status === 'authenticated' && !['accounting', 'manager', 'admin'].includes(session?.user?.role ?? '')) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((d) => { setBookings(d.bookings); setLoading(false); });
  }, []);

  const now = new Date();
  const filterBookings = (b: Booking) => {
    const date = new Date(b.createdAt);
    if (range === 'today') return date.toDateString() === now.toDateString();
    if (range === 'week') return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const filtered = bookings.filter(filterBookings);
  const completed = filtered.filter((b) => b.status === 'completed');
  const totalRevenue = completed.reduce((sum, b) => sum + b.finalPrice, 0);
  const totalBaseRevenue = completed.reduce((sum, b) => sum + b.basePrice, 0);
  const totalDiscount = completed.reduce((sum, b) => sum + b.totalDiscount, 0);

  const rangeLabel = { today: 'วันนี้', week: '7 วันที่ผ่านมา', month: 'เดือนนี้' };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-white">รายงานการเงิน</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Accounting</span>
            </div>
            <p className="text-[#94a3b8]">ภาพรวมรายได้และส่วนลดที่ให้ไป</p>
          </div>
          {/* Range selector */}
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  range === r ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'border-[#1e2035] text-[#94a3b8] hover:text-white'
                }`}
              >
                {rangeLabel[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'รายได้สุทธิ', value: `${totalRevenue.toFixed(0)} ฿`, color: 'text-[#00d4ff]', bg: 'border-cyan-500/20 bg-cyan-500/5' },
            { label: 'ราคาก่อนลด', value: `${totalBaseRevenue.toFixed(0)} ฿`, color: 'text-white', bg: 'border-[#1e2035]' },
            { label: 'ส่วนลดที่ให้ไป', value: `${totalDiscount.toFixed(0)} ฿`, color: 'text-green-400', bg: 'border-green-500/20 bg-green-500/5' },
            { label: 'จำนวนบิล', value: `${completed.length} ใบ`, color: 'text-purple-400', bg: 'border-purple-500/20 bg-purple-500/5' },
          ].map((card) => (
            <div key={card.label} className={`card-neon border p-5 ${card.bg}`}>
              <div className="text-sm text-[#94a3b8] mb-2">{card.label} ({rangeLabel[range]})</div>
              <div className={`text-2xl font-black ${card.color}`} style={{ fontFamily: 'Orbitron' }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Completed bookings table */}
        <div className="card-neon border border-[#1e2035] overflow-hidden">
          <div className="p-5 border-b border-[#1e2035] flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">รายการที่ชำระแล้ว</h2>
            <span className="text-sm text-[#94a3b8]">{completed.length} รายการ</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#94a3b8]">⏳ กำลังโหลด...</div>
          ) : completed.length === 0 ? (
            <div className="p-8 text-center text-[#94a3b8]">ไม่มีรายการ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2035] text-left">
                    {['ID', 'คอมพิวเตอร์', 'ระยะเวลา', 'ราคาปกติ', 'ส่วนลด', 'ราคาสุทธิ'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs text-[#475569] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2035]">
                  {completed.slice(0, 20).map((b) => (
                    <tr key={b.id} className="hover:bg-[#0a0a1a] transition-colors">
                      <td className="px-4 py-3 text-[#475569] font-mono text-xs">{b.id.slice(-8)}</td>
                      <td className="px-4 py-3 text-white font-medium">{b.computerId.toUpperCase()}</td>
                      <td className="px-4 py-3 text-[#94a3b8]">{b.durationHours} ชม.</td>
                      <td className="px-4 py-3 text-[#94a3b8]">{b.basePrice.toFixed(0)} ฿</td>
                      <td className="px-4 py-3 text-green-400">-{b.totalDiscount.toFixed(0)} ฿</td>
                      <td className="px-4 py-3 font-bold text-[#00d4ff]">{b.finalPrice.toFixed(0)} ฿</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
