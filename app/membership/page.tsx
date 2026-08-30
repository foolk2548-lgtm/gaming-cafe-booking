'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import PromptPayQR from '@/components/ui/PromptPayQR';

const tiers = [
  {
    tier: 'member', label: 'Member', price: 299, discount: 5, color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    perks: ['ส่วนลด 5% ทุกครั้ง', 'สะสมแต้ม 1 แต้ม/10 บาท', 'จองล่วงหน้าได้ 3 วัน'],
  },
  {
    tier: 'vip', label: 'VIP', price: 699, discount: 10, color: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    perks: ['ส่วนลด 10% ทุกครั้ง', 'สะสมแต้ม 1.5 แต้ม/10 บาท', 'จองล่วงหน้าได้ 7 วัน', 'VIP Zone 1 ชม./เดือน'],
  },
  {
    tier: 'premium', label: 'Premium', price: 1299, discount: 15, color: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-400/30', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    perks: ['ส่วนลด 15% ทุกครั้ง', 'สะสมแต้ม 2 แต้ม/10 บาท', 'จองล่วงหน้าได้ 14 วัน', 'VIP Zone 3 ชม./เดือน'],
  },
];

export default function MembershipPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [membership, setMembership] = useState<{ id: string; tier: string; totalSpent: number; points: number; bookingCount: number; expiryDate: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [paymentTier, setPaymentTier] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadMembership = () => {
    if (session?.user?.id) {
      fetch(`/api/membership?userId=${session.user.id}`)
        .then((r) => r.json())
        .then((d) => { setMembership(d.membership); setLoading(false); });
    } else if (status !== 'loading') setLoading(false);
  };

  useEffect(() => {
    loadMembership();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const handleJoin = async (tier: string) => {
    if (!session?.user) { router.push('/login'); return; }
    setJoining(tier);
    const res = await fetch('/api/membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, tier }),
    });
    const data = await res.json();
    setJoining(null);
    if (res.ok) {
      setMembership(data.membership);
      setSuccess(`สมัคร/อัปเกรด ${tier.toUpperCase()} สำเร็จ! 🎉`);
      setPaymentTier(null);
    } else {
      alert('เกิดข้อผิดพลาด: ' + data.error);
    }
  };

  const handleCancelMembership = async () => {
    if (!session?.user || !membership) return;
    setCancelling(true);
    const res = await fetch(`/api/membership?membershipId=${membership.id}&userId=${session.user.id}`, {
      method: 'DELETE',
    });
    setCancelling(false);
    if (res.ok) {
      setMembership(null);
      setCancelConfirm(false);
      setSuccess('ยกเลิกสมาชิกเรียบร้อยแล้ว');
    } else {
      const data = await res.json();
      alert('ยกเลิกไม่สำเร็จ: ' + data.error);
    }
  };

  const tierInfo: Record<string, { label: string; badge: string }> = {
    member: { label: 'Member', badge: 'bg-blue-500/20 text-blue-400' },
    vip: { label: 'VIP', badge: 'bg-purple-500/20 text-purple-400' },
    premium: { label: 'Premium', badge: 'bg-amber-500/20 text-amber-400' },
  };

  const currentTierData = tiers.find((t) => t.tier === membership?.tier);

  if (status === 'loading') return (
    <div className="min-h-screen"><Navbar /><div className="p-8 text-center text-muted-foreground">⏳ กำลังโหลด...</div></div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 page-enter">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-3">ระบบสมาชิก</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">เลือกแพ็กเกจที่เหมาะกับคุณ รับส่วนลดและสิทธิพิเศษสุดคุ้ม</p>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center font-semibold">
            {success}
          </div>
        )}

        {/* Current membership banner */}
        {membership && (
          <div className="mb-10 card-clean p-6 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">สถานะสมาชิกปัจจุบัน</div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-foreground">{tierInfo[membership.tier]?.label ?? membership.tier}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tierInfo[membership.tier]?.badge}`}>Active</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">หมดอายุ: {membership.expiryDate}</div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{membership.totalSpent.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">ยอดรวม (฿)</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{membership.points}</div>
                  <div className="text-xs text-muted-foreground">แต้มสะสม</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground">{membership.bookingCount}</div>
                  <div className="text-xs text-muted-foreground">ครั้งที่จอง</div>
                </div>
              </div>
            </div>
            {/* Cancel button */}
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => setCancelConfirm(true)}
                className="text-xs px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                🗑️ ยกเลิกสมาชิก
              </button>
            </div>
          </div>
        )}

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => {
            const isCurrentTier = membership?.tier === t.tier;
            return (
              <div key={t.tier} className={`card-clean border p-6 ${isCurrentTier ? 'ring-2 ring-primary-500/50' : 'border-border'}`}>
                {isCurrentTier && (
                  <div className="text-center mb-3 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full py-1">
                    ✓ แพ็กเกจของคุณ
                  </div>
                )}
                <div className="text-center mb-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${t.badge}`}>
                    {t.label}
                  </span>
                  <div className="mt-4">
                    <span className="text-4xl font-extrabold text-foreground">{t.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">บาท/ปี</span>
                  </div>
                  <div className="text-primary-600 dark:text-primary-400 font-bold mt-1">ส่วนลด {t.discount}% ทุกครั้ง</div>
                </div>

                <ul className="space-y-2 mb-6">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-600 dark:text-green-400 shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (!session?.user) { router.push('/login'); return; }
                    if (!isCurrentTier && !loading) setPaymentTier(t.tier);
                  }}
                  disabled={isCurrentTier || loading || joining === t.tier}
                  className={`w-full py-3 rounded-xl text-sm transition-all ${
                    isCurrentTier
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : 'btn-primary hover:shadow-md'
                  }`}
                >
                  {isCurrentTier ? '✓ แพ็กเกจปัจจุบัน' : joining === t.tier ? '⏳ กำลังดำเนินการ...' : membership ? `เปลี่ยนเป็น ${t.label}` : `สมัคร ${t.label}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* New member perk */}
        <div className="mt-10 card-clean p-6 border border-green-500/30 bg-green-500/5 text-center">
          <div className="text-2xl mb-2">🎁</div>
          <h3 className="text-foreground font-bold mb-1">โบนัสสมาชิกใหม่</h3>
          <p className="text-muted-foreground text-sm">สมัครสมาชิกแล้วรับส่วนลด <span className="text-green-600 dark:text-green-400 font-bold">100 บาท</span> สำหรับบิลแรกที่ 600 บาทขึ้นไปโดยอัตโนมัติ!</p>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentTier && (() => {
        const tierData = tiers.find((t) => t.tier === paymentTier)!;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="card-clean border border-border p-8 w-full max-w-sm page-enter bg-card text-center">
              <h3 className="text-xl font-extrabold text-foreground mb-1">
                {membership ? `เปลี่ยนเป็น ${tierData.label}` : `สมัคร ${tierData.label}`}
              </h3>
              <p className="text-muted-foreground text-sm mb-3">สแกน QR Code ด้านล่างเพื่อชำระเงินผ่าน PromptPay</p>

              {/* Amount box */}
              <div className="mb-4 py-3 px-4 rounded-xl bg-primary-500/10 border border-primary-500/30 inline-block w-full">
                <div className="text-xs text-muted-foreground mb-1">ยอดชำระ</div>
                <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">฿{tierData.price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">บาท / ปี</div>
              </div>

              <div className="bg-white p-4 rounded-xl inline-block mb-5 shadow-sm border border-border">
                <PromptPayQR amount={tierData.price} size={220} />
              </div>

              <p className="text-xs text-muted-foreground mb-5">โอนเงินแล้วกด &quot;ยืนยันการชำระเงิน&quot; ด้านล่าง</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentTier(null)}
                  disabled={joining !== null}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm font-semibold disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleJoin(paymentTier)}
                  disabled={joining !== null}
                  className="flex-1 py-3 btn-primary disabled:opacity-50"
                >
                  {joining === paymentTier ? '⏳ กำลังตรวจสอบ...' : '✅ ยืนยันการชำระเงิน'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Confirm Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="card-clean border border-red-500/30 p-8 w-full max-w-sm page-enter bg-card text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-extrabold text-foreground mb-2">ยืนยันการยกเลิกสมาชิก</h3>
            <p className="text-muted-foreground text-sm mb-2">
              คุณกำลังจะยกเลิกแพ็กเกจ <span className="text-foreground font-bold">{tierInfo[membership?.tier ?? '']?.label}</span>
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs mb-6">แต้มสะสมและสิทธิ์ส่วนลดทั้งหมดจะถูกยกเลิก</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm font-semibold"
              >
                ไม่ยกเลิก
              </button>
              <button
                onClick={handleCancelMembership}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 font-bold transition-all text-sm disabled:opacity-50"
              >
                {cancelling ? '⏳ กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
