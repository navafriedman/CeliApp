import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const dish = await prisma.dish.create({
    data: {
      name: body.name,
      description: body.description || null,
      isSafe: body.isSafe ?? true,
      notes: body.notes || null,
      rating: body.rating || null,
      restaurantId: id,
    },
  });

  return NextResponse.json(dish, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  await prisma.dish.delete({
    where: { id: body.dishId },
  });

  return NextResponse.json({ success: true });
}
