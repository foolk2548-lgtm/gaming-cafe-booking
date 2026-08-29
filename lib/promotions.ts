// lib/promotions.ts
// Promotion calculation engine — applies all eligible discounts

import type { PromotionInput, PromotionResult, DiscountApplied, MembershipTier } from './types';

const MEMBER_DISCOUNTS: Record<MembershipTier, number> = {
  none: 0,
  member: 5,
  vip: 10,
  premium: 15,
};

function isWeekday(date: Date): boolean {
  const day = date.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  return day >= 1 && day <= 5;
}

function isTimeInRange(date: Date, startHour: number, endHour: number): boolean {
  const hour = date.getHours();
  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour;
  } else {
    // crosses midnight (e.g. 22:00 - 02:00)
    return hour >= startHour || hour < endHour;
  }
}

/**
 * Calculate all applicable promotions and return discount breakdown.
 * Discounts are applied COMPOUND (each on remaining price), not additive.
 */
export function calculatePromotions(input: PromotionInput): PromotionResult {
  const {
    startTime,
    durationHours,
    basePrice,
    membershipTier,
    isNewMember,
    firstBillUsed,
  } = input;

  const discountsApplied: DiscountApplied[] = [];
  let remainingPrice = basePrice;

  // ─── 1. Time-based: Mon-Fri 09:00-15:00 → 20% ────────────────────────────
  if (isWeekday(startTime) && isTimeInRange(startTime, 9, 15)) {
    const amount = remainingPrice * 0.2;
    remainingPrice -= amount;
    discountsApplied.push({
      type: 'time_based',
      label: 'ช่วงเวลากลางวัน (จ.-ศ. 09:00-15:00)',
      percent: 20,
      amount: Math.round(amount * 100) / 100,
    });
  }

  // ─── 2. Duration-based: ≥ 4 hours → 15% ─────────────────────────────────
  if (durationHours >= 4) {
    const amount = remainingPrice * 0.15;
    remainingPrice -= amount;
    discountsApplied.push({
      type: 'duration_based',
      label: `เล่นต่อเนื่อง ${durationHours} ชม. (ลด 15%)`,
      percent: 15,
      amount: Math.round(amount * 100) / 100,
    });
  }

  // ─── 3. Happy Hour: 22:00-02:00 → 20% ────────────────────────────────────
  if (isTimeInRange(startTime, 22, 2)) {
    const amount = remainingPrice * 0.2;
    remainingPrice -= amount;
    discountsApplied.push({
      type: 'happy_hour',
      label: 'Happy Hour (22:00 - 02:00 น.)',
      percent: 20,
      amount: Math.round(amount * 100) / 100,
    });
  }

  // ─── 4. Member-based discount ────────────────────────────────────────────
  const memberDiscount = MEMBER_DISCOUNTS[membershipTier] ?? 0;
  if (memberDiscount > 0) {
    const tierLabels: Record<MembershipTier, string> = {
      none: '',
      member: 'Member',
      vip: 'VIP',
      premium: 'Premium',
    };
    const amount = remainingPrice * (memberDiscount / 100);
    remainingPrice -= amount;
    discountsApplied.push({
      type: 'member_based',
      label: `ส่วนลดสมาชิก ${tierLabels[membershipTier]} (${memberDiscount}%)`,
      percent: memberDiscount,
      amount: Math.round(amount * 100) / 100,
    });
  }

  // ─── 5. New Member First Bill: ≥ 600 → flat -100 ─────────────────────────
  if (isNewMember && !firstBillUsed && remainingPrice >= 600) {
    remainingPrice -= 100;
    discountsApplied.push({
      type: 'new_member_bill',
      label: 'ส่วนลดสมาชิกใหม่ บิลแรก (ลด 100 บาท)',
      amount: 100,
    });
  }

  const totalDiscount = basePrice - remainingPrice;

  return {
    discountsApplied,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    finalPrice: Math.max(0, Math.round(remainingPrice * 100) / 100),
  };
}

/**
 * Preview promotions for display in booking form
 */
export function getApplicablePromotionLabels(input: PromotionInput): string[] {
  const result = calculatePromotions(input);
  return result.discountsApplied.map((d) => d.label);
}
