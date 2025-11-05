import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

async function getUserId(cookieStore: ReturnType<typeof cookies>): Promise<number | null> {
  const authCookie = cookieStore.get('auth_user_id');
  return authCookie ? Number(authCookie.value) : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await getUserId(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.item.findUnique({
      where: {
        id: Number(params.id),
        userId: userId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal mengambil data item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await getUserId(cookieStore);

    if (!userId) {
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

    const item = await prisma.item.update({
      where: {
        id: Number(params.id),
        userId: userId,
      },
      data: {
        name,
        sku,
        quantity: numQuantity,
        price: numPrice,
        description: description || null,
        category: category || null,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU sudah ada' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item tidak ditemukan' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal memperbarui item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await getUserId(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.item.delete({
      where: {
        id: Number(params.id),
        userId: userId,
      },
    });

    return NextResponse.json({ message: 'Item berhasil dihapus' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item tidak ditemukan' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal menghapus item' },
      { status: 500 }
    );
  }
}