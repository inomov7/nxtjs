import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';

export async function POST(request) {
  try {
    const tokenCookie = request.cookies.get('klinika_session');
    if (tokenCookie) {
      await deleteSession(tokenCookie.value);
    }

    const response = NextResponse.json({ success: true });
    // Clear cookie
    response.cookies.set('klinika_session', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
