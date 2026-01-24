import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and provide:
1. A short description of the food (what it appears to be)
2. A list of likely ingredients (comma-separated)
3. Whether this food is likely gluten-free or not (true/false)
4. Any notes about potential gluten concerns for someone with celiac disease

Respond in JSON format like this:
{
  "description": "Grilled chicken salad with mixed greens",
  "ingredients": "chicken, lettuce, tomatoes, cucumbers, olive oil",
  "isSafe": true,
  "notes": "Appears gluten-free, but check dressing ingredients"
}

Only respond with the JSON, no other text.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, try to extract info from text
      return NextResponse.json({
        description: content.slice(0, 200),
        ingredients: '',
        isSafe: null,
        notes: 'Could not fully analyze image',
      });
    }
  } catch (error) {
    console.error('Food analysis error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
