// lib/types.ts

export type UserRole = 'customer' | 'staff' | 'accounting' | 'manager' | 'admin';
export type MembershipTier = 'none' | 'member' | 'vip' | 'premium';
export type ComputerStatus = 'available' | 'occupied' | 'maintenance' | 'provisioning' | 'maintenance-reported';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';
export type ComputerZone = 'A' | 'B' | 'VIP';

export interface RemoteInfo {
  ip: string;
  username: string;
  password: string;
  parsecLink?: string;
  moonlightHost?: string;
  notes?: string;
}
export type PromotionType = 'time_based' | 'duration_based' | 'member_based' | 'happy_hour' | 'new_member_bill';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  password?: string; // plaintext for demo only
  role: UserRole;
  membershipId: string | null;
  createdAt: string;
  isNewMember: boolean;
  firstBillUsed: boolean;
  displayName: string;
  phone: string;
  avatarUrl?: string;
}

export interface ComputerSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  headset: string;
  extras?: string;
}

export interface Computer {
  id: string;
  name: string;
  zone: ComputerZone;
  pricePerHour: number;
  specs: ComputerSpecs;
  status: ComputerStatus;
  currentBookingId: string | null;
  remoteInfo: RemoteInfo | null;
  imgUrl?: string;
  maintenanceReason?: string;
}

export interface DiscountApplied {
  type: PromotionType | string;
  label: string;
  percent?: number;
  amount: number;
}

export interface Booking {
  id: string;
  userId: string;
  computerId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  basePrice: number;
  discountsApplied: DiscountApplied[];
  totalDiscount: number;
  finalPrice: number;
  status: BookingStatus;
  createdAt: string;
  note: string;
  connectionDetails: RemoteInfo | null;
  assignedVmId: string | null;
  paymentSlip?: string;
  rejectionReason?: string;
}

export interface Membership {
  id: string;
  userId: string;
  tier: MembershipTier;
  discountPercent: number;
  startDate: string;
  expiryDate: string;
  totalSpent: number;
  points: number;
  bookingCount: number;
}

export interface MembershipTierConfig {
  tier: MembershipTier;
  label: string;
  discountPercent: number;
  color: string;
  minSpend: number;
  price: number;
  perks: string[];
}

export interface Promotion {
  id: string;
  type: PromotionType;
  label: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  condition: Record<string, unknown>;
  isActive: boolean;
}

export interface Receipt {
  id: string;
  bookingId: string;
  userId: string;
  computerId: string;
  computerName: string;
  zone: ComputerZone;
  startTime: string;
  endTime: string;
  durationHours: number;
  basePrice: number;
  discountsApplied: DiscountApplied[];
  totalDiscount: number;
  finalPrice: number;
  paidAt: string;
  paymentMethod: string;
  staffId?: string;
}

// Promotion calculation input
export interface PromotionInput {
  startTime: Date;
  endTime: Date;
  durationHours: number;
  basePrice: number;
  membershipTier: MembershipTier;
  isNewMember: boolean;
  firstBillUsed: boolean;
}

export interface PromotionResult {
  discountsApplied: DiscountApplied[];
  totalDiscount: number;
  finalPrice: number;
}
