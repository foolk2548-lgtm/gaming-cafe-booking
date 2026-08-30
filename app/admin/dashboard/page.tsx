'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';

type UserData = { id: string; username: string; email: string; role: string; displayName: string; phone?: string; createdAt: string };

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData> & { password?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin' && role !== 'manager') {
        router.push('/');
      }
    }
  }, [status, session, router]);

  const loadUsers = () => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => { setUsers(d.users); setLoading(false); });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const currentUserRole = (session?.user as any)?.role;

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const roleBadge: Record<string, string> = {
    customer: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    staff: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
    accounting: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    manager: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    admin: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  };
  const roleLabel: Record<string, string> = { customer: 'ลูกค้า', staff: 'พนักงาน', accounting: 'การเงิน', manager: 'ผู้จัดการ', admin: 'Admin' };

  const canEdit = (targetRole: string) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'manager') {
      return targetRole !== 'admin' && targetRole !== 'manager';
    }
    return false;
  };

  const handleEditClick = (u: UserData) => {
    setEditingUser(u);
    setEditForm({ displayName: u.displayName, email: u.email, phone: u.phone || '', role: u.role, password: '' });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, ...editForm }),
      });
      if (res.ok) {
        setEditingUser(null);
        loadUsers();
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Failed to update user');
    }
    setSaving(false);
  };

  if (status === 'loading' || loading) return <div className="min-h-screen"><Navbar /><div className="p-8 text-center text-muted-foreground">⏳ กำลังโหลด...</div></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">Management Dashboard</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleBadge[currentUserRole] || ''}`}>
            {currentUserRole?.toUpperCase()}
          </span>
        </div>

        {/* Role counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className={`card-clean border p-4 text-center ${roleBadge[role]?.replace('text-', 'border-')?.split(' ')[0] ?? 'border-border'}`}>
              <div className="text-2xl font-extrabold text-foreground">{count}</div>
              <div className="text-xs mt-1 text-muted-foreground">{roleLabel[role] ?? role}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full border mt-2 inline-block ${roleBadge[role]}`}>{role}</span>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="card-clean border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
            <h2 className="text-lg font-bold text-foreground">จัดการข้อมูลผู้ใช้</h2>
            <span className="text-sm text-muted-foreground">{users.length} คน</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['ชื่อ', 'Username', 'Email', 'Role', 'จัดการ'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{u.displayName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">@{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadge[u.role]}`}>
                        {roleLabel[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit(u.role) ? (
                        <button
                          onClick={() => handleEditClick(u)}
                          className="text-xs px-3 py-1.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors"
                        >
                          ✏️ แก้ไข
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">ไม่อนุญาต</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/staff/dashboard', label: '🖥️ Staff Dashboard', color: 'border-green-500/30 hover:bg-green-500/10 text-green-700 dark:text-green-500' },
            { href: '/admin/dashboard', label: '👑 Admin Dashboard', color: 'border-red-500/30 hover:bg-red-500/10 text-red-700 dark:text-red-500' },
          ].map((link) => (
            <a key={link.href} href={link.href} className={`card-clean border p-4 text-center font-medium transition-all ${link.color}`}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card-clean border border-border p-6 w-full max-w-md page-enter bg-card">
            <h3 className="text-lg font-bold text-foreground mb-5">✏️ แก้ไขข้อมูล: {editingUser.username}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ชื่อที่แสดง</label>
                <input
                  type="text"
                  value={editForm.displayName || ''}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="input-clean w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-clean w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input-clean w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              {currentUserRole === 'admin' && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">ระดับสิทธิ์ (Role)</label>
                  <select
                    value={editForm.role || 'customer'}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="input-clean w-full px-3 py-2 rounded-lg border text-sm bg-card text-foreground"
                  >
                    <option value="customer">ลูกค้า (Customer)</option>
                    <option value="staff">พนักงาน (Staff)</option>
                    <option value="accounting">การเงิน (Accounting)</option>
                    <option value="manager">ผู้จัดการ (Manager)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">เปลี่ยนรหัสผ่าน (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</label>
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="input-clean w-full px-3 py-2 rounded-lg border text-sm"
                  placeholder="รหัสผ่านใหม่..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
