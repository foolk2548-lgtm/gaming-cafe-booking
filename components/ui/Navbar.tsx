'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ProfileSettingsModal from './ProfileSettingsModal';

const navLinks = [
  { href: '/', label: 'หน้าแรก', roles: ['all'] },
  { href: '/computers', label: 'รายการคอม', roles: ['all'] },
  { href: '/booking', label: 'จองคอม', roles: ['customer', 'staff', 'manager', 'admin'] },
  { href: '/my-bookings', label: 'การจองของฉัน', roles: ['customer'] },
  { href: '/membership', label: 'สมาชิก', roles: ['customer', 'manager', 'admin'] },
];

// Remove dashboardLinks as we use inline hierarchical logic now

const roleBadgeColors: Record<string, string> = {
  customer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  staff: 'bg-green-500/20 text-green-400 border-green-500/30',
  accounting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const roleLabels: Record<string, string> = {
  customer: 'ลูกค้า',
  staff: 'พนักงาน',
  accounting: 'การเงิน',
  manager: 'ผู้จัดการ',
  admin: 'Admin',
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // Also pass auth status down to the modal
  const { data: session, status } = useSession();

  const role = session?.user?.role ?? '';
  const visibleLinks = navLinks.filter(
    (link) => link.roles.includes('all') || link.roles.includes(role)
  );

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#1e2035] bg-[#05050f]/90 backdrop-blur-xl">
      {/* Glow line on top */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent opacity-60" />

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#00d4ff] flex items-center justify-center text-white font-black text-sm">
                GZ
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#00d4ff] blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="font-black text-xl tracking-wider text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              CLOUD<span className="text-[#00d4ff]">SPACE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#8b5cf6]/20 text-[#00d4ff] border border-[#8b5cf6]/40'
                      : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {['staff', 'accounting', 'manager', 'admin'].includes(role) && (
              <div className="relative group h-full flex items-center">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname.includes('dashboard')
                      ? 'bg-[#8b5cf6]/20 text-[#00d4ff] border border-[#8b5cf6]/40'
                      : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  ระบบจัดการ ▾
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1e2035] border border-[#3b3e66] rounded-xl shadow-lg py-1 z-50 opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible translate-y-2 group-hover:translate-y-0">
                  {role === 'staff' && (
                    <Link href="/staff/dashboard" className="block px-4 py-2 text-sm text-[#94a3b8] hover:text-[#00d4ff] hover:bg-[#3b3e66]/50">
                      แดชบอร์ดพนักงาน
                    </Link>
                  )}
                  {['accounting', 'admin'].includes(role) && (
                    <Link href="/accounting/dashboard" className="block px-4 py-2 text-sm text-[#94a3b8] hover:text-[#eab308] hover:bg-[#3b3e66]/50">
                      แดชบอร์ดการเงิน
                    </Link>
                  )}
                  {['manager', 'admin'].includes(role) && (
                    <Link href="/manager/dashboard" className="block px-4 py-2 text-sm text-[#94a3b8] hover:text-[#a855f7] hover:bg-[#3b3e66]/50">
                      แดชบอร์ดผู้จัดการ
                    </Link>
                  )}
                  {['manager', 'admin'].includes(role) && (
                    <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#3b3e66]/50">
                      จัดการผู้ใช้งาน
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {role && (
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${roleBadgeColors[role]}`}>
                    {roleLabels[role]}
                  </span>
                )}
                <span className="text-sm text-[#94a3b8]">{session.user?.name}</span>
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="p-2 text-[#94a3b8] hover:text-[#00d4ff] transition-colors rounded-lg hover:bg-[#00d4ff]/10"
                    title="ตั้งค่าบัญชีผู้ใช้"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  
                  {/* Desktop Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1e2035] border border-[#3b3e66] rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => { setProfileModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-[#94a3b8] hover:text-white hover:bg-[#3b3e66]/50"
                      >
                        แก้ไขข้อมูลส่วนตัว
                      </button>
                      <button
                        onClick={() => { setProfileModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-[#94a3b8] hover:text-white hover:bg-[#3b3e66]/50"
                      >
                        เปลี่ยนรหัสผ่าน
                      </button>
                      <div className="h-px bg-[#3b3e66] my-1"></div>
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full text-left px-4 py-2 text-sm text-[#ec4899] hover:bg-[#ec4899]/10"
                      >
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-white transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="btn-cyber px-4 py-2 text-sm rounded-lg font-semibold"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-[#1e2035] pt-4">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-[#8b5cf6]/20 text-[#00d4ff]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {role === 'staff' && (
              <Link href="/staff/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-[#00d4ff] hover:bg-white/5">
                แดชบอร์ดพนักงาน
              </Link>
            )}
            {['accounting', 'admin'].includes(role) && (
              <Link href="/accounting/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-[#eab308] hover:bg-white/5">
                แดชบอร์ดการเงิน
              </Link>
            )}
            {['manager', 'admin'].includes(role) && (
              <Link href="/manager/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-[#a855f7] hover:bg-white/5">
                แดชบอร์ดผู้จัดการ
              </Link>
            )}
            {['manager', 'admin'].includes(role) && (
              <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-[#ef4444] hover:bg-white/5">
                จัดการผู้ใช้งาน
              </Link>
            )}
            <div className="pt-2 border-t border-[#1e2035] space-y-2">
              {session ? (
                <>
                  <button
                    onClick={() => { setProfileModalOpen(true); setMobileOpen(false); }}
                    className="w-full text-left block px-4 py-3 text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-lg"
                  >
                    ตั้งค่าบัญชีผู้ใช้
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full text-left px-4 py-3 text-sm text-[#ec4899] hover:bg-[#ec4899]/10 rounded-lg"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-[#94a3b8]">เข้าสู่ระบบ</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-white bg-gradient-to-r from-[#8b5cf6] to-[#00d4ff] rounded-lg font-semibold text-center">สมัครสมาชิก</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>

    <ProfileSettingsModal 
      isOpen={profileModalOpen} 
      onClose={() => setProfileModalOpen(false)} 
      status={status as "authenticated" | "unauthenticated" | "loading"}
    />
  </>
  );
}
