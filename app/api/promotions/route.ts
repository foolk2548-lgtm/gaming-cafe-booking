import { NextRequest, NextResponse } from 'next/server';
import { calculatePromotions } from '@/lib/promotions';
import type { MembershipTier } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      startTime,
      endTime,
      pricePerHour,
      membershipTier = 'none',
      isNewMember = false,
      firstBillUsed = false,
    } = body;

    if (!startTime || !endTime || !pricePerHour) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const basePrice = durationHours * pricePerHour;

    const result = calculatePromotions({
      startTime: start,
      endTime: end,
      durationHours,
      basePrice,
      membershipTier: membershipTier as MembershipTier,
      isNewMember,
      firstBillUsed,
    });

    return NextResponse.json({ basePrice, durationHours, ...result });
  } catch {
    return NextResponse.json({ error: 'Failed to calculate promotion' }, { status: 500 });
  }
}
