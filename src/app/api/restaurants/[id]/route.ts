import { getPrisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { dishes: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const body = await request.json();

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        website: body.website,
        cuisineType: body.cuisineType,
        glutenFreeMenu: body.glutenFreeMenu,
        safetyRating: body.safetyRating,
        notes: body.notes,
        lastVisited: body.lastVisited ? new Date(body.lastVisited) : null,
      },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    await prisma.restaurant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
