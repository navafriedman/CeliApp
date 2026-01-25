import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface SearchResult {
  title: string;
  description: string;
  url: string;
}

interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string | null;
  source: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query required' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use OpenAI to generate recipe suggestions based on the query
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful gluten-free recipe assistant. When given a search query, generate 5 delicious gluten-free recipe ideas that match the query. Each recipe should be complete with ingredients and instructions.

For each recipe, provide:
- A creative, appetizing title
- A brief description (1-2 sentences)
- Full ingredient list (one ingredient per line)
- Step-by-step instructions
- Prep time in minutes
- Cook time in minutes
- Number of servings
- Category (breakfast, lunch, dinner, dessert, snack, side, sauce, other)

IMPORTANT: All recipes MUST be 100% gluten-free. Use gluten-free alternatives where needed (e.g., GF flour, GF pasta, tamari instead of soy sauce, etc.). Always specify when an ingredient should be certified gluten-free.

Respond with a JSON array of recipes in this exact format:
[
  {
    "title": "Recipe Title",
    "description": "Brief appetizing description",
    "ingredients": "1 cup rice flour\\n2 eggs\\n...",
    "instructions": "1. Preheat oven to 350F.\\n2. Mix dry ingredients...\\n3. ...",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "category": "dinner"
  }
]

Only respond with the JSON array, no other text.`
        },
        {
          role: 'user',
          content: `Find gluten-free recipes for: ${query}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.8,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Strip markdown code fences if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.slice(7);
    } else if (content.startsWith('```')) {
      content = content.slice(3);
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3);
    }
    content = content.trim();

    try {
      const recipes: ParsedRecipe[] = JSON.parse(content);

      // Add source attribution
      const recipesWithSource = recipes.map(recipe => ({
        ...recipe,
        source: 'AI-generated gluten-free recipe',
      }));

      return NextResponse.json({ recipes: recipesWithSource });
    } catch {
      console.error('Failed to parse recipes:', content);
      return NextResponse.json({ error: 'Failed to parse recipe results' }, { status: 500 });
    }
  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
