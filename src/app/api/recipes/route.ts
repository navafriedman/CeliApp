import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const favorites = searchParams.get('favorites') === 'true';

  const recipes = await prisma.recipe.findMany({
    where: {
      ...(category && { category }),
      ...(favorites && { isFavorite: true }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const recipe = await prisma.recipe.create({
    data: {
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
}
