import { NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: "Foydalanuvchi nomi yoki parol noto'g'ri" }, { status: 401 });
    }

    // Create a session in DB
    const token = await createSession(user.id, user.role);

    // Prepare client user payload (strip password)
    const clientUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      loginTime: new Date().toISOString()
    };

    // Set HttpOnly session cookie
    const response = NextResponse.json({ success: true, user: clientUser });
    response.cookies.set('klinika_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
