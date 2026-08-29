import { NextRequest, NextResponse } from 'next/server';
import { getMemberships, getMembershipByUserId, createMembership, updateMembership, deleteMembership, updateUser } from '@/lib/db';
import type { MembershipTier } from '@/lib/types';

const TIER_DISCOUNTS: Record<MembershipTier, number> = {
  none: 0,
  member: 5,
  vip: 10,
  premium: 15,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const membership = await getMembershipByUserId(userId);
      return NextResponse.json({ membership: membership ?? null });
    }

    const memberships = await getMemberships();
    return NextResponse.json({ memberships });
  } catch {
    return NextResponse.json({ error: 'Failed to load memberships' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, tier } = body;

    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing userId or tier' }, { status: 400 });
    }

    const existing = await getMembershipByUserId(userId);
    if (existing) {
      // Upgrade or change tier in-place
      const updated = await updateMembership(existing.id, {
        tier: tier as MembershipTier,
        discountPercent: TIER_DISCOUNTS[tier as MembershipTier] ?? 5,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      return NextResponse.json({ membership: updated }, { status: 200 });
    }

    const membership = await createMembership({
      userId,
      tier: tier as MembershipTier,
      discountPercent: TIER_DISCOUNTS[tier as MembershipTier] ?? 5,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalSpent: 0,
      points: 0,
      bookingCount: 0,
    });

    // Update user to mark as new member
    await updateUser(userId, { membershipId: membership.id, isNewMember: true, firstBillUsed: false });

    return NextResponse.json({ membership }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tier } = body;

    if (!id || !tier) {
      return NextResponse.json({ error: 'Missing id or tier' }, { status: 400 });
    }

    const updated = await updateMembership(id, {
      tier: tier as MembershipTier,
      discountPercent: TIER_DISCOUNTS[tier as MembershipTier] ?? 5,
    });

    if (!updated) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    return NextResponse.json({ membership: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get('membershipId');
    const userId = searchParams.get('userId');

    if (!membershipId || !userId) {
      return NextResponse.json({ error: 'Missing membershipId or userId' }, { status: 400 });
    }

    const deleted = await deleteMembership(membershipId);
    if (!deleted) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });

    // Clear membershipId from user
    await updateUser(userId, { membershipId: null });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to cancel membership' }, { status: 500 });
  }
}
