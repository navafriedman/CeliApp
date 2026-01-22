import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  const items = await prisma.glutenInfo.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(category && { category }),
      ...(status && { status }),
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.glutenInfo.create({
    data: {
      name: body.name,
      category: body.category,
      status: body.status,
      description: body.description || null,
      tips: body.tips || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
