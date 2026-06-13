import { NextResponse } from 'next/server';
import { readDb, updateEntity } from '@/lib/db';

// GET: SMS Server pulls pending messages
export async function GET(request) {
  try {
    try {
      const { updateEntity } = await import('@/lib/db');
      await updateEntity('clinicSettings', null, { lastSmsPollTime: new Date().toISOString() });
    } catch (dbErr) { /* ignore db lock/read-only on GET */ }

    const data = await readDb();
    const smsQueue = data.smsQueue || [];

    // Filter pending messages scheduled for now or in the past
    const now = new Date();
    const pendingSms = smsQueue
      .filter(sms => {
        if (sms.status !== 'pending') return false;
        if (!sms.scheduledFor) return true; // immediate if no schedule date
        return new Date(sms.scheduledFor) <= now;
      })
      .map(sms => ({
        id: sms.id,
        phone: sms.phone,
        message: sms.message,
        sim: sms.sim !== undefined ? sms.sim : 0
      }));

    return NextResponse.json(pendingSms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: SMS Server reports back delivery status (Callback)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Support both single update object or list of updates
    const updates = Array.isArray(body) ? body : [body];
    const results = [];

    for (const update of updates) {
      const { id, status, error } = update;
      if (!id) continue;

      let normalizedStatus = 'sent';
      if (status === 'failed' || status === 'error' || error) {
        normalizedStatus = 'failed';
      }

      const updateData = {
        status: normalizedStatus,
        sentAt: new Date().toISOString()
      };

      if (error) {
        updateData.error = error;
      }

      try {
        await updateEntity('smsQueue', id, updateData);
        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
