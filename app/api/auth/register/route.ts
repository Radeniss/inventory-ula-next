import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const user = await createUser(supabase, username, email, password);

    return NextResponse.json(
      { message: 'Registrasi berhasil', userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle specific auth errors
    if (error.message.includes('User already registered')) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }
    if (error.message.includes('konfirmasi email')) {
      return NextResponse.json(
        { message: 'Registrasi berhasil. Silakan cek email Anda untuk konfirmasi.' },
        { status: 200 }
      );
    }
    // Handle custom table errors
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Username sudah terdaftar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    );
  }
}
