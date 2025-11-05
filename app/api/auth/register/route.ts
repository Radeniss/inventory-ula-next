import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, dan password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const user = await createUser(username, email, password);

    return NextResponse.json(
      { message: 'Registrasi berhasil', userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username atau email sudah terdaftar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    );
  }
}