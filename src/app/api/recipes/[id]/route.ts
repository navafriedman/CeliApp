import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  return NextResponse.json(recipe);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.recipe.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
