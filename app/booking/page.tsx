'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import PromptPayQR from '@/components/ui/PromptPayQR';
import type { Computer, DiscountApplied, MembershipTier } from '@/lib/types';

const zoneConfig: Record<string, { label: string; tier: string; color: string; border: string; bg: string; icon: string }> = {
  A: { label: 'Cloud Standard', tier: 'Standard', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', icon: '☁️' },
  B: { label: 'Cloud Pro', tier: 'Pro', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5', icon: '⚡' },
  VIP: { label: 'Cloud Ultra VIP', tier: 'Ultra', color: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-500/5', icon: '👑' },
};

function BookingForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [computers, setComputers] = useState<Computer[]>([]);
  const [selectedPc, setSelectedPc] = useState<Computer | null>(null);
  const [membership, setMembership] = useState<{ tier: MembershipTier } | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [promo, setPromo] = useState<{ basePrice: number; discountsApplied: DiscountApplied[]; totalDiscount: number; finalPrice: number; durationHours: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    setStartTime(`${todayStr}T10:00`);
    setEndTime(`${todayStr}T12:00`);
  }, []);

  useEffect(() => {
    fetch('/api/computers?status=available')
      .then((r) => r.json())
      .then((d) => {
        setComputers(d.computers);
        const pcId = searchParams.get('computer');
        if (pcId) {
          const found = d.computers.find((c: Computer) => c.id === pcId);
          if (found) setSelectedPc(found);
        }
      });
  }, [searchParams]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/membership?userId=${session.user.id}`)
        .then((r) => r.json())
        .then((d) => setMembership(d.membership));
    }
  }, [session]);

  useEffect(() => {
    if (!selectedPc || !startTime || !endTime) { setPromo(null); return; }
    setLoading(true);
    fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        pricePerHour: selectedPc.pricePerHour,
        membershipTier: membership?.tier ?? 'none',
        isNewMember: session?.user?.isNewMember ?? false,
        firstBillUsed: session?.user?.firstBillUsed ?? false,
      }),
    })
      .then((r) => r.json())
      .then((d) => { setPromo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedPc, startTime, endTime, membership, session]);

  const handleBook = () => {
    if (!session?.user) { router.push('/login'); return; }
    if (!selectedPc || !startTime || !endTime) return;
    setShowPaymentModal(true);
  };

  const [verifyingSlip, setVerifyingSlip] = useState(false);
  const [slipError, setSlipError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If file type is completely empty, it might be an image without an extension.
    // If it is explicitly not an image (and not empty), we can warn them, but let's be lenient.
    if (file.type && !file.type.startsWith('image/') && !file.type.startsWith('application/')) {
      setSlipError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      return;
    }

    setSlipError('');
    setVerifyingSlip(true);
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setSlipPreview(objectUrl);

    // Read as base64 for saving
    const reader = new FileReader();
    reader.onload = (event) => {
      setPaymentSlip(event.target?.result as string);
      setVerifyingSlip(false);
    };
    reader.onerror = () => {
      setSlipError('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setVerifyingSlip(false);
    };
    reader.readAsDataURL(file);
  };

  const submitBooking = async () => {
    if (!session?.user || !selectedPc || !startTime || !endTime || !paymentSlip) return;
    setSubmitting(true);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        computerId: selectedPc.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        pricePerHour: selectedPc.pricePerHour,
        note,
        paymentSlip,
      }),
    });
    setSubmitting(false);
    if (res.ok) { 
      setShowPaymentModal(false);
      setSuccess(true); 
      setTimeout(() => router.push('/my-bookings'), 2000); 
    } else {
      alert('เกิดข้อผิดพลาดในการจอง');
    }
  };

  // Group by zone
  const grouped = computers.reduce((acc, c) => {
    if (!acc[c.zone]) acc[c.zone] = [];
    acc[c.zone].push(c);
    return acc;
  }, {} as Record<string, Computer[]>);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center page-enter">
          <div className="text-6xl mb-4">☁️</div>
          <h2 className="text-3xl font-black text-white mb-2">จองสำเร็จ!</h2>
          <p className="text-[#94a3b8] mb-1">เราจะจัดเตรียม Cloud PC ของคุณ</p>
          <p className="text-[#94a3b8]">ดูข้อมูลการเชื่อมต่อได้ที่หน้า "การจองของฉัน"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 page-enter">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">เช่า Cloud PC</h1>
          <p className="text-[#94a3b8]">เลือกแพ็กเกจ กำหนดเวลา รับลิงก์เชื่อมต่อได้ทันที</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: Select Package */}
            <div className="card-neon p-6 border border-[#1e2035]">
              <h2 className="text-lg font-bold text-white mb-5">1. เลือกแพ็กเกจ Cloud PC</h2>
              {(['A', 'B', 'VIP'] as const).map((zone) => {
                const cfg = zoneConfig[zone];
                const zoneComputers = grouped[zone] ?? [];
                if (zoneComputers.length === 0) return null;
                return (
                  <div key={zone} className="mb-6">
                    <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${cfg.border}`}>
                      <span className="text-xl">{cfg.icon}</span>
                      <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-[#475569]">({zoneComputers.length} เครื่องว่าง)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {zoneComputers.map((pc) => (
                        <button
                          key={pc.id}
                          onClick={() => setSelectedPc(pc)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedPc?.id === pc.id
                              ? `${cfg.border} ${cfg.bg} shadow-[0_0_20px_rgba(139,92,246,0.15)]`
                              : 'border-[#1e2035] hover:border-[#8b5cf6]/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white text-sm">{pc.name}</span>
                            <span className={`text-xs font-bold ${cfg.color}`}>{pc.pricePerHour} ฿/ชม.</span>
                          </div>
                          <div className="text-xs text-[#475569] space-y-0.5">
                            <div>🖥 {pc.specs.gpu}</div>
                            <div>💾 {pc.specs.ram} · {pc.specs.cpu}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {selectedPc && (
                <div className="mt-4 p-4 rounded-lg bg-[#0a0a1a] border border-[#8b5cf6]/20 text-sm">
                  <div className="font-semibold text-white mb-2">🔍 รายละเอียด: {selectedPc.name}</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-[#94a3b8]">
                    <div>⚡ CPU: {selectedPc.specs.cpu}</div>
                    <div>🎮 GPU: {selectedPc.specs.gpu}</div>
                    <div>💾 RAM: {selectedPc.specs.ram}</div>
                    {selectedPc.specs.extras && <div>➕ {selectedPc.specs.extras}</div>}
                  </div>
                  <div className="mt-2 text-xs text-cyan-400">
                    📡 {selectedPc.specs.monitor}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Time */}
            <div className="card-neon p-6 border border-[#1e2035]">
              <h2 className="text-lg font-bold text-white mb-4">2. กำหนดช่วงเวลาการเช่า</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1.5">เริ่มต้น</label>
                  <input id="start-time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-cyber w-full px-4 py-3 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1.5">สิ้นสุด</label>
                  <input id="end-time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-cyber w-full px-4 py-3 rounded-lg border text-sm" />
                </div>
              </div>
              <p className="text-xs text-[#475569] mt-3">⏱ ข้อมูลการเชื่อมต่อ (IP, รหัสผ่าน) จะแสดงในหน้า "การจองของฉัน" ก่อนถึงเวลาเริ่มต้น</p>
            </div>

            {/* Step 3: Note */}
            <div className="card-neon p-6 border border-[#1e2035]">
              <h2 className="text-lg font-bold text-white mb-4">3. หมายเหตุ / แจ้งความต้องการพิเศษ</h2>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input-cyber w-full px-4 py-3 rounded-lg border text-sm resize-none" placeholder="เช่น ต้องการติดตั้งซอฟต์แวร์พิเศษ, ขอ Moonlight แทน Parsec..." />
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <div className="card-neon p-6 border border-[#8b5cf6]/30 sticky top-20">
              <h2 className="text-lg font-bold text-white mb-4">สรุปการเช่า</h2>
              {!selectedPc ? (
                <p className="text-[#475569] text-sm">เลือกแพ็กเกจก่อน</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">แพ็กเกจ</span>
                    <span className="text-white font-medium text-right text-xs">{selectedPc.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">ระดับ</span>
                    <span className={`font-medium ${zoneConfig[selectedPc.zone]?.color}`}>{zoneConfig[selectedPc.zone]?.tier}</span>
                  </div>
                  {promo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">ระยะเวลา</span>
                        <span className="text-white">{promo.durationHours} ชั่วโมง</span>
                      </div>
                      <div className="border-t border-[#1e2035] pt-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#94a3b8]">ราคาปกติ</span>
                          <span className="text-[#94a3b8] line-through">{promo.basePrice.toFixed(0)} ฿</span>
                        </div>
                        {promo.discountsApplied.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-green-400">✓ {d.label}</span>
                            <span className="text-green-400">-{d.amount.toFixed(0)} ฿</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[#1e2035] pt-3 flex justify-between items-center">
                        <span className="font-bold text-white">รวมสุทธิ</span>
                        <span className="text-2xl font-black text-[#00d4ff]" style={{ fontFamily: 'Orbitron' }}>{promo.finalPrice.toFixed(0)} ฿</span>
                      </div>
                      {promo.totalDiscount > 0 && (
                        <div className="text-center text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg py-2">
                          🎉 ประหยัดไป {promo.totalDiscount.toFixed(0)} บาท!
                        </div>
                      )}
                    </>
                  )}
                  {loading && <div className="text-center text-xs text-[#94a3b8] py-2">⏳ คำนวณส่วนลด...</div>}
                </div>
              )}

              <button
                id="confirm-booking"
                onClick={handleBook}
                disabled={!selectedPc || !startTime || !endTime || submitting || !session}
                className="btn-cyber w-full py-3 rounded-xl font-bold mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {!session ? '🔐 เข้าสู่ระบบก่อนจอง' : submitting ? '⏳ กำลังจอง...' : '✅ ยืนยันการเช่า'}
              </button>
              {!session && (
                <p className="text-center text-xs text-[#94a3b8] mt-2">
                  <a href="/login" className="text-[#00d4ff] hover:underline">เข้าสู่ระบบ</a> หรือ <a href="/register" className="text-[#00d4ff] hover:underline">สมัครสมาชิก</a>
                </p>
              )}
            </div>

            {/* How it works */}
            <div className="card-neon p-4 border border-[#1e2035] text-xs space-y-2 mt-4">
              <div className="text-white font-semibold mb-2">📡 วิธีการเชื่อมต่อ</div>
              <div className="text-[#94a3b8] space-y-1.5">
                <div>1️⃣ จองและชำระเงิน</div>
                <div>2️⃣ รับ IP + รหัสผ่านในหน้า "การจองของฉัน"</div>
                <div>3️⃣ เปิด Parsec หรือ Moonlight บนเครื่องคุณ</div>
                <div>4️⃣ กรอกข้อมูลและเริ่มเล่นได้เลย 🎮</div>
              </div>
            </div>

            {/* Promotions */}
            <div className="card-neon p-4 border border-[#1e2035] text-xs text-[#94a3b8] space-y-1 mt-4">
              <div className="text-white font-semibold mb-2">💡 โปรโมชั่น</div>
              <div>☀️ จ.-ศ. 09:00-15:00 → ลด 20%</div>
              <div>⏱️ เช่า 4+ ชม. → ลด 15%</div>
              <div>🌙 22:00-02:00 → ลด 20%</div>
              <div>👑 สมาชิก VIP/Premium → ลด 10-15%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && promo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="card-neon border border-[#00d4ff]/30 p-6 sm:p-8 w-full max-w-md page-enter bg-[#0a0a1a] text-center my-8">
            <h3 className="text-xl font-black text-white mb-2">ชำระเงินค่าเช่า</h3>
            <p className="text-[#94a3b8] text-sm mb-4">สแกน QR Code ด้านล่างและแนบสลิปเพื่อยืนยันการจอง</p>

            {/* Amount box */}
            <div className="mb-4 py-3 px-4 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 inline-block w-full">
              <div className="text-xs text-[#94a3b8] mb-1">ยอดชำระสุทธิ</div>
              <div className="text-3xl font-black text-[#00d4ff]">{promo.finalPrice.toFixed(2)}</div>
              <div className="text-xs text-[#94a3b8] mt-0.5">บาท</div>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
              <PromptPayQR amount={promo.finalPrice} size={200} />
            </div>

            {/* Upload Slip */}
            <div className="mb-6 text-left border border-[#1e2035] rounded-xl p-4 bg-[#1e2035]/30">
              <label className="block text-sm font-bold text-white mb-2">แนบสลิปโอนเงิน <span className="text-red-400">*</span></label>
              <input 
                type="file" 
                onChange={handleFileChange}
                disabled={verifyingSlip}
                className="block w-full text-sm text-[#94a3b8] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8b5cf6]/20 file:text-[#8b5cf6] hover:file:bg-[#8b5cf6]/30 transition-all cursor-pointer disabled:opacity-50"
              />
              
              {verifyingSlip && (
                <div className="mt-3 text-sm text-[#00d4ff] flex items-center gap-2">
                  <span className="animate-spin">⏳</span> กำลังตรวจสอบรูปภาพสลิป...
                </div>
              )}
              
              {slipError && (
                <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded">
                  ⚠️ {slipError}
                </div>
              )}

              {slipPreview && !slipError && !verifyingSlip && (
                <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-[#8b5cf6]/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="Slip Preview" className="w-full object-contain h-full bg-black/50" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentSlip(null);
                  setSlipPreview(null);
                  setSlipError('');
                }}
                disabled={submitting || verifyingSlip}
                className="flex-1 py-3 rounded-xl border border-[#1e2035] text-[#94a3b8] hover:text-white hover:bg-[#1e2035] transition-all text-sm font-semibold disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submitBooking}
                disabled={submitting || !paymentSlip || verifyingSlip || !!slipError}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#00d4ff] text-white font-bold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all text-sm disabled:opacity-50"
              >
                {submitting ? '⏳ กำลังยืนยัน...' : '✅ แจ้งโอนเงิน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <BookingForm />
    </Suspense>
  );
}
