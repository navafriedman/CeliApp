import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const entries = await prisma.foodEntry.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Diary GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const entry = await prisma.foodEntry.create({
    data: {
      mealType: body.mealType,
      description: body.description,
      ingredients: body.ingredients || '',
      isSafe: body.isSafe ?? true,
      notes: body.notes || null,
      reaction: body.reaction || null,
      rating: body.rating || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
