// lib/db.ts
// JSON File-based Database helpers using Node.js fs/promises

import fs from 'fs/promises';
import path from 'path';
import type { User, Computer, Booking, Membership, Promotion, Receipt } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const data = await readJson<{ users: User[] }>('users.json');
  return data.users;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.email === email);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username === username);
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const data = await readJson<{ users: User[] }>('users.json');
  const newUser: User = { ...user, id: generateId('u') };
  data.users.push(newUser);
  await writeJson('users.json', data);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const data = await readJson<{ users: User[] }>('users.json');
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  data.users[idx] = { ...data.users[idx], ...updates };
  await writeJson('users.json', data);
  return data.users[idx];
}

// ─── Computers ────────────────────────────────────────────────────────────────

export async function getComputers(): Promise<Computer[]> {
  const data = await readJson<{ computers: Computer[] }>('computers.json');
  return data.computers;
}

export async function getComputerById(id: string): Promise<Computer | undefined> {
  const computers = await getComputers();
  return computers.find((c) => c.id === id);
}

export async function updateComputerStatus(
  id: string,
  status: Computer['status'],
  bookingId: string | null = null
): Promise<Computer | null> {
  const data = await readJson<{ computers: Computer[] }>('computers.json');
  const idx = data.computers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  data.computers[idx].status = status;
  data.computers[idx].currentBookingId = bookingId;
  await writeJson('computers.json', data);
  return data.computers[idx];
}

export async function deleteComputer(id: string): Promise<boolean> {
  const data = await readJson<{ computers: Computer[] }>('computers.json');
  const before = data.computers.length;
  data.computers = data.computers.filter((c) => c.id !== id);
  if (data.computers.length === before) return false;
  await writeJson('computers.json', data);
  return true;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function getBookings(): Promise<Booking[]> {
  const data = await readJson<{ bookings: Booking[] }>('bookings.json');
  return data.bookings;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  const bookings = await getBookings();
  return bookings.find((b) => b.id === id);
}

export async function getBookingsByUserId(userId: string): Promise<Booking[]> {
  const bookings = await getBookings();
  return bookings.filter((b) => b.userId === userId);
}

export async function createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
  const data = await readJson<{ bookings: Booking[] }>('bookings.json');
  const newBooking: Booking = { ...booking, id: generateId('b') };
  data.bookings.push(newBooking);
  await writeJson('bookings.json', data);
  return newBooking;
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  const data = await readJson<{ bookings: Booking[] }>('bookings.json');
  const idx = data.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  data.bookings[idx] = { ...data.bookings[idx], ...updates };
  await writeJson('bookings.json', data);
  return data.bookings[idx];
}

// ─── Memberships ─────────────────────────────────────────────────────────────

export async function getMemberships(): Promise<Membership[]> {
  const data = await readJson<{ memberships: Membership[]; tiers: unknown[] }>('memberships.json');
  return data.memberships;
}

export async function getMembershipByUserId(userId: string): Promise<Membership | undefined> {
  const memberships = await getMemberships();
  return memberships.find((m) => m.userId === userId);
}

export async function getMembershipById(id: string): Promise<Membership | undefined> {
  const memberships = await getMemberships();
  return memberships.find((m) => m.id === id);
}

export async function createMembership(membership: Omit<Membership, 'id'>): Promise<Membership> {
  const data = await readJson<{ memberships: Membership[]; tiers: unknown[] }>('memberships.json');
  const newMembership: Membership = { ...membership, id: generateId('m') };
  data.memberships.push(newMembership);
  await writeJson('memberships.json', data);
  return newMembership;
}

export async function updateMembership(id: string, updates: Partial<Membership>): Promise<Membership | null> {
  const data = await readJson<{ memberships: Membership[]; tiers: unknown[] }>('memberships.json');
  const idx = data.memberships.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  data.memberships[idx] = { ...data.memberships[idx], ...updates };
  await writeJson('memberships.json', data);
  return data.memberships[idx];
}

export async function deleteMembership(id: string): Promise<boolean> {
  const data = await readJson<{ memberships: Membership[]; tiers: unknown[] }>('memberships.json');
  const before = data.memberships.length;
  data.memberships = data.memberships.filter((m) => m.id !== id);
  if (data.memberships.length === before) return false;
  await writeJson('memberships.json', data);
  return true;
}

// ─── Promotions ──────────────────────────────────────────────────────────────

export async function getPromotions(): Promise<Promotion[]> {
  const data = await readJson<{ promotions: Promotion[] }>('promotions.json');
  return data.promotions.filter((p) => p.isActive);
}

// ─── Receipts ────────────────────────────────────────────────────────────────

export async function getReceipts(): Promise<Receipt[]> {
  const data = await readJson<{ receipts: Receipt[] }>('receipts.json');
  return data.receipts;
}

export async function getReceiptById(id: string): Promise<Receipt | undefined> {
  const receipts = await getReceipts();
  return receipts.find((r) => r.id === id);
}

export async function getReceiptsByUserId(userId: string): Promise<Receipt[]> {
  const receipts = await getReceipts();
  return receipts.filter((r) => r.userId === userId);
}

export async function createReceipt(receipt: Omit<Receipt, 'id'>): Promise<Receipt> {
  const data = await readJson<{ receipts: Receipt[] }>('receipts.json');
  const newReceipt: Receipt = { ...receipt, id: generateId('r') };
  data.receipts.push(newReceipt);
  await writeJson('receipts.json', data);
  return newReceipt;
}
