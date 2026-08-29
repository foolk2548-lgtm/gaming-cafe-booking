import Navbar from '@/components/ui/Navbar';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const features = [
  { icon: '☁️', title: 'คอมพิวเตอร์ผ่านคลาวด์', desc: 'ครบ 3 ระดับ ตั้งแต่ Standard ถึง Ultra VIP พร้อมสเปคระดับเซิร์ฟเวอร์' },
  { icon: '⚡', title: 'เช่าออนไลน์ได้ทันที', desc: 'เลือกแพ็กเกจ เลือกเวลา รับข้อมูลเชื่อมต่อในไม่กี่วินาที' },
  { icon: '💎', title: 'โปรโมชั่นพิเศษ 5 รูปแบบ', desc: 'เวลาทำการ, ใช้งานยาวลดพิเศษ, สิทธิ์สมาชิก VIP และอีกมากมาย' },
  { icon: '🏆', title: 'ระบบสมาชิก', desc: 'สะสมแต้ม อัปเกรดระดับ รับสิทธิ์พิเศษเพิ่มขึ้นเรื่อยๆ' },
];

const promotions = [
  { icon: '☀️', label: 'ช่วงกลางวัน', desc: 'จ.-ศ. 09:00-15:00', discount: '-20%', color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
  { icon: '⏱️', label: 'ใช้งานยาว', desc: 'ต่อเนื่อง 4+ ชม.', discount: '-15%', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-cyan-500/30' },
  { icon: '🌙', label: 'ช่วงดึก', desc: '22:00-02:00 น.', discount: '-20%', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
  { icon: '👑', label: 'สมาชิก VIP', desc: 'VIP / Premium', discount: '-10~15%', color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30' },
  { icon: '🎁', label: 'สมาชิกใหม่', desc: 'บิลแรก ≥ 600 บาท', discount: '-100฿', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
];

const zones = [
  { name: 'Cloud Standard', label: 'Standard', color: 'text-[#00d4ff]', border: 'border-[#00d4ff]/30', bg: 'bg-[#00d4ff]/10', price: '30', specs: '4 vCPU / 16GB RAM / RTX 3060', count: 8 },
  { name: 'Cloud Pro', label: 'Pro', color: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]/30', bg: 'bg-[#8b5cf6]/10', price: '40', specs: '8 vCPU / 32GB RAM / RTX 4070', count: 6 },
  { name: 'Cloud Ultra VIP', label: 'Ultra', color: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/10', price: '60', specs: '16 vCPU / 64GB RAM / RTX 4090', count: 6 },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 text-center">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-pink-600/8 rounded-full blur-[100px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="mx-auto max-w-5xl page-enter">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-4 py-2 text-sm text-[#8b5cf6]">
            <span className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
            ระบบเช่า Cloud PC ออนไลน์ — เปิดให้บริการ 24/7
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-7xl">
            <span className="gradient-text">CLOUD SPACE</span>
            <br />
            <span className="text-white">พลังประมวลผลที่คุณเข้าถึงได้</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-[#94a3b8] leading-relaxed">
            เช่า Cloud PC ประสิทธิภาพสูงออนไลน์ได้ทันที เลือกระดับที่ต้องการ กำหนดเวลา รับส่วนลดสูงสุด <span className="text-[#00d4ff] font-semibold">35%</span> พร้อมระบบสมาชิกสุดคุ้ม
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/booking" className="btn-cyber px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2">
              ☁️ เช่า Cloud PC
            </Link>
            <Link href="/membership" className="px-8 py-4 rounded-xl text-lg font-bold border border-[#8b5cf6]/50 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-all flex items-center justify-center gap-2">
              💎 แพ็กเกจสมาชิก
            </Link>
            <a href="#promotions" className="px-8 py-4 rounded-xl text-lg font-bold border border-[#00d4ff]/50 text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all flex items-center justify-center gap-2">
              🎁 ดูโปรโมชั่น
            </a>
          </div>

          {/* Live stats */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { label: 'เซิร์ฟเวอร์', value: '20', unit: 'VMs' },
              { label: 'เปิดบริการ', value: '24', unit: 'ชม./วัน' },
              { label: 'โปรโมชั่น', value: '5', unit: 'รูปแบบ' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-[#00d4ff]" style={{ fontFamily: 'Orbitron' }}>{stat.value}</div>
                <div className="text-xs text-[#94a3b8] mt-1">{stat.unit}<br />{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section id="promotions" className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">โปรโมชั่นพิเศษ</h2>
            <p className="text-[#94a3b8]">ส่วนลดคำนวณแบบซ้อนกัน ยิ่งครบเงื่อนไข ยิ่งประหยัด!</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {promotions.map((promo) => (
              <div key={promo.label} className={`card-neon p-5 text-center bg-gradient-to-b ${promo.color} border ${promo.border}`}>
                <div className="text-3xl mb-3">{promo.icon}</div>
                <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Orbitron' }}>{promo.discount}</div>
                <div className="text-sm font-semibold text-white mb-1">{promo.label}</div>
                <div className="text-xs text-[#94a3b8]">{promo.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zones */}
      <section className="px-4 py-16 bg-[#0a0a1a]/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">แพ็กเกจ Cloud PC</h2>
            <p className="text-[#94a3b8]">3 ระดับ ตอบโจทย์ทุกการใช้งาน</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <div key={zone.name} className={`card-neon p-6 border ${zone.border}`}>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${zone.bg} ${zone.color}`}>
                  {zone.label}
                </div>
                <h3 className={`text-2xl font-black mb-2 ${zone.color}`} style={{ fontFamily: 'Orbitron' }}>{zone.name}</h3>
                <p className="text-[#94a3b8] text-sm mb-4">{zone.specs}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-black text-white">{zone.price}</span>
                    <span className="text-[#94a3b8] text-sm ml-1">บาท/ชม.</span>
                  </div>
                  <span className="text-xs text-[#94a3b8]">{zone.count} VMs</span>
                </div>
                <Link
                  href={`/booking`}
                  className={`mt-4 w-full block text-center py-2 rounded-lg text-sm font-semibold border ${zone.border} ${zone.color} hover:${zone.bg} transition-all`}
                >
                  เลือกแพ็กเกจนี้ →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">ทำไมต้อง Cloud Space?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-neon p-6 text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-[#94a3b8] text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl text-center card-neon p-12 border border-[#8b5cf6]/30 bg-gradient-to-br from-[#8b5cf6]/10 to-[#00d4ff]/5">
          {session ? (
            <>
              <h2 className="text-3xl font-black text-white mb-4">พร้อมใช้งานแล้วหรือยัง?</h2>
              <p className="text-[#94a3b8] mb-8">เลือกโปรโมชั่นที่ถูกใจและจองเครื่องได้เลย</p>
              <div className="flex justify-center gap-4">
                <Link href="#promotions" className="btn-cyber px-8 py-4 rounded-xl text-lg font-bold inline-block">
                  ดูโปรโมชั่นทั้งหมด
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black text-white mb-4">พร้อมใช้งานแล้วหรือยัง?</h2>
              <p className="text-[#94a3b8] mb-8">สมัครสมาชิกฟรี รับสิทธิ์ส่วนลดบิลแรกทันที</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register" className="btn-cyber px-8 py-4 rounded-xl text-lg font-bold inline-block">
                  สมัครสมาชิกฟรี
                </Link>
                <Link href="#promotions" className="px-8 py-4 rounded-xl text-lg font-bold border border-[#94a3b8]/30 text-[#94a3b8] hover:text-white hover:border-white/30 transition-all inline-block">
                  ดูโปรโมชั่น
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2035] px-4 py-8 text-center text-[#475569] text-sm">
        <p className="mb-1">© 2024 Cloud Space — Online Computer Rental System</p>
        <p>เปิดให้บริการตลอด 24 ชั่วโมง | ฝ่ายสนับสนุน: 02-XXX-XXXX</p>
      </footer>
    </div>
  );
}
