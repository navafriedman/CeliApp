import { getPrisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    // Public endpoint - anyone can view any recipe by ID
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
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

    // Can edit own recipes OR toggle favorite on shared recipes
    const existing = await prisma.recipe.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { userId: null },
        ],
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // If it's a shared recipe (userId: null), only allow toggling favorite
    if (existing.userId === null && body.isFavorite !== undefined) {
      // For shared recipes, we can only toggle favorite
      const recipe = await prisma.recipe.update({
        where: { id },
        data: { isFavorite: body.isFavorite },
      });
      return NextResponse.json(recipe);
    }

    // For own recipes, allow full edit
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Cannot edit shared recipes' }, { status: 403 });
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        ingredients: body.ingredients,
        instructions: body.instructions,
        prepTime: body.prepTime,
        cookTime: body.cookTime,
        servings: body.servings,
        category: body.category,
        source: body.source,
        notes: body.notes,
        isFavorite: body.isFavorite,
      },
    });

    return NextResponse.json(recipe);
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

    // Can only delete own recipes
    const existing = await prisma.recipe.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Recipe not found or not yours' }, { status: 404 });
    }

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
