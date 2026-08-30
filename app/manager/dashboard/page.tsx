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

  const handleUpdatePC = async (id: string, status: string, clearReason: boolean = false) => {
    const body: any = { id, status };
    if (clearReason) body.maintenanceReason = "";
    
    await fetch('/api/computers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const updated = computers.map((c) => {
      if (c.id === id) {
        const newC = { ...c, status: status as Computer['status'] };
        if (clearReason) delete newC.maintenanceReason;
        return newC;
      }
      return c;
    });
    setComputers(updated);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">แดชบอร์ดผู้จัดการ</h1>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">Manager</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
          {[
            { label: 'การจองทั้งหมด', value: bookings.length, color: 'text-foreground' },
            { label: 'เครื่องว่าง', value: computers.filter((c) => c.status === 'available').length, color: 'text-green-600 dark:text-green-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="card-clean border border-border p-5">
              <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
              <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Computer management */}
          <div className="card-clean border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">จัดการสถานะคอมพิวเตอร์</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {computers.map((pc) => (
                <div key={pc.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border flex-wrap gap-2">
                  <div className="flex-1">
                    <span className="text-foreground text-sm font-medium">{pc.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">Zone {pc.zone}</span>
                    {pc.maintenanceReason && pc.status !== 'maintenance' && (
                      <div className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-0.5 bg-yellow-500/10 px-2 py-1 rounded inline-block border border-yellow-500/20">
                        💬 สาเหตุ: {pc.maintenanceReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      pc.status === 'available' ? 'text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10' :
                      pc.status === 'occupied' ? 'text-pink-600 dark:text-pink-400 border-pink-500/30 bg-pink-500/10' :
                      pc.status === 'maintenance-reported' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                      'text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10'
                    }`}>
                      {pc.status === 'available' ? 'ว่าง' : pc.status === 'occupied' ? 'ใช้งาน' : pc.status === 'maintenance-reported' ? 'รอซ่อม' : 'กำลังซ่อม'}
                    </span>
                    {pc.maintenanceReason && pc.status !== 'maintenance' && (
                      <>
                        <button
                          onClick={() => handleUpdatePC(pc.id, 'maintenance')}
                          className="text-xs px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 transition-all font-bold"
                        >
                          ✅ อนุมัติซ่อม
                        </button>
                        <button
                          onClick={() => handleUpdatePC(pc.id, pc.status, true)}
                          className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-muted transition-all"
                        >
                          ❌ ใช้งานปกติ
                        </button>
                      </>
                    )}
                    {pc.status === 'maintenance' && (
                      <button
                        onClick={() => handleUpdatePC(pc.id, 'available')}
                        className="text-xs px-2 py-0.5 rounded border border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all"
                      >
                        🛠 ซ่อมเสร็จ
                      </button>
                    )}
                    {(pc.status === 'available' || pc.status === 'occupied') && (
                      <button
                        onClick={() => handleUpdatePC(pc.id, 'maintenance')}
                        className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground transition-all"
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
