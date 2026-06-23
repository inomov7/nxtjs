import { NextResponse } from 'next/server';
import { readDb, getSession, insertEntity, updateEntity, deleteEntity, deleteDb } from '@/lib/db';

async function checkAuth(request) {
  const sessionToken = request.cookies.get('klinika_session')?.value;
  if (!sessionToken) return null;
  const session = await getSession(sessionToken);
  return session;
}

export async function GET(request) {
  try {
    const session = await checkAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await readDb();

    // Strip passwords from staff list for security
    if (data.staff) {
      data.staff = data.staff.map(s => {
        const { password, ...rest } = s;
        return rest;
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await checkAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { table, action, data, id } = body;

    if (!table || !action) {
      return NextResponse.json({ error: 'Table and action are required' }, { status: 400 });
    }

    if (action === 'insert') {
      await insertEntity(table, data);
      if (table === 'patients') {
        const { checkAndSendTelegramPatients } = await import('@/lib/telegram');
        checkAndSendTelegramPatients().catch(err => console.error("Telegram check error:", err));
      }
    } else if (action === 'update') {
      await updateEntity(table, id, data);
    } else if (action === 'delete') {
      await deleteEntity(table, id);
    } else if (action === 'set_all') {
      if (table === 'clinicSettings') {
        await updateEntity('clinicSettings', null, data);
      } else if (table === 'suppliers') {
        const { writeDb } = await import('@/lib/db');
        await writeDb({ suppliers: data });
      } else if (table === 'finances') {
        const { writeDb } = await import('@/lib/db');
        await writeDb({ finances: data });
      } else {
        const { writeDb } = await import('@/lib/db');
        await writeDb({ [table]: data });
      }
    } else if (action === 'mark_all_read') {
      const { writeDb } = await import('@/lib/db');
      const allData = await readDb();
      const nextNotifs = allData.notifications.map(n => 
        n.roles?.includes(data.role) ? { ...n, read: true } : n
      );
      await writeDb({ notifications: nextNotifs });
    } else if (action === 'bulk_insert') {
      const { openDb, run } = await import('@/lib/db');
      const db = await openDb();
      try {
        await run(db, 'BEGIN TRANSACTION');
        const pk = table === 'finances' ? 'date' : 'id';
        for (const item of data) {
          const idVal = item[pk];
          await run(db, `INSERT OR REPLACE INTO ${table} (${pk}, value) VALUES (?, ?)`, [idVal, JSON.stringify(item)]);
        }
        await run(db, 'COMMIT');
      } catch (err) {
        await run(db, 'ROLLBACK').catch(() => {});
        throw err;
      } finally {
        db.close();
      }
    } else if (action === 'delete_pending_treatment_sms') {
      const { openDb, run, all } = await import('@/lib/db');
      const db = await openDb();
      try {
        const rows = await all(db, `SELECT id, value FROM smsQueue`);
        await run(db, 'BEGIN TRANSACTION');
        for (const row of rows) {
          const sms = JSON.parse(row.value);
          if (sms.treatmentId === id && sms.status === 'pending') {
            await run(db, `DELETE FROM smsQueue WHERE id = ?`, [row.id]);
          }
        }
        await run(db, 'COMMIT');
      } catch (err) {
        await run(db, 'ROLLBACK').catch(() => {});
        throw err;
      } finally {
        db.close();
      }
    } else if (action === 'retry_failed_sms') {
      const { openDb, run, all } = await import('@/lib/db');
      const db = await openDb();
      try {
        const rows = await all(db, `SELECT id, value FROM smsQueue`);
        await run(db, 'BEGIN TRANSACTION');
        for (const row of rows) {
          const sms = JSON.parse(row.value);
          if (sms.status === 'failed') {
            sms.status = 'pending';
            sms.error = null;
            await run(db, `UPDATE smsQueue SET value = ? WHERE id = ?`, [JSON.stringify(sms), row.id]);
          }
        }
        await run(db, 'COMMIT');
      } catch (err) {
        await run(db, 'ROLLBACK').catch(() => {});
        throw err;
      } finally {
        db.close();
      }
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await checkAuth(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteDb();
    const data = await readDb(); // Re-initializes with defaults
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
