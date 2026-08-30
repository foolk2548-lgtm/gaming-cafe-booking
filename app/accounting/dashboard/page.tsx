'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { Printer } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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

  // Prepare chart data
  const chartData = [...completed]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .reduce((acc, b) => {
      let dateStr = '';
      const date = new Date(b.createdAt);
      if (range === 'today') {
        dateStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '0-digit' }) + ' น.';
      } else {
        dateStr = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
      }
      
      const existing = acc.find(item => item.name === dateStr);
      if (existing) {
        existing['รายได้สุทธิ'] += b.finalPrice;
        existing['ราคาก่อนลด'] += b.basePrice;
        existing['ส่วนลด'] += b.totalDiscount;
      } else {
        acc.push({ 
          name: dateStr, 
          'รายได้สุทธิ': b.finalPrice,
          'ราคาก่อนลด': b.basePrice,
          'ส่วนลด': b.totalDiscount
        });
      }
      return acc;
    }, [] as any[]);

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-foreground">รายงานการเงิน</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">Accounting</span>
            </div>
            <p className="text-muted-foreground">ภาพรวมรายได้และส่วนลดที่ให้ไป</p>
          </div>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/80 transition-all"
            >
              <Printer className="w-4 h-4" />
              พิมพ์รายงาน
            </button>
            <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  range === r ? 'border-primary-500/50 bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {rangeLabel[r]}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'รายได้สุทธิ', value: `${totalRevenue.toFixed(0)} ฿`, color: 'text-cyan-600 dark:text-cyan-400', bg: 'border-cyan-500/20 bg-cyan-500/5' },
            { label: 'ราคาก่อนลด', value: `${totalBaseRevenue.toFixed(0)} ฿`, color: 'text-foreground', bg: 'border-border' },
            { label: 'ส่วนลดที่ให้ไป', value: `${totalDiscount.toFixed(0)} ฿`, color: 'text-green-600 dark:text-green-400', bg: 'border-green-500/20 bg-green-500/5' },
            { label: 'จำนวนบิล', value: `${completed.length} ใบ`, color: 'text-purple-600 dark:text-purple-400', bg: 'border-purple-500/20 bg-purple-500/5' },
          ].map((card) => (
            <div key={card.label} className={`card-clean border p-5 ${card.bg}`}>
              <div className="text-sm text-muted-foreground mb-2">{card.label} ({rangeLabel[range]})</div>
              <div className={`text-2xl font-extrabold ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        {!loading && completed.length > 0 && (
          <div className="card-clean border border-border overflow-hidden mb-8 p-5 break-inside-avoid">
            <h2 className="text-lg font-bold text-foreground mb-4">กราฟสรุปรายได้ ({rangeLabel[range]})</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
                    tickFormatter={(value) => `฿${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-foreground)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="ราคาก่อนลด" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ส่วนลด" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="รายได้สุทธิ" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Completed bookings table */}
        <div className="card-clean border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
            <h2 className="text-lg font-bold text-foreground">รายการที่ชำระแล้ว</h2>
            <span className="text-sm text-muted-foreground">{completed.length} รายการ</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">⏳ กำลังโหลด...</div>
          ) : completed.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">ไม่มีรายการ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {['ID', 'คอมพิวเตอร์', 'ระยะเวลา', 'ราคาปกติ', 'ส่วนลด', 'ราคาสุทธิ'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {completed.slice(0, 20).map((b) => (
                    <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{b.id.slice(-8)}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{b.computerId.toUpperCase()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.durationHours} ชม.</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.basePrice.toFixed(0)} ฿</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">-{b.totalDiscount.toFixed(0)} ฿</td>
                      <td className="px-4 py-3 font-bold text-cyan-600 dark:text-cyan-400">{b.finalPrice.toFixed(0)} ฿</td>
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
