'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Computer } from '@/lib/types';

const zoneColors = {
  A: { name: 'Zone A', label: 'Standard', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', border: 'border-cyan-500/30', glow: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10' },
  B: { name: 'Zone B', label: 'Gaming Pro', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', border: 'border-purple-500/30', glow: 'hover:border-purple-500/50 hover:shadow-purple-500/10' },
  VIP: { name: 'VIP Zone', label: 'Premium', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', border: 'border-amber-400/30', glow: 'hover:border-amber-400/50 hover:shadow-amber-400/10' },
};

const statusConfig = {
  available: { label: 'ว่าง', cls: 'badge-available', dot: 'bg-[#00ff88]' },
  occupied: { label: 'ไม่ว่าง', cls: 'badge-occupied', dot: 'bg-[#ec4899] pulse-occupied' },
  maintenance: { label: 'ซ่อมบำรุง', cls: 'badge-maintenance', dot: 'bg-[#ff6b35]' },
};

export default function ComputersPage() {
  const router = useRouter();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetch('/api/computers')
      .then((r) => r.json())
      .then((data) => { setComputers(data.computers); setLoading(false); });
  }, []);

  const filtered = computers.filter((c) => {
    const zoneOk = filterZone === 'all' || c.zone === filterZone;
    const statusOk = filterStatus === 'all' || c.status === filterStatus;
    return zoneOk && statusOk;
  });

  const counts = {
    available: computers.filter((c) => c.status === 'available').length,
    occupied: computers.filter((c) => c.status === 'occupied').length,
    maintenance: computers.filter((c) => c.status === 'maintenance').length,
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">รายการคอมพิวเตอร์</h1>
          <p className="text-[#94a3b8]">เลือกเครื่องที่ต้องการ แล้วกดจองเลย</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'ว่าง', count: counts.available, cls: 'border-green-500/30 bg-green-500/5 text-green-400' },
            { label: 'ไม่ว่าง', count: counts.occupied, cls: 'border-pink-500/30 bg-pink-500/5 text-pink-400' },
            { label: 'ซ่อมบำรุง', count: counts.maintenance, cls: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 text-center ${s.cls}`}>
              <div className="text-2xl font-black" style={{ fontFamily: 'Orbitron' }}>{s.count}</div>
              <div className="text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-2">
            {['all', 'A', 'B', 'VIP'].map((z) => (
              <button
                key={z}
                onClick={() => setFilterZone(z)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  filterZone === z
                    ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-[#8b5cf6]'
                    : 'border-[#1e2035] text-[#94a3b8] hover:border-[#8b5cf6]/30 hover:text-white'
                }`}
              >
                {z === 'all' ? 'ทุกโซน' : z === 'VIP' ? 'VIP Zone' : `Zone ${z}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'available', 'occupied', 'maintenance'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  filterStatus === s
                    ? 'border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'border-[#1e2035] text-[#94a3b8] hover:text-white'
                }`}
              >
                {s === 'all' ? 'ทุกสถานะ' : s === 'available' ? 'ว่าง' : s === 'occupied' ? 'ไม่ว่าง' : 'ซ่อมบำรุง'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          Object.entries(zoneColors).map(([zone, zc]) => {
            const zonePcs = filtered.filter((c) => c.zone === zone);
            if (zonePcs.length === 0) return null;
            return (
              <div key={zone} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron' }}>{zc.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${zc.badge}`}>{zc.label}</span>
                  <span className="text-[#475569] text-sm">{zonePcs.length} เครื่อง</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {zonePcs.map((pc) => {
                    const st = statusConfig[pc.status];
                    const canBook = pc.status === 'available';
                    return (
                      <div
                        key={pc.id}
                        className={`card-neon border p-4 cursor-pointer transition-all hover:shadow-lg ${zc.border} ${zc.glow} ${!canBook ? 'opacity-60' : ''}`}
                        onClick={() => canBook && router.push(`/booking?computer=${pc.id}`)}
                      >
                        {/* PC Icon */}
                        <div className="text-center text-3xl mb-3">🖥️</div>
                        <div className="text-center">
                          <div className="font-bold text-white text-sm mb-1">{pc.name}</div>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${st.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                        <div className="mt-3 text-center">
                          <div className="text-lg font-black text-white">{pc.pricePerHour}</div>
                          <div className="text-xs text-[#475569]">บาท/ชม.</div>
                        </div>
                        {canBook && (
                          <button className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8b5cf6]/30 to-[#00d4ff]/30 text-white border border-[#8b5cf6]/20 hover:from-[#8b5cf6]/50 hover:to-[#00d4ff]/50 transition-all">
                            จองเลย →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
