import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function getUser(cookieStore: ReturnType<typeof cookies>) {
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const user = await getUser(cookieStore);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('items')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      items: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal mengambil data items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const user = await getUser(cookieStore);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, quantity, price, description, category } = body;

    if (!name || !sku || quantity === undefined || !price) {
      return NextResponse.json(
        { error: 'Field wajib harus diisi (name, sku, quantity, price)' },
        { status: 400 }
      );
    }

    const numQuantity = Number(quantity);
    const numPrice = Number(price);

    if (isNaN(numQuantity) || numQuantity < 0) {
      return NextResponse.json(
        { error: 'Quantity harus angka dan tidak boleh negatif' },
        { status: 400 }
      );
    }

    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json(
        { error: 'Price harus angka dan tidak boleh negatif' },
        { status: 400 }
      );
    }

    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data, error } = await supabase
      .from('items')
      .insert([{
        name,
        sku,
        quantity: numQuantity,
        price: numPrice,
        description: description || null,
        category: category || null,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'SKU sudah ada' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal menambahkan item' },
      { status: 500 }
    );
  }
}
