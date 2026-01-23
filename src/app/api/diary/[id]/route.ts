import { getPrisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const entry = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entry = await prisma.foodEntry.update({
      where: { id },
      data: {
        mealType: body.mealType,
        description: body.description,
        ingredients: body.ingredients,
        isSafe: body.isSafe,
        notes: body.notes,
        reaction: body.reaction,
        rating: body.rating,
        date: body.date ? new Date(body.date) : undefined,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await prisma.foodEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
