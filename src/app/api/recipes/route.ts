import { getPrisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const prisma = await getPrisma();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const favorites = searchParams.get('favorites') === 'true';

    // Recipes hidden by this user (per-user soft-delete of seeded recipes)
    const hidden = userId
      ? await prisma.hiddenRecipe.findMany({
          where: { userId },
          select: { recipeId: true },
        })
      : [];
    const hiddenIds = hidden.map((h) => h.recipeId);

    // Show user's recipes + shared recipes (userId is null), excluding hidden
    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [
          { userId: userId || undefined },
          { userId: null },
        ],
        ...(category && { category }),
        ...(favorites && { isFavorite: true }),
        ...(hiddenIds.length > 0 && { id: { notIn: hiddenIds } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await request.json();

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: body.title,
        description: body.description || null,
        ingredients: body.ingredients,
        instructions: body.instructions,
        prepTime: body.prepTime || null,
        cookTime: body.cookTime || null,
        servings: body.servings || null,
        category: body.category || null,
        source: body.source || null,
        notes: body.notes || null,
        isFavorite: body.isFavorite || false,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
