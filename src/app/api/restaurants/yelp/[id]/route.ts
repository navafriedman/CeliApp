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
  attributes?: {
    menu_url?: string;
  };
}

interface SuggestedItem {
  name: string;
  description: string;
  isGlutenFree: boolean;
  isVegetarian: boolean;
}

// Try to fetch and extract menu text from a restaurant's website
async function scrapeMenuFromWebsite(url: string): Promise<string | null> {
  try {
    // Try common menu URL patterns
    const baseUrl = new URL(url).origin;
    const menuUrls = [
      url, // Yelp-provided menu URL
      `${baseUrl}/menu`,
      `${baseUrl}/food-menu`,
      `${baseUrl}/our-menu`,
    ];

    for (const menuUrl of menuUrls) {
      try {
        const response = await fetch(menuUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CeliApp/1.0; +https://celiapp.com)',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) continue;

        const html = await response.text();

        // Extract text content, focusing on menu-like content
        // Remove scripts, styles, and HTML tags
        let text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();

        // If we got substantial content, return it (truncate to avoid token limits)
        if (text.length > 500) {
          return text.slice(0, 8000); // Limit to ~8k chars for AI processing
        }
      } catch {
        // Continue to next URL
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch Yelp's "popular dishes" if available via web scraping
async function getYelpPopularDishes(yelpUrl: string): Promise<string[]> {
  try {
    const response = await fetch(yelpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CeliApp/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const html = await response.text();

    // Look for popular dishes in the Yelp page
    // Yelp often has these in specific data attributes or sections
    const dishes: string[] = [];

    // Match patterns like "Popular dishes" section content
    const dishMatches = html.match(/(?:popular|recommended|must.try|signature)[\s\S]{0,500}?(?=<\/section|<\/div>)/gi);
    if (dishMatches) {
      for (const match of dishMatches) {
        // Extract food item names (usually in spans or links)
        const itemMatches = match.match(/>([A-Z][^<]{3,40})</g);
        if (itemMatches) {
          for (const item of itemMatches) {
            const cleaned = item.replace(/^>|<$/g, '').trim();
            if (cleaned.length > 3 && cleaned.length < 50 && !cleaned.includes('http')) {
              dishes.push(cleaned);
            }
          }
        }
      }
    }

    return [...new Set(dishes)].slice(0, 20); // Dedupe and limit
  } catch {
    return [];
  }
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

    // Gather menu data from multiple sources in parallel
    const [menuText, popularDishes] = await Promise.all([
      // Try to scrape menu from restaurant's website
      business.attributes?.menu_url
        ? scrapeMenuFromWebsite(business.attributes.menu_url)
        : Promise.resolve(null),
      // Get popular dishes from Yelp page
      getYelpPopularDishes(business.url),
    ]);

    let suggestedItems: SuggestedItem[] = [];
    let dataSource = 'none';

    if (openaiKey && (menuText || popularDishes.length > 0)) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });

        // Build context based on available data
        let menuContext = '';
        if (menuText) {
          menuContext = `Menu content from restaurant website:\n${menuText}\n\n`;
          dataSource = 'menu';
        }
        if (popularDishes.length > 0) {
          menuContext += `Popular dishes from Yelp: ${popularDishes.join(', ')}\n\n`;
          if (!menuText) dataSource = 'yelp_dishes';
        }

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `You are helping someone with celiac disease find safe menu items at "${business.name}" (a ${business.categories.map((c) => c.title).join(', ')} restaurant).

${menuContext}

Based on this menu information, identify specific dishes that are:
1. Gluten-free (naturally GF or explicitly marked as GF) - be conservative, only mark as GF if confident
2. Vegetarian

For each item, provide:
- The exact dish name as it appears on the menu
- A brief description
- Whether it's gluten-free (true only if naturally GF like rice/salad dishes, or explicitly marked)
- Whether it's vegetarian

Respond in JSON format:
[
  { "name": "Dish Name", "description": "Brief description", "isGlutenFree": true/false, "isVegetarian": true/false }
]

Important:
- Only include real menu items you found in the data
- Be conservative with gluten-free labels - when in doubt, mark as false
- Include a good variety of items (appetizers, mains, sides)
- If no clear menu items are found, return an empty array []
- Only respond with the JSON array, no other text.`,
            },
          ],
          max_tokens: 2000,
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
      dataSource, // Let the frontend know where data came from
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
