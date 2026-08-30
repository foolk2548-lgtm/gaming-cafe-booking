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
          <h2 className="text-3xl font-extrabold text-foreground mb-2">จองสำเร็จ!</h2>
          <p className="text-muted-foreground mb-1">เราจะจัดเตรียม Cloud PC ของคุณ</p>
          <p className="text-muted-foreground">ดูข้อมูลการเชื่อมต่อได้ที่หน้า "การจองของฉัน"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 page-enter">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">เช่า Cloud PC</h1>
          <p className="text-muted-foreground">เลือกแพ็กเกจ กำหนดเวลา รับลิงก์เชื่อมต่อได้ทันที</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            <div className="card-clean p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-5">1. เลือกแพ็กเกจ Cloud PC</h2>
              {(['A', 'B', 'VIP'] as const).map((zone) => {
                const cfg = zoneConfig[zone];
                const zoneComputers = grouped[zone] ?? [];
                if (zoneComputers.length === 0) return null;
                const samplePc = zoneComputers[0];
                return (
                  <div key={zone} className="mb-4">
                    <button
                      onClick={() => {
                        // Auto-assign random available PC in this zone
                        const randomPc = zoneComputers[Math.floor(Math.random() * zoneComputers.length)];
                        setSelectedPc(randomPc);
                      }}
                      className={`w-full p-5 rounded-xl border text-left transition-all ${
                        selectedPc?.zone === zone
                          ? `border-primary-500 bg-primary-500/10 shadow-sm`
                          : 'border-border hover:border-primary-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{cfg.icon}</span>
                          <div>
                            <div className={`font-bold text-lg ${cfg.color.replace('400', '600').replace('400', '600')} dark:${cfg.color}`}>{cfg.label}</div>
                            <div className="text-xs text-muted-foreground">{zoneComputers.length} เครื่องว่างในระบบ (สุ่มจ่ายเครื่องอัตโนมัติ)</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-foreground">{samplePc.pricePerHour} ฿</span>
                          <span className="text-xs text-muted-foreground"> / ชม.</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        <span className="bg-muted px-2 py-1 rounded">🖥 {samplePc.specs.gpu}</span>
                        <span className="bg-muted px-2 py-1 rounded">💾 {samplePc.specs.ram}</span>
                        <span className="bg-muted px-2 py-1 rounded">⚡ {samplePc.specs.cpu}</span>
                        {samplePc.specs.extras && <span className="bg-muted px-2 py-1 rounded">➕ {samplePc.specs.extras}</span>}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Step 2: Time */}
            <div className="card-clean p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">2. กำหนดช่วงเวลาการเช่า</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">เริ่มต้น</label>
                  <input id="start-time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-clean w-full px-4 py-3 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">สิ้นสุด</label>
                  <input id="end-time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-clean w-full px-4 py-3 rounded-lg border text-sm" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">⏱ ข้อมูลการเชื่อมต่อ (IP, รหัสผ่าน) จะแสดงในหน้า "การจองของฉัน" ก่อนถึงเวลาเริ่มต้น</p>
            </div>

            {/* Step 3: Note */}
            <div className="card-clean p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">3. หมายเหตุ / แจ้งความต้องการพิเศษ</h2>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input-clean w-full px-4 py-3 rounded-lg border text-sm resize-none" placeholder="เช่น ต้องการติดตั้งซอฟต์แวร์พิเศษ, ขอ Moonlight แทน Parsec..." />
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <div className="card-clean p-6 border border-border sticky top-20">
              <h2 className="text-lg font-bold text-foreground mb-4">สรุปการเช่า</h2>
              {!selectedPc ? (
                <p className="text-muted-foreground text-sm">เลือกแพ็กเกจก่อน</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">แพ็กเกจ</span>
                    <span className="text-foreground font-medium text-right text-xs">{zoneConfig[selectedPc.zone]?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ระดับ</span>
                    <span className={`font-medium ${zoneConfig[selectedPc.zone]?.color.replace('400', '600').replace('400', '600')} dark:${zoneConfig[selectedPc.zone]?.color}`}>{zoneConfig[selectedPc.zone]?.tier}</span>
                  </div>
                  {promo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ระยะเวลา</span>
                        <span className="text-foreground">{promo.durationHours} ชั่วโมง</span>
                      </div>
                      <div className="border-t border-border pt-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ราคาปกติ</span>
                          <span className="text-muted-foreground line-through">{promo.basePrice.toFixed(0)} ฿</span>
                        </div>
                        {promo.discountsApplied.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-green-600 dark:text-green-400">✓ {d.label}</span>
                            <span className="text-green-600 dark:text-green-400">-{d.amount.toFixed(0)} ฿</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between items-center">
                        <span className="font-bold text-foreground">รวมสุทธิ</span>
                        <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{promo.finalPrice.toFixed(0)} ฿</span>
                      </div>
                      {promo.totalDiscount > 0 && (
                        <div className="text-center text-xs text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg py-2 mt-2">
                          🎉 ประหยัดไป {promo.totalDiscount.toFixed(0)} บาท!
                        </div>
                      )}
                    </>
                  )}
                  {loading && <div className="text-center text-xs text-muted-foreground py-2">⏳ คำนวณส่วนลด...</div>}
                </div>
              )}

              <button
                id="confirm-booking"
                onClick={handleBook}
                disabled={!selectedPc || !startTime || !endTime || submitting || !session}
                className="btn-primary w-full py-3 rounded-xl mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {!session ? '🔐 เข้าสู่ระบบก่อนจอง' : submitting ? '⏳ กำลังจอง...' : '✅ ยืนยันการเช่า'}
              </button>
              {!session && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  <a href="/login" className="text-primary-600 hover:underline">เข้าสู่ระบบ</a> หรือ <a href="/register" className="text-primary-600 hover:underline">สมัครสมาชิก</a>
                </p>
              )}
            </div>

            {/* How it works */}
            <div className="card-clean p-4 border border-border text-xs space-y-2 mt-4">
              <div className="text-foreground font-semibold mb-2">📡 วิธีการเชื่อมต่อ</div>
              <div className="text-muted-foreground space-y-1.5">
                <div>1️⃣ จองและชำระเงิน</div>
                <div>2️⃣ รับ IP + รหัสผ่านในหน้า "การจองของฉัน"</div>
                <div>3️⃣ เปิด Parsec หรือ Moonlight บนเครื่องคุณ</div>
                <div>4️⃣ กรอกข้อมูลและเริ่มเล่นได้เลย 🎮</div>
              </div>
            </div>

            {/* Promotions */}
            <div className="card-clean p-4 border border-border text-xs text-muted-foreground space-y-1 mt-4">
              <div className="text-foreground font-semibold mb-2">💡 โปรโมชั่น</div>
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
          <div className="card-clean border border-border p-6 sm:p-8 w-full max-w-md page-enter bg-card text-center my-8">
            <h3 className="text-xl font-extrabold text-foreground mb-2">ชำระเงินค่าเช่า</h3>
            <p className="text-muted-foreground text-sm mb-4">สแกน QR Code ด้านล่างและแนบสลิปเพื่อยืนยันการจอง</p>

            {/* Amount box */}
            <div className="mb-4 py-3 px-4 rounded-xl bg-primary-500/10 border border-primary-500/30 inline-block w-full">
              <div className="text-xs text-muted-foreground mb-1">ยอดชำระสุทธิ</div>
              <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{promo.finalPrice.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">บาท</div>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-sm border border-border">
              <PromptPayQR amount={promo.finalPrice} size={200} />
            </div>

            {/* Upload Slip */}
            <div className="mb-6 text-left border border-border rounded-xl p-4 bg-muted/30">
              <label className="block text-sm font-bold text-foreground mb-2">แนบสลิปโอนเงิน <span className="text-red-500">*</span></label>
              <input 
                type="file" 
                onChange={handleFileChange}
                disabled={verifyingSlip}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500/20 file:text-primary-600 dark:file:text-primary-400 hover:file:bg-primary-500/30 transition-all cursor-pointer disabled:opacity-50"
              />
              
              {verifyingSlip && (
                <div className="mt-3 text-sm text-primary-600 dark:text-primary-400 flex items-center gap-2">
                  <span className="animate-spin">⏳</span> กำลังตรวจสอบรูปภาพสลิป...
                </div>
              )}
              
              {slipError && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded">
                  ⚠️ {slipError}
                </div>
              )}

              {slipPreview && !slipError && !verifyingSlip && (
                <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="Slip Preview" className="w-full object-contain h-full bg-muted" />
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
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm font-semibold disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submitBooking}
                disabled={submitting || !paymentSlip || verifyingSlip || !!slipError}
                className="flex-1 py-3 btn-primary disabled:opacity-50"
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
