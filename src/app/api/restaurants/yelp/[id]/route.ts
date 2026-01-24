import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const YELP_API_URL = 'https://api.yelp.com/v3/businesses';

interface YelpBusinessDetails {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  categories: { alias: string; title: string }[];
  rating: number;
  price?: string;
  location: {
    display_address: string[];
  };
  display_phone: string;
  photos: string[];
  hours?: {
    open: { start: string; end: string; day: number }[];
    is_open_now: boolean;
  }[];
}

interface YelpReview {
  id: string;
  text: string;
  rating: number;
  user: { name: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.YELP_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Yelp API key not configured' },
      { status: 500 }
    );
  }

  const { id } = await params;

  try {
    // Fetch business details
    const detailsResponse = await fetch(`${YELP_API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!detailsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch restaurant details' },
        { status: detailsResponse.status }
      );
    }

    const business: YelpBusinessDetails = await detailsResponse.json();

    // Fetch reviews to analyze for menu items
    const reviewsResponse = await fetch(`${YELP_API_URL}/${id}/reviews?limit=20`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    let reviews: YelpReview[] = [];
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      reviews = reviewsData.reviews || [];
    }

    // Use AI to analyze reviews and suggest GF/vegetarian items
    let suggestedItems: { name: string; description: string; isGlutenFree: boolean; isVegetarian: boolean }[] = [];

    if (openaiKey && reviews.length > 0) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });

        const reviewTexts = reviews.map((r) => r.text).join('\n---\n');

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Based on these Yelp reviews for "${business.name}" (a ${business.categories.map((c) => c.title).join(', ')} restaurant), extract any menu items mentioned and identify which ones are likely:
1. Gluten-free (or can be made GF)
2. Vegetarian

Reviews:
${reviewTexts}

Respond in JSON format with an array of items:
[
  { "name": "Item name", "description": "Brief description from reviews", "isGlutenFree": true/false, "isVegetarian": true/false }
]

Only include items that are mentioned in reviews. If no specific items are mentioned, return an empty array [].
Focus on items that are explicitly mentioned as GF or vegetarian, or naturally would be (like salads, rice dishes, etc).
Only respond with the JSON array, no other text.`,
            },
          ],
          max_tokens: 1000,
        });

        let content = aiResponse.choices[0]?.message?.content || '[]';

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
          suggestedItems = JSON.parse(content);
        } catch {
          suggestedItems = [];
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // Continue without AI suggestions
      }
    }

    return NextResponse.json({
      id: business.id,
      name: business.name,
      imageUrl: business.image_url,
      url: business.url,
      rating: business.rating,
      reviewCount: business.review_count,
      price: business.price,
      categories: business.categories.map((c) => c.title).join(', '),
      address: business.location.display_address.join(', '),
      phone: business.display_phone,
      photos: business.photos,
      isOpenNow: business.hours?.[0]?.is_open_now,
      suggestedItems,
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
