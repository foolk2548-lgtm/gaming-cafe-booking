import { NextRequest, NextResponse } from 'next/server';
import {
  getBookings,
  createBooking,
  updateBooking,
  getBookingsByUserId,
  updateComputerStatus,
  getUserById,
  getMembershipByUserId,
  updateMembership,
  createReceipt,
  updateUser,
} from '@/lib/db';
import { calculatePromotions } from '@/lib/promotions';
import type { MembershipTier } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let bookings = userId
      ? await getBookingsByUserId(userId)
      : await getBookings();

    if (status) bookings = bookings.filter((b) => b.status === status);

    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, computerId, startTime, endTime, pricePerHour, paymentSlip } = body;

    if (!userId || !computerId || !startTime || !endTime || !pricePerHour) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const basePrice = durationHours * pricePerHour;

    // Get user info for promotions
    const user = await getUserById(userId);
    const membership = user?.membershipId ? await getMembershipByUserId(userId) : null;
    const membershipTier: MembershipTier = (membership?.tier as MembershipTier) ?? 'none';

    // Calculate promotions
    const promoResult = calculatePromotions({
      startTime: start,
      endTime: end,
      durationHours,
      basePrice,
      membershipTier,
      isNewMember: user?.isNewMember ?? false,
      firstBillUsed: user?.firstBillUsed ?? false,
    });

    // Create booking with pending status (staff will provision VM)
    const booking = await createBooking({
      userId,
      computerId,
      startTime,
      endTime,
      durationHours,
      basePrice,
      discountsApplied: promoResult.discountsApplied,
      totalDiscount: promoResult.totalDiscount,
      finalPrice: promoResult.finalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      note: body.note || '',
      connectionDetails: null,
      assignedVmId: null,
      paymentSlip: paymentSlip || undefined,
    });

    // Mark computer as occupied
    await updateComputerStatus(computerId, 'occupied', booking.id);

    return NextResponse.json({ booking }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, staffId, paymentMethod, connectionDetails, rejectionReason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (connectionDetails !== undefined) updates.connectionDetails = connectionDetails;
    if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;

    const booking = await updateBooking(id, updates as Parameters<typeof updateBooking>[1]);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // When rejected → free the computer
    if (status === 'rejected') {
      await updateComputerStatus(booking.computerId, 'available', null);
    }

    // When completing a booking → free the computer + create receipt
    if (status === 'completed') {
      await updateComputerStatus(booking.computerId, 'available', null);

      // Update membership stats
      const membership = await getMembershipByUserId(booking.userId);
      if (membership) {
        await updateMembership(membership.id, {
          totalSpent: membership.totalSpent + booking.finalPrice,
          points: membership.points + Math.floor(booking.finalPrice / 10),
          bookingCount: membership.bookingCount + 1,
        });
      }

      // Mark first bill as used for new members
      const user = await getUserById(booking.userId);
      if (user?.isNewMember && !user.firstBillUsed) {
        const hasNewMemberDiscount = booking.discountsApplied.some(
          (d) => d.type === 'new_member_bill'
        );
        if (hasNewMemberDiscount) {
          await updateUser(booking.userId, { firstBillUsed: true });
        }
      }

      // Create receipt
      const computer = { name: `PC-${booking.computerId}`, zone: 'A' };
      await createReceipt({
        bookingId: booking.id,
        userId: booking.userId,
        computerId: booking.computerId,
        computerName: computer.name,
        zone: 'A',
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationHours: booking.durationHours,
        basePrice: booking.basePrice,
        discountsApplied: booking.discountsApplied,
        totalDiscount: booking.totalDiscount,
        finalPrice: booking.finalPrice,
        paidAt: new Date().toISOString(),
        paymentMethod: paymentMethod || 'cash',
        staffId: staffId || undefined,
      });
    }

    // When cancelling → free the computer
    if (status === 'cancelled') {
      await updateComputerStatus(booking.computerId, 'available', null);
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
