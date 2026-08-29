'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Booking, Computer } from '@/lib/types';

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && !['manager', 'admin'].includes(session?.user?.role ?? '')) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings').then((r) => r.json()),
      fetch('/api/computers').then((r) => r.json()),
    ]).then(([bData, cData]) => {
      setBookings(bData.bookings);
      setComputers(cData.computers);
      setLoading(false);
    });
  }, []);

  const today = bookings.filter((b) => new Date(b.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = today.filter((b) => b.status === 'completed').reduce((s, b) => s + b.finalPrice, 0);
  const totalRevenue = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + b.finalPrice, 0);

  const promoStats = ['time_based', 'duration_based', 'happy_hour', 'member_based', 'new_member_bill'].map((type) => ({
    type,
    label: type === 'time_based' ? 'ช่วงกลางวัน' : type === 'duration_based' ? 'เล่นยาว' : type === 'happy_hour' ? 'Happy Hour' : type === 'member_based' ? 'สมาชิก' : 'สมาชิกใหม่',
    count: bookings.filter((b) => b.discountsApplied.some((d) => d.type === type)).length,
    totalSaved: bookings.flatMap((b) => b.discountsApplied.filter((d) => d.type === type)).reduce((s, d) => s + d.amount, 0),
  }));

  const handleUpdatePC = async (id: string, status: string) => {
    await fetch('/api/computers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const updated = computers.map((c) => c.id === id ? { ...c, status: status as Computer['status'] } : c);
    setComputers(updated);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-black text-white">แดชบอร์ดผู้จัดการ</h1>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Manager</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'รายได้วันนี้', value: `${todayRevenue.toFixed(0)} ฿`, color: 'text-[#00d4ff]' },
            { label: 'รายได้รวม', value: `${totalRevenue.toFixed(0)} ฿`, color: 'text-[#8b5cf6]' },
            { label: 'การจองทั้งหมด', value: bookings.length, color: 'text-white' },
            { label: 'เครื่องว่าง', value: computers.filter((c) => c.status === 'available').length, color: 'text-green-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="card-neon border border-[#1e2035] p-5">
              <div className="text-xs text-[#94a3b8] mb-2">{kpi.label}</div>
              <div className={`text-3xl font-black ${kpi.color}`} style={{ fontFamily: 'Orbitron' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Promotion stats */}
          <div className="card-neon border border-[#1e2035] p-6">
            <h2 className="text-lg font-bold text-white mb-4">ประสิทธิภาพโปรโมชั่น</h2>
            <div className="space-y-3">
              {promoStats.map((p) => (
                <div key={p.type} className="flex items-center justify-between">
                  <span className="text-[#94a3b8] text-sm">{p.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium">{p.count} ครั้ง</span>
                    <span className="text-green-400 text-xs">ลดไป {p.totalSaved.toFixed(0)} ฿</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Computer management */}
          <div className="card-neon border border-[#1e2035] p-6">
            <h2 className="text-lg font-bold text-white mb-4">จัดการสถานะคอมพิวเตอร์</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {computers.map((pc) => (
                <div key={pc.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0a0a1a]">
                  <div>
                    <span className="text-white text-sm font-medium">{pc.name}</span>
                    <span className="text-xs text-[#475569] ml-2">Zone {pc.zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      pc.status === 'available' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                      pc.status === 'occupied' ? 'text-pink-400 border-pink-500/30 bg-pink-500/10' :
                      pc.status === 'maintenance-reported' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                      'text-orange-400 border-orange-500/30 bg-orange-500/10'
                    }`}>
                      {pc.status === 'available' ? 'ว่าง' : pc.status === 'occupied' ? 'ใช้งาน' : pc.status === 'maintenance-reported' ? 'รอซ่อม' : 'กำลังซ่อม'}
                    </span>
                    {pc.status === 'maintenance-reported' && (
                      <button
                        onClick={() => handleUpdatePC(pc.id, 'maintenance')}
                        className="text-xs px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-all"
                      >
                        ✅ รับซ่อม
                      </button>
                    )}
                    {pc.status === 'maintenance' && (
                      <button
                        onClick={() => handleUpdatePC(pc.id, 'available')}
                        className="text-xs px-2 py-0.5 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
                      >
                        🛠 ซ่อมเสร็จ
                      </button>
                    )}
                    {(pc.status === 'available' || pc.status === 'occupied') && (
                      <button
                        onClick={() => handleUpdatePC(pc.id, 'maintenance')}
                        className="text-xs px-2 py-0.5 rounded border border-[#1e2035] text-[#475569] hover:text-white transition-all"
                      >
                        ส่งซ่อมด่วน
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
