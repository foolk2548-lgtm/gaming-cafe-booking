'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Booking, RemoteInfo } from '@/lib/types';

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'รอการยืนยัน',    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  confirmed: { label: 'ยืนยันแล้ว',      color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30' },
  active:    { label: 'กำลังใช้งาน 🟢', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  completed: { label: 'เสร็จสิ้น',       color: 'text-[#475569]',  bg: 'bg-[#475569]/10',  border: 'border-[#475569]/30' },
  cancelled: { label: 'ยกเลิกแล้ว',      color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  rejected:  { label: '❌ ไม่ได้รับอนุมัติ', color: 'text-red-400', bg: 'bg-red-500/10',   border: 'border-red-500/30' },
};

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

function CountdownTimer({ startTime, endTime, status }: { startTime: string; endTime: string; status: string }) {
  const [timeLeft, setTimeLeft] = useState<{ text: string; color: string } | null>(null);

  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') return;
    
    const update = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now > end) {
        setTimeLeft({ text: '⏰ หมดเวลาแล้ว', color: 'text-red-400' });
        return;
      }
      
      let diff = 0;
      let isWaiting = false;
      
      if (now < start) {
        diff = start - now;
        isWaiting = true;
      } else {
        diff = end - now;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      const timeStr = `${h}h ${m}m ${s}s`;
      
      if (isWaiting) {
        setTimeLeft({ text: `⏳ เริ่มในอีก: ${timeStr}`, color: 'text-cyan-400' });
      } else {
        setTimeLeft({ text: `⏱️ เวลาที่เหลือ: ${timeStr}`, color: 'text-green-400' });
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, status]);

  if (!timeLeft) return null;
  return (
    <div className={`text-sm font-bold font-mono bg-[#0a0a1a] p-2 rounded-lg border border-[#1e2035] inline-block mt-2 ${timeLeft.color}`}>
      {timeLeft.text}
    </div>
  );
}

function ConnectionCard({ info }: { info: RemoteInfo }) {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const row = (label: string, value: string, key: string, secret = false) => (
    <div className="flex items-center justify-between py-2 border-b border-[#1e2035] last:border-0">
      <div>
        <div className="text-xs text-[#475569]">{label}</div>
        <div className="text-sm font-mono text-white mt-0.5">
          {secret && !showPass ? '••••••••' : value}
        </div>
      </div>
      <div className="flex gap-2">
        {secret && (
          <button onClick={() => setShowPass(!showPass)} className="text-xs text-[#94a3b8] hover:text-white px-2 py-1 border border-[#1e2035] rounded-lg transition-all">
            {showPass ? '🙈 ซ่อน' : '👁 แสดง'}
          </button>
        )}
        <button onClick={() => copy(value, key)} className={`text-xs px-2 py-1 border rounded-lg transition-all ${copied === key ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-[#94a3b8] hover:text-white border-[#1e2035]'}`}>
          {copied === key ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-4 p-4 rounded-xl bg-[#0a0a1a] border border-green-500/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-sm font-bold">ข้อมูลการเชื่อมต่อ Cloud PC</span>
      </div>
      {row('IP Address', info.ip, 'ip')}
      {row('Username', info.username, 'user')}
      {row('Password', info.password, 'pass', true)}
      {info.parsecLink && (
        <div className="mt-3 pt-3 border-t border-[#1e2035]">
          <a
            href={info.parsecLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cyber w-full py-2.5 rounded-lg text-sm font-bold text-center block"
          >
            🚀 เปิด Parsec เชื่อมต่อเลย
          </a>
        </div>
      )}
      {info.moonlightHost && (
        <div className="mt-2 text-xs text-[#94a3b8]">
          🌙 Moonlight Host: <span className="font-mono text-white">{info.moonlightHost}</span>
        </div>
      )}
      {info.notes && (
        <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
          📝 {info.notes}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/bookings?userId=${session.user.id}`)
        .then((r) => r.json())
        .then((d) => { setBookings(d.bookings.reverse()); setLoading(false); });
    }
  }, [session]);

  const handleCancel = async (id: string) => {
    if (!confirm('ต้องการยกเลิกการเช่า Cloud PC นี้ใช่ไหม?')) return;
    setCancelId(id);
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    setCancelId(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96 text-[#94a3b8]">⏳ กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">การเช่าของฉัน</h1>
            <p className="text-[#94a3b8]">ประวัติการเช่า Cloud PC และข้อมูลการเชื่อมต่อ</p>
          </div>
          <button onClick={() => router.push('/booking')} className="btn-cyber px-5 py-2.5 rounded-xl text-sm font-semibold">
            + เช่าใหม่
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="card-neon p-16 text-center border border-[#1e2035]">
            <div className="text-5xl mb-4">☁️</div>
            <h3 className="text-xl font-bold text-white mb-2">ยังไม่มีประวัติการเช่า</h3>
            <p className="text-[#94a3b8] mb-6">เริ่มเช่า Cloud PC เพื่อสนุกกับการเล่นเกมจากที่บ้าน</p>
            <button onClick={() => router.push('/booking')} className="btn-cyber px-8 py-3 rounded-xl font-semibold">เช่าเลย</button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const st = statusConfig[b.status] ?? statusConfig.pending;
              const showConnect = (b.status === 'confirmed' || b.status === 'active') && b.connectionDetails;
              return (
                <div key={b.id} className={`card-neon border p-6 transition-all ${b.status === 'active' ? 'border-green-500/30' : 'border-[#1e2035] hover:border-[#8b5cf6]/30'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-white font-bold">{b.computerId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}>
                          {st.label}
                        </span>
                        {b.discountsApplied?.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            🎁 มีส่วนลด
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        {/* Timer Display */}
                        {(b.status === 'pending' || b.status === 'confirmed' || b.status === 'active') && (
                          <div className="text-3xl text-center md:text-left">
                            <CountdownTimer startTime={b.startTime} endTime={b.endTime} status={b.status} />
                          </div>
                        )}
                        <div className="text-[#94a3b8] text-sm">ระยะเวลาเช่า: {b.durationHours} ชั่วโมง</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelId === b.id}
                          className="mt-3 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                          {cancelId === b.id ? 'กำลังยกเลิก...' : 'ยกเลิก'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Connection Details */}
                  {showConnect && b.connectionDetails && (
                    <ConnectionCard info={b.connectionDetails} />
                  )}

                  {/* Rejection reason */}
                  {b.status === 'rejected' && (
                    <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                      <div className="text-sm font-bold text-red-400 mb-1">❌ การจองไม่ได้รับการอนุมัติ</div>
                      {(b as Booking & { rejectionReason?: string }).rejectionReason ? (
                        <>
                          <p className="text-xs text-[#94a3b8] mb-1">เหตุผลจากพนักงาน:</p>
                          <p className="text-sm text-white bg-[#0a0a1a] rounded-lg p-2 border border-red-500/20">
                            {(b as Booking & { rejectionReason?: string }).rejectionReason}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-[#94a3b8]">กรุณาติดต่อพนักงานเพื่อสอบถามข้อมูลเพิ่มเติม</p>
                      )}
                      <button
                        onClick={() => router.push('/booking')}
                        className="mt-3 text-xs px-4 py-2 rounded-lg bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/30 transition-all"
                      >
                        📋 จองใหม่
                      </button>
                    </div>
                  )}

                  {/* Waiting for provisioning */}
                  {b.status === 'pending' && (
                    <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-400">
                      ⏳ รอทีมงานตรวจสอบสลิปและจัดเตรียม Cloud PC — ข้อมูลการเชื่อมต่อจะปรากฏที่นี่ก่อนถึงเวลาเริ่มต้น
                    </div>
                  )}

                  {b.status === 'confirmed' && !b.connectionDetails && (
                    <div className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-400">
                      🔄 กำลัง Provisioning VM — ข้อมูลการเชื่อมต่อจะแสดงในไม่ช้า กรุณารีเฟรชหน้านี้
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
