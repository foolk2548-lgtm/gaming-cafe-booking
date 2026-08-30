'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Booking, Computer } from '@/lib/types';

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

interface AssignForm {
  bookingId: string;
  ip: string;
  username: string;
  password: string;
  parsecLink: string;
  moonlightHost: string;
  notes: string;
}

const emptyForm = (): AssignForm => ({
  bookingId: '', ip: '', username: 'clouduser', password: '', parsecLink: '', moonlightHost: '', notes: ''
});

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vms, setVms] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AssignForm | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [fullScreenSlip, setFullScreenSlip] = useState<string | null>(null);
  
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairPC, setRepairPC] = useState<Computer | null>(null);
  const [repairReason, setRepairReason] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && !['staff', 'manager', 'admin'].includes(session?.user?.role ?? '')) {
      router.push('/');
    }
  }, [status, session, router]);

  const fetchData = () => {
    Promise.all([
      fetch('/api/bookings').then((r) => r.json()),
      fetch('/api/computers').then((r) => r.json()),
    ]).then(([bData, cData]) => {
      setBookings(bData.bookings.reverse());
      setVms(cData.computers);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-refresh every 15 seconds for real-time status
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleAssignVM = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedBooking.id,
        status: 'confirmed',
        staffId: session?.user?.id,
        connectionDetails: {
          ip: `203.0.113.${Math.floor(Math.random() * 200) + 10}`,
          username: 'clouduser',
          password: Math.random().toString(36).slice(-8),
          notes: 'Auto-provisioned by Cloud Space',
        },
      }),
    });
    setSubmitting(false);
    setForm(null);
    setSelectedBooking(null);
    setShowRejectBox(false);
    setRejectReason('');
    showToast('✅ จ่าย VM สำเร็จ ลูกค้าจะเห็นข้อมูลการเชื่อมต่อแล้ว!');
    fetchData();
  };

  const handleRejectBooking = async () => {
    if (!selectedBooking || !rejectReason.trim()) return;
    setSubmitting(true);
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedBooking.id,
        status: 'rejected',
        staffId: session?.user?.id,
        rejectionReason: rejectReason.trim(),
      }),
    });
    setSubmitting(false);
    setForm(null);
    setSelectedBooking(null);
    setShowRejectBox(false);
    setRejectReason('');
    showToast('❌ ไม่อนุมัติการจองแล้ว ลูกค้าจะได้รับการแจ้งเตือน');
    fetchData();
  };

  const handleComplete = async (id: string) => {
    await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed', staffId: session?.user?.id }),
    });
    showToast('✅ ปิดเซสชัน / คืน VM เรียบร้อย');
    fetchData();
  };

  const handleDeleteComputer = async (id: string, name: string) => {
    if (!confirm(`ลบเครื่อง "${name}" ออกจากระบบใช่ไหม?`)) return;
    const res = await fetch(`/api/computers?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(`🗑️ ลบเครื่อง ${name} สำเร็จ`);
      fetchData();
    } else {
      const err = await res.json();
      showToast('❌ ' + (err.error || 'ลบไม่สำเร็จ'));
    }
  };

  const submitRepairReport = async () => {
    if (!repairPC || !repairReason.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/computers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: repairPC.id, status: 'maintenance-reported', maintenanceReason: repairReason }),
    });
    setSubmitting(false);
    if (res.ok) {
      showToast(`🔧 แจ้งซ่อมเครื่อง ${repairPC.name} สำเร็จ`);
      setRepairModalOpen(false);
      setRepairPC(null);
      setRepairReason('');
      fetchData();
    } else {
      const err = await res.json();
      showToast('❌ ' + (err.error || 'แจ้งซ่อมไม่สำเร็จ'));
    }
  };

  const pending = bookings.filter((b) => b.status === 'pending');
  const active = bookings.filter((b) => ['confirmed', 'active'].includes(b.status));

  // Dynamically compute VM status based on real active bookings
  const activeBookingComputerIds = active.map((b) => b.computerId);
  const computedVms = vms.map((v) => {
    if (v.status === 'maintenance' || v.status === 'maintenance-reported') return v;
    const isActuallyOccupied = activeBookingComputerIds.includes(v.id);
    return { ...v, status: isActuallyOccupied ? 'occupied' : 'available' };
  });

  const availableVms = computedVms.filter((v) => v.status === 'available').length;
  const occupiedVms = computedVms.filter((v) => v.status === 'occupied').length;
  const maintenanceVms = computedVms.filter((v) => v.status === 'maintenance' || v.status === 'maintenance-reported').length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-foreground">VM Provisioning Panel</h1>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30">Staff</span>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
            {toast}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'VM ว่าง', value: availableVms, color: 'text-green-600 dark:text-green-400', bg: 'border-green-500/20 bg-green-500/5' },
            { label: 'VM ใช้งาน', value: occupiedVms, color: 'text-pink-600 dark:text-pink-400', bg: 'border-pink-500/20 bg-pink-500/5' },
            { label: 'กำลังซ่อม', value: maintenanceVms, color: 'text-orange-600 dark:text-orange-400', bg: 'border-orange-500/20 bg-orange-500/5' },
            { label: 'รอจ่าย VM', value: pending.length, color: 'text-yellow-600 dark:text-yellow-400', bg: 'border-yellow-500/20 bg-yellow-500/5' },
            { label: 'กำลังใช้งาน', value: active.length, color: 'text-cyan-600 dark:text-cyan-400', bg: 'border-cyan-500/20 bg-cyan-500/5' },
          ].map((s) => (
            <div key={s.label} className={`card-clean border p-4 ${s.bg}`}>
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* VM Pool Status */}
        <div className="mb-8 card-clean p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Cloud Server Pool Status</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">อัปเดตอัตโนมัติทุก 15 วินาที</span>
              <button
                onClick={fetchData}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                🔄 รีเฟรช
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {computedVms.map((vm) => {
              const statusLabel = 
                vm.status === 'available' ? '✅ ว่าง' : 
                vm.status === 'occupied' ? '🟥 ใช้งาน' : 
                vm.status === 'provisioning' ? '⚡ กำลัง Prov.' : 
                vm.status === 'maintenance-reported' ? '⚠️ รอ ผจก. รับเรื่อง' :
                vm.status === 'maintenance' ? '🔧 กำลังซ่อม' : '🔴 Offline';
              const statusColor = 
                vm.status === 'available' ? 'text-green-400' : 
                vm.status === 'occupied' ? 'text-pink-400' : 
                vm.status === 'provisioning' ? 'text-cyan-400' : 
                vm.status === 'maintenance-reported' ? 'text-yellow-400' :
                vm.status === 'maintenance' ? 'text-orange-400' : 'text-slate-400';
              const borderColor = 
                vm.status === 'available' ? 'border-green-500/30 bg-green-500/5' : 
                vm.status === 'occupied' ? 'border-pink-500/30 bg-pink-500/5' : 
                vm.status === 'provisioning' ? 'border-cyan-500/30 bg-cyan-500/5' : 
                vm.status === 'maintenance-reported' ? 'border-yellow-500/30 bg-yellow-500/5' :
                vm.status === 'maintenance' ? 'border-orange-500/30 bg-orange-500/5' : 'border-slate-500/30 bg-slate-500/5';
              const canDelete = vm.status === 'available' || vm.status === 'maintenance';
              return (
                <div key={vm.id} className={`p-3 rounded-xl border ${borderColor} relative group bg-card`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 relative">
                      <div className="text-lg">☁️</div>
                      {vm.maintenanceReason && vm.status !== 'maintenance' && (
                        <span className="absolute top-0 left-6 text-[10px] bg-red-500 text-white px-1 rounded-sm" title="รออนุมัติซ่อม">⚠️ แจ้งซ่อม</span>
                      )}
                      <div className="text-xs text-foreground font-bold truncate mt-0.5">{vm.name}</div>
                      <div className={`text-xs mt-1 font-semibold ${statusColor}`}>{statusLabel}</div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(vm.status === 'available' || vm.status === 'occupied') && !vm.maintenanceReason && (
                        <button
                          onClick={() => { setRepairPC(vm); setRepairReason(''); setRepairModalOpen(true); }}
                          title="แจ้งซ่อมเครื่องนี้"
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 text-sm p-1 rounded bg-muted hover:bg-muted/80 border border-border"
                        >
                          🔧
                        </button>
                      )}
                      {vm.status === 'occupied' && (
                        <>
                          <button
                            onClick={() => alert(`ส่งคำสั่ง Restart ไปยังเครื่อง ${vm.name} เรียบร้อยแล้ว`)}
                            title="Restart เครื่อง"
                            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 text-sm p-1 rounded bg-muted hover:bg-muted/80 border border-border"
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => alert(`ส่งคำสั่ง Force Shutdown ไปยังเครื่อง ${vm.name} เรียบร้อยแล้ว`)}
                            title="Force Shutdown"
                            className="text-red-600 dark:text-red-400 hover:text-red-500 text-sm p-1 rounded bg-muted hover:bg-muted/80 border border-border"
                          >
                            ⚡
                          </button>
                          <button
                            onClick={() => alert(`รีเซ็ตรหัสผ่านชั่วคราวของเครื่อง ${vm.name} สำเร็จ (ส่งให้ลูกค้าแล้ว)`)}
                            title="Reset Password"
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-500 text-sm p-1 rounded bg-muted hover:bg-muted/80 border border-border"
                          >
                            🔑
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComputer(vm.id, vm.name)}
                          title="ลบเครื่องนี้"
                          className="text-red-600 dark:text-red-400 hover:text-red-500 text-sm p-1 rounded bg-muted hover:bg-muted/80 border border-border"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{vm.id}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending — Assign VM */}
          <div className="card-clean border border-yellow-500/20 overflow-hidden bg-card">
            <div className="p-5 border-b border-border bg-yellow-500/5 flex items-center gap-2">
              <span className="text-yellow-500 text-lg">⏳</span>
              <h2 className="font-bold text-foreground">รอจ่าย VM ({pending.length})</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">⏳ กำลังโหลด...</div>
            ) : pending.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">ไม่มีคิวรอ 🎉</div>
            ) : (
              <div className="divide-y divide-border">
                {pending.map((b) => (
                  <div key={b.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-foreground text-sm">สเปค: {b.computerId}</div>
                        <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">ลูกค้า: {b.userId}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{formatDT(b.startTime)} → {formatDT(b.endTime)}</div>
                        <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5 font-bold">ยอดสุทธิ: {b.finalPrice?.toFixed(0)} ฿ ({b.durationHours} ชม.)</div>
                        {b.paymentSlip ? (
                          <div className="mt-2">
                            <button
                              onClick={() => setFullScreenSlip(b.paymentSlip as string)}
                              className="text-xs text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20"
                            >
                              📄 คลิกเพื่อตรวจสอบสลิปโอนเงิน
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 inline-block">
                            ⚠️ ลูกค้าไม่ได้แนบสลิป
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedBooking(b); setForm({ ...emptyForm(), bookingId: b.id }); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/30 hover:bg-primary-500/20 transition-all shrink-0 ml-2 font-bold"
                      >
                        ✅ อนุมัติ & จ่าย VM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active — Manage */}
          <div className="card-clean border border-green-500/20 overflow-hidden bg-card">
            <div className="p-5 border-b border-border bg-green-500/5 flex items-center gap-2">
              <span className="text-green-500 text-lg">🟢</span>
              <h2 className="font-bold text-foreground">กำลังใช้งาน ({active.length})</h2>
            </div>
            {active.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">ไม่มีเซสชันที่ Active</div>
            ) : (
              <div className="divide-y divide-border">
                {active.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground text-sm">{b.computerId}</div>
                      <div className="text-xs text-muted-foreground">{formatDT(b.startTime)} → {formatDT(b.endTime)}</div>
                      {b.connectionDetails && (
                        <div className="text-xs text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">IP: {b.connectionDetails.ip}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleComplete(b.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all"
                    >
                      🔒 ปิดเซสชัน
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assign VM Modal */}
        {form && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <div className="card-clean border border-border p-6 w-full max-w-lg page-enter my-8 bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">🖥 ตรวจสอบสลิป & อนุมัติการจอง</h3>

              {/* Booking summary */}
              <div className="mb-4 p-3 rounded-xl bg-muted border border-border text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สเปค</span>
                  <span className="text-foreground font-bold">{selectedBooking.computerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ลูกค้า</span>
                  <span className="text-foreground text-xs">{selectedBooking.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เวลา</span>
                  <span className="text-foreground text-xs">{formatDT(selectedBooking.startTime)} → {formatDT(selectedBooking.endTime)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 mt-1">
                  <span className="text-muted-foreground">ยอดชำระ</span>
                  <span className="text-primary-600 dark:text-primary-400 font-extrabold text-base">{selectedBooking.finalPrice?.toFixed(2)} ฿</span>
                </div>
              </div>

              {/* Payment Slip Preview */}
              <div className="mb-5">
                <div className="text-sm font-bold text-foreground mb-2">📄 หลักฐานการโอนเงิน</div>
                {selectedBooking.paymentSlip ? (
                  <div className="rounded-xl overflow-hidden border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedBooking.paymentSlip}
                      alt="Payment Slip"
                      className="w-full max-h-72 object-contain"
                    />
                    <div className="p-2 text-center">
                      <button
                        onClick={() => setFullScreenSlip(selectedBooking.paymentSlip as string)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        🔍 คลิกเพื่อขยายดูสลิปเต็มๆ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center text-sm text-orange-600 dark:text-orange-400">
                    ⚠️ ลูกค้าไม่ได้แนบสลิปโอนเงิน กรุณาตรวจสอบก่อนอนุมัติ
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setForm(null); setSelectedBooking(null); setShowRejectBox(false); setRejectReason(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setShowRejectBox(true)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold"
                >
                  ❌ ไม่อนุมัติ
                </button>
                <button
                  onClick={handleAssignVM}
                  disabled={submitting || showRejectBox}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-40"
                >
                  {submitting ? '⏳ กำลังอนุมัติ...' : '✅ อนุมัติการจอง (Auto VM)'}
                </button>
              </div>

              {/* Reject confirmation box */}
              {showRejectBox && (
                <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                  <div className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">❌ แจ้งเหตุผลที่ไม่อนุมัติ</div>
                  <p className="text-xs text-muted-foreground mb-3">ข้อความนี้จะถูกส่งให้ลูกค้าเห็นในหน้า &quot;การเช่าของฉัน&quot; เพื่อให้ลูกค้าสามารถแก้ไขและยืนยันใหม่ได้</p>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="เช่น สลิปไม่ชัดเจน / ยอดโอนไม่ตรง / กรุณาโอนเงินใหม่และแนบสลิปอีกครั้ง..."
                    className="input-clean w-full px-3 py-2 rounded-lg border text-sm resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowRejectBox(false); setRejectReason(''); }}
                      className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleRejectBooking}
                      disabled={!rejectReason.trim() || submitting}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {submitting ? '⏳ กำลังส่ง...' : '📨 ยืนยันไม่อนุมัติ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Screen Slip Lightbox */}
        {fullScreenSlip && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setFullScreenSlip(null)}
          >
            <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                className="absolute -top-10 right-0 text-white hover:text-red-400 font-bold text-xl"
                onClick={() => setFullScreenSlip(null)}
              >
                ✕ ปิด
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullScreenSlip}
                alt="Full Screen Slip"
                className="w-full h-full object-contain rounded-lg border border-[#8b5cf6]/30 shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Repair Modal */}
        {repairModalOpen && repairPC && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="card-clean border border-yellow-500/30 p-6 w-full max-w-md page-enter bg-card">
              <h3 className="text-lg font-bold text-foreground mb-2">🔧 แจ้งปัญหาเครื่อง {repairPC.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">ข้อมูลจะถูกส่งให้ผู้จัดการเพื่อดำเนินการประสานงานช่างต่อไป</p>
              
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">รายละเอียดปัญหา / อาการเสีย</label>
                <textarea
                  rows={4}
                  value={repairReason}
                  onChange={(e) => setRepairReason(e.target.value)}
                  placeholder="เช่น จอฟ้า, คีย์บอร์ดกดไม่ติด, เครื่องเปิดไม่ติด..."
                  className="input-clean w-full px-3 py-2 rounded-lg border text-sm resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setRepairModalOpen(false); setRepairPC(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={submitRepairReport}
                  disabled={submitting || !repairReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 font-bold transition-all text-sm disabled:opacity-40"
                >
                  {submitting ? 'กำลังส่ง...' : '📨 ส่งแจ้งซ่อม'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
