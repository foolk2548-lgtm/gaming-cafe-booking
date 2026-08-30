'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Settings, Sun, Moon, LogOut, User, Key } from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal';

const navLinks = [
  { href: '/', label: 'หน้าแรก', roles: ['all'] },
  { href: '/computers', label: 'รายการคอม', roles: ['customer', 'guest'] },
  { href: '/booking', label: 'จองคอม', roles: ['customer'] },
  { href: '/my-bookings', label: 'การจองของฉัน', roles: ['customer'] },
  { href: '/membership', label: 'สมาชิก', roles: ['customer'] },
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
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  // Also pass auth status down to the modal
  const { data: session, status } = useSession();

  const role = session?.user?.role ?? 'guest';
  const visibleLinks = navLinks.filter(
    (link) => link.roles.includes('all') || link.roles.includes(role)
  );

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                GZ
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              CLOUD<span className="text-primary-500">SPACE</span>
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
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  ระบบจัดการ ▾
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50 opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible translate-y-2 group-hover:translate-y-0">
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
                <span className="text-sm font-medium text-foreground">{session.user?.name}</span>
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                    title="ตั้งค่าบัญชีผู้ใช้"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  {/* Desktop Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 mb-1 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">โหมดหน้าจอ</p>
                        {mounted && (
                          <div className="flex items-center justify-between mt-2 bg-muted p-1 rounded-lg">
                            <button
                              onClick={() => setTheme('light')}
                              className={`flex-1 flex justify-center py-1.5 rounded-md text-xs transition-all ${theme === 'light' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <Sun className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTheme('dark')}
                              className={`flex-1 flex justify-center py-1.5 rounded-md text-xs transition-all ${theme === 'dark' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <Moon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => { setProfileModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="w-4 h-4" /> แก้ไขข้อมูลส่วนตัว
                      </button>
                      <button
                        onClick={() => { setProfileModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Key className="w-4 h-4" /> เปลี่ยนรหัสผ่าน
                      </button>
                      <div className="h-px bg-border my-1"></div>
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> ออกจากระบบ
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
          <div className="md:hidden pb-4 space-y-1 border-t border-border pt-4">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {role === 'staff' && (
              <Link href="/staff/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted">
                แดชบอร์ดพนักงาน
              </Link>
            )}
            {['accounting', 'admin'].includes(role) && (
              <Link href="/accounting/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-muted">
                แดชบอร์ดการเงิน
              </Link>
            )}
            {['manager', 'admin'].includes(role) && (
              <Link href="/manager/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:bg-muted">
                แดชบอร์ดผู้จัดการ
              </Link>
            )}
            {['manager', 'admin'].includes(role) && (
              <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-muted">
                จัดการผู้ใช้งาน
              </Link>
            )}
            <div className="pt-2 border-t border-border space-y-2">
              {session ? (
                <>
                  <button
                    onClick={() => { setProfileModalOpen(true); setMobileOpen(false); }}
                    className="w-full text-left block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                  >
                    ตั้งค่าบัญชีผู้ใช้
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground">เข้าสู่ระบบ</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm btn-primary rounded-lg font-semibold text-center">สมัครสมาชิก</Link>
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
