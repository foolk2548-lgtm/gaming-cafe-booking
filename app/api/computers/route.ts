import { NextRequest, NextResponse } from 'next/server';
import { getComputers, updateComputerStatus, deleteComputer } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get('zone');
    const status = searchParams.get('status');

    let computers = await getComputers();

    if (zone) computers = computers.filter((c) => c.zone === zone);
    if (status) computers = computers.filter((c) => c.status === status);

    return NextResponse.json({ computers });
  } catch {
    return NextResponse.json({ error: 'Failed to load computers' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, bookingId, maintenanceReason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updated = await updateComputerStatus(id, status, bookingId ?? null, maintenanceReason);
    if (!updated) return NextResponse.json({ error: 'Computer not found' }, { status: 404 });

    return NextResponse.json({ computer: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update computer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Prevent deleting computers that are in use
    const computers = await getComputers();
    const target = computers.find((c) => c.id === id);
    if (!target) return NextResponse.json({ error: 'Computer not found' }, { status: 404 });
    if (target.status === 'occupied' || target.status === 'provisioning') {
      return NextResponse.json({ error: 'ไม่สามารถลบเครื่องที่กำลังใช้งานอยู่ได้' }, { status: 400 });
    }

    const ok = await deleteComputer(id);
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete computer' }, { status: 500 });
  }
}
