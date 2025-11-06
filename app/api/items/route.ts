import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

type ItemRow = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;            // kirim sebagai number/string dari server
  description?: string | null;
  category?: string | null;
  createdAt?: string;       // kirim ISO string dari server
  updatedAt?: string;
};

async function getUserId(cookieStore: ReturnType<typeof cookies>): Promise<number | null> {
  const authCookie = cookieStore.get('auth_user_id');
  return authCookie ? Number(authCookie.value) : null;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const userId = await getUserId(cookieStore);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const offset = (page - 1) * limit;

    const where: any = {
      userId: userId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const total = await prisma.item.count({ where });

    const safeItems: ItemRow[] = items.map(i => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      price: Number(i.price),                 // Decimal -> number
      description: i.description ?? null,
      category: i.category ?? null,
      createdAt: i.createdAt?.toISOString(),
      updatedAt: i.updatedAt?.toISOString(),
    }));

    return NextResponse.json({
      items: safeItems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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

    const item = await prisma.item.create({
      data: {
        name,
        sku,
        quantity: numQuantity,
        price: numPrice,
        description: description || null,
        category: category || null,
        userId: userId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU sudah ada' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal menambahkan item' },
      { status: 500 }
    );
  }
}