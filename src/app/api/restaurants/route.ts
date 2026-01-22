import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    include: { dishes: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(restaurants);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: body.name,
      address: body.address || null,
      phone: body.phone || null,
      website: body.website || null,
      cuisineType: body.cuisineType || null,
      glutenFreeMenu: body.glutenFreeMenu || false,
      safetyRating: body.safetyRating || null,
      notes: body.notes || null,
      lastVisited: body.lastVisited ? new Date(body.lastVisited) : null,
    },
  });

  return NextResponse.json(restaurant, { status: 201 });
}
