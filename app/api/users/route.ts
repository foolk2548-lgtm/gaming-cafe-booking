import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUsers, createUser, getUserById, updateUser } from '@/lib/db';

export async function GET() {
  try {
    const users = await getUsers();
    // Remove password fields before returning
    const safeUsers = users.map(({ password: _pw, passwordHash: _ph, ...u }) => u);
    return NextResponse.json({ users: safeUsers });
  } catch {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, displayName, phone } = body;

    if (!username || !email || !password || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await getUsers();
    if (existing.find((u) => u.email === email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    if (existing.find((u) => u.username === username)) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const newUser = await createUser({
      username,
      email,
      password,
      passwordHash: password, // demo only
      role: 'customer',
      membershipId: null,
      createdAt: new Date().toISOString(),
      isNewMember: false,
      firstBillUsed: false,
      displayName,
      phone: phone || '',
    });

    const { password: _pw, passwordHash: _ph, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, displayName, email, phone, role: targetRole, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role-based restrictions
    if (role === 'manager') {
      // Manager cannot edit admin or manager
      if (targetUser.role === 'admin' || targetUser.role === 'manager') {
        return NextResponse.json({ error: 'Forbidden: Cannot edit users with equal or higher roles' }, { status: 403 });
      }
      // Manager cannot assign admin or manager roles
      if (targetRole && (targetRole === 'admin' || targetRole === 'manager')) {
        return NextResponse.json({ error: 'Forbidden: Cannot assign higher roles' }, { status: 403 });
      }
    }

    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (targetRole !== undefined) updates.role = targetRole;
    if (password) {
      updates.password = password; // Should hash in production
      updates.passwordHash = password;
    }

    const updatedUser = await updateUser(id, updates);
    if (!updatedUser) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    const { password: _pw, passwordHash: _ph, ...safeUser } = updatedUser;
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
