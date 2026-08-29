import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Do not send password or passwordHash back to the client
  const { password, passwordHash, ...safeUser } = user;
  
  return NextResponse.json(safeUser);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { displayName, avatarUrl, password } = body;

    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    
    // In a real application, you would hash the password here using bcrypt
    // Since this is a demo using plaintext, we update both to keep it simple
    if (password) {
      updates.password = password;
      updates.passwordHash = password; // Demo fallback
    }

    const updatedUser = await updateUser(session.user.id, updates);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    const { password: _p, passwordHash: _ph, ...safeUser } = updatedUser;
    
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
