import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export async function GET() {
  try {
    const data = await readDb();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const currentDb = await readDb();
    const newDb = { ...currentDb, ...body };
    await writeDb(newDb);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await fs.unlink(DB_FILE).catch(() => {});
    const data = await readDb(); // Re-initializes with defaults
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
