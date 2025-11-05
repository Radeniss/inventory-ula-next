import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { message: 'Login berhasil', userId: user.id },
      { status: 200 }
    );

    response.cookies.set('auth_user_id', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
