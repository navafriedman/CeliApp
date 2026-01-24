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

interface YelpPhoto {
  id: string;
  url: string;
  caption: string;
  label: string;
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
    const baseUrl = new URL(url).origin;
    const menuUrls = [
      url,
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
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) continue;

        const html = await response.text();
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

        if (text.length > 500) {
          return text.slice(0, 8000);
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

// Fetch menu photos from Yelp's photo API
async function getYelpMenuPhotos(businessId: string, apiKey: string): Promise<string[]> {
  try {
    // Yelp's photo endpoint - filter for menu photos
    const response = await fetch(
      `${YELP_API_URL}/${businessId}/photos?limit=30`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const photos: YelpPhoto[] = data.photos || [];

    // Filter for menu photos (label is "menu" or caption contains menu-related words)
    const menuPhotos = photos.filter(
      (p) =>
        p.label === 'menu' ||
        p.caption?.toLowerCase().includes('menu') ||
        p.caption?.toLowerCase().includes('specials')
    );

    // Return up to 3 menu photo URLs
    return menuPhotos.slice(0, 3).map((p) => p.url);
  } catch {
    return [];
  }
}

// Scrape the Yelp page for menu photos and popular dishes
async function scrapeYelpPage(yelpUrl: string): Promise<{ menuPhotoUrls: string[]; popularDishes: string[] }> {
  try {
    const response = await fetch(yelpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { menuPhotoUrls: [], popularDishes: [] };

    const html = await response.text();
    const menuPhotoUrls: string[] = [];
    const popularDishes: string[] = [];

    // Look for menu photos - Yelp often labels these
    // Match image URLs in menu-related sections
    const menuSectionMatch = html.match(/menu[\s\S]{0,2000}?(?=<\/section|<\/article)/gi);
    if (menuSectionMatch) {
      for (const section of menuSectionMatch) {
        const imgMatches = section.match(/https:\/\/s3-media[0-9]*\.fl\.yelpcdn\.com\/bphoto\/[^"'\s]+/g);
        if (imgMatches) {
          menuPhotoUrls.push(...imgMatches.slice(0, 3));
        }
      }
    }

    // Also look for any photo labeled as menu in the entire page
    const allMenuImgs = html.match(/"label"\s*:\s*"menu"[\s\S]{0,200}?"url"\s*:\s*"([^"]+)"/gi);
    if (allMenuImgs) {
      for (const match of allMenuImgs) {
        const urlMatch = match.match(/"url"\s*:\s*"([^"]+)"/);
        if (urlMatch && urlMatch[1]) {
          menuPhotoUrls.push(urlMatch[1]);
        }
      }
    }

    // Extract popular dishes
    const dishMatches = html.match(/(?:popular|recommended|must.try|signature)[\s\S]{0,500}?(?=<\/section|<\/div>)/gi);
    if (dishMatches) {
      for (const match of dishMatches) {
        const itemMatches = match.match(/>([A-Z][^<]{3,40})</g);
        if (itemMatches) {
          for (const item of itemMatches) {
            const cleaned = item.replace(/^>|<$/g, '').trim();
            if (cleaned.length > 3 && cleaned.length < 50 && !cleaned.includes('http')) {
              popularDishes.push(cleaned);
            }
          }
        }
      }
    }

    return {
      menuPhotoUrls: [...new Set(menuPhotoUrls)].slice(0, 4),
      popularDishes: [...new Set(popularDishes)].slice(0, 20),
    };
  } catch {
    return { menuPhotoUrls: [], popularDishes: [] };
  }
}

// Analyze menu photos using GPT-4 Vision
async function analyzeMenuPhotos(
  openai: OpenAI,
  photoUrls: string[],
  restaurantName: string,
  categories: string
): Promise<SuggestedItem[]> {
  if (photoUrls.length === 0) return [];

  try {
    const imageContent = photoUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'high' as const },
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are helping someone with celiac disease find safe menu items. These are menu photos from "${restaurantName}" (${categories}).

Analyze these menu images and extract ALL menu items you can read. For each item, determine:
1. Is it likely gluten-free? (naturally GF ingredients like rice, meat, vegetables, salads, or explicitly marked GF)
2. Is it vegetarian?

Be thorough - read every item you can see on the menu(s).

Respond ONLY with a JSON array:
[
  { "name": "Exact Menu Item Name", "description": "Brief description or ingredients if visible", "isGlutenFree": true/false, "isVegetarian": true/false }
]

Important:
- Include the exact name as written on the menu
- Be conservative with GF labels - only true if clearly safe or naturally GF
- If you can see prices, don't include them in the name
- If you can't read the menu clearly, return []
- Only respond with the JSON array, no other text.`,
            },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 4000,
    });

    let content = response.choices[0]?.message?.content || '[]';

    // Strip markdown code fences
    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    return JSON.parse(content);
  } catch (error) {
    console.error('Menu photo analysis error:', error);
    return [];
  }
}

// Analyze text-based menu data
async function analyzeMenuText(
  openai: OpenAI,
  menuContext: string,
  restaurantName: string,
  categories: string
): Promise<SuggestedItem[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `You are helping someone with celiac disease find safe menu items at "${restaurantName}" (${categories}).

${menuContext}

Based on this menu information, identify specific dishes that are:
1. Gluten-free (naturally GF or explicitly marked as GF) - be conservative
2. Vegetarian

Respond ONLY with a JSON array:
[
  { "name": "Dish Name", "description": "Brief description", "isGlutenFree": true/false, "isVegetarian": true/false }
]

Important:
- Only include real menu items from the data
- Be conservative with GF labels
- Include a variety of items
- If no clear items found, return []
- Only respond with the JSON array.`,
        },
      ],
      max_tokens: 2000,
    });

    let content = response.choices[0]?.message?.content || '[]';

    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    return JSON.parse(content);
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
    const categories = business.categories.map((c) => c.title).join(', ');

    // Gather data from multiple sources in parallel
    const [menuText, yelpData, yelpApiPhotos] = await Promise.all([
      // Try restaurant's own website
      business.attributes?.menu_url
        ? scrapeMenuFromWebsite(business.attributes.menu_url)
        : Promise.resolve(null),
      // Scrape Yelp page for menu photos and popular dishes
      scrapeYelpPage(business.url),
      // Try Yelp's photo API
      getYelpMenuPhotos(id, apiKey),
    ]);

    // Combine menu photo sources
    const allMenuPhotos = [...new Set([...yelpData.menuPhotoUrls, ...yelpApiPhotos])].slice(0, 4);

    let suggestedItems: SuggestedItem[] = [];
    let dataSource = 'none';
    let dataSourceUrl: string | null = null;

    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });

      // Priority 1: Analyze menu photos with Vision (most reliable)
      if (allMenuPhotos.length > 0) {
        console.log(`Analyzing ${allMenuPhotos.length} menu photos for ${business.name}`);
        suggestedItems = await analyzeMenuPhotos(openai, allMenuPhotos, business.name, categories);
        if (suggestedItems.length > 0) {
          dataSource = 'menu_photo';
          // Link to Yelp photos page
          dataSourceUrl = `${business.url}/photos`;
        }
      }

      // Priority 2: Analyze website menu text
      if (suggestedItems.length === 0 && menuText) {
        console.log(`Analyzing website menu text for ${business.name}`);
        suggestedItems = await analyzeMenuText(
          openai,
          `Menu content from restaurant website:\n${menuText}`,
          business.name,
          categories
        );
        if (suggestedItems.length > 0) {
          dataSource = 'menu';
          dataSourceUrl = business.attributes?.menu_url || null;
        }
      }

      // Priority 3: Use popular dishes from Yelp
      if (suggestedItems.length === 0 && yelpData.popularDishes.length > 0) {
        console.log(`Analyzing Yelp popular dishes for ${business.name}`);
        suggestedItems = await analyzeMenuText(
          openai,
          `Popular dishes from Yelp: ${yelpData.popularDishes.join(', ')}`,
          business.name,
          categories
        );
        if (suggestedItems.length > 0) {
          dataSource = 'yelp_dishes';
          dataSourceUrl = business.url;
        }
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
      categories,
      address: business.location.display_address.join(', '),
      phone: business.display_phone,
      photos: business.photos,
      isOpenNow: business.hours?.[0]?.is_open_now,
      suggestedItems,
      dataSource,
      dataSourceUrl,
      menuPhotosFound: allMenuPhotos.length,
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
