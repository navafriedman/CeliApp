import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places';

interface PlacePhoto {
  name: string;
  widthPx?: number;
  heightPx?: number;
}

interface PlaceDetails {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photos?: PlacePhoto[];
  primaryTypeDisplayName?: { text: string };
  primaryType?: string;
  types?: string[];
  regularOpeningHours?: { openNow?: boolean };
  currentOpeningHours?: { openNow?: boolean };
}

interface SuggestedItem {
  name: string;
  description: string;
  isGlutenFree: boolean;
  isVegetarian: boolean;
}

const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

function formatPlaceType(place: PlaceDetails): string {
  if (place.primaryTypeDisplayName?.text) return place.primaryTypeDisplayName.text;
  const primary =
    place.primaryType ||
    place.types?.find((t) => t.endsWith('_restaurant')) ||
    place.types?.[0];
  if (!primary) return '';
  return primary
    .replace(/_restaurant$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchPhotoUrl(
  photoName: string,
  apiKey: string,
  maxSize = 800
): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxSize}&maxWidthPx=${maxSize}&skipHttpRedirect=true&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.photoUri || null;
  } catch {
    return null;
  }
}

// Try to fetch and extract menu text from a restaurant's website
async function scrapeMenuFromWebsite(url: string): Promise<string | null> {
  try {
    const baseUrl = new URL(url).origin;
    const menuUrls = [
      `${baseUrl}/menu`,
      `${baseUrl}/menus`,
      `${baseUrl}/food-menu`,
      `${baseUrl}/our-menu`,
      `${baseUrl}/food`,
      `${baseUrl}/eat`,
      `${baseUrl}/dishes`,
      url,
    ];

    for (const menuUrl of menuUrls) {
      try {
        const response = await fetch(menuUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const html = await response.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const menuKeywords = /\b(appetizer|entree|main|dessert|salad|soup|sandwich|burger|pasta|rice|vegetable|side|drink|beverage|\$\d+|\d+\.\d{2})\b/i;
        if (text.length > 500 && menuKeywords.test(text)) {
          console.log(`Found menu content at ${menuUrl}`);
          return text.slice(0, 10000);
        }
      } catch {
        // try next URL
      }
    }
    return null;
  } catch {
    return null;
  }
}

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
          content: `You are helping someone with celiac disease who is also vegetarian find safe menu items at "${restaurantName}" (${categories}).

${menuContext}

Based on this menu information, identify ONLY dishes that are BOTH:
1. Gluten-free (naturally GF like rice, beans, vegetables, tofu, cheese, eggs - or explicitly marked GF)
2. Vegetarian (no meat, poultry, or fish)

Respond ONLY with a JSON array:
[
  { "name": "Dish Name", "description": "Brief description", "isGlutenFree": true, "isVegetarian": true }
]

Important:
- ONLY include items that are BOTH gluten-free AND vegetarian
- Only include real menu items from the data
- Be conservative with GF labels
- If no qualifying items found, return []
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

    const items: SuggestedItem[] = JSON.parse(content);
    return items.filter((item) => item.isGlutenFree && item.isVegetarian);
  } catch {
    return [];
  }
}

async function analyzeFoodPhotos(
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

    const prompt = `You are helping someone with celiac disease who is also vegetarian find dishes to order. These are food photos from "${restaurantName}" (${categories}).

Look at the INDIVIDUAL DISHES in these photos and identify which ones appear to be BOTH gluten-free AND vegetarian.

For ${categories} cuisine:
- Ethiopian: Stews/wots (lentils, split peas, chickpeas, vegetables) are usually GF. The injera bread they're served on is NOT GF, but the stews themselves are.
- Indian: Dal, vegetable curries, rice dishes, paneer dishes are often GF. Naan/roti are NOT GF.
- General: Look for rice, beans, lentils, vegetables, tofu, salads, eggs, cheese.

Based on what's visible, name each dish. If you recognize the dish type, use common names.

Respond ONLY with a JSON array:
[
  { "name": "Dish name", "description": "Brief description of what you see", "isGlutenFree": true, "isVegetarian": true }
]

Important:
- Focus on the DISHES, not bread/flatbread bases
- Include items that are naturally GF (no flour, breading, pasta)
- Only include vegetarian dishes (no meat/fish)
- Only respond with the JSON array, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }, ...imageContent],
        },
      ],
      max_tokens: 4000,
    });

    let content = response.choices[0]?.message?.content || '[]';
    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    const items: SuggestedItem[] = JSON.parse(content);
    return items.filter((item) => item.isGlutenFree && item.isVegetarian);
  } catch (error) {
    console.error('Food photo analysis error:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Places API key not configured' },
      { status: 500 }
    );
  }

  const { id } = await params;

  try {
    const detailsResponse = await fetch(`${PLACES_API_URL}/${id}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'id',
          'displayName',
          'formattedAddress',
          'nationalPhoneNumber',
          'websiteUri',
          'googleMapsUri',
          'rating',
          'userRatingCount',
          'priceLevel',
          'photos',
          'primaryTypeDisplayName',
          'primaryType',
          'types',
          'regularOpeningHours',
          'currentOpeningHours',
        ].join(','),
      },
    });

    if (!detailsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch restaurant details' },
        { status: detailsResponse.status }
      );
    }

    const place: PlaceDetails = await detailsResponse.json();
    const categories = formatPlaceType(place);
    const address = place.formattedAddress || '';
    const name = place.displayName?.text || 'Unknown';
    const googleMapsUrl =
      place.googleMapsUri ||
      `https://www.google.com/maps/search/${encodeURIComponent(name)}`;

    // Fetch up to 5 photo URLs in parallel
    const photoNames = (place.photos || []).slice(0, 5).map((p) => p.name);
    const [websiteMenuText, photoUrls] = await Promise.all([
      place.websiteUri ? scrapeMenuFromWebsite(place.websiteUri) : Promise.resolve(null),
      Promise.all(photoNames.map((name) => fetchPhotoUrl(name, apiKey))).then((urls) =>
        urls.filter((u): u is string => !!u)
      ),
    ]);

    let suggestedItems: SuggestedItem[] = [];
    let dataSource: 'website' | 'google_photos' | 'none' = 'none';
    let dataSourceUrl: string | null = null;

    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });

      // Priority 1: website menu text (most reliable for real dish names)
      if (websiteMenuText) {
        console.log(`Analyzing website menu for ${name} (${websiteMenuText.length} chars)`);
        suggestedItems = await analyzeMenuText(
          openai,
          `Menu content:\n${websiteMenuText}`,
          name,
          categories
        );
        if (suggestedItems.length > 0) {
          dataSource = 'website';
          dataSourceUrl = place.websiteUri || null;
        }
      }

      // Priority 2: Google Places food photos
      if (suggestedItems.length === 0 && photoUrls.length > 0) {
        console.log(`Analyzing Google photos for ${name} (${photoUrls.length} photos)`);
        suggestedItems = await analyzeFoodPhotos(openai, photoUrls, name, categories);
        if (suggestedItems.length > 0) {
          dataSource = 'google_photos';
          dataSourceUrl = googleMapsUrl;
        }
      }
    }

    return NextResponse.json({
      id: place.id,
      name,
      imageUrl: photoUrls[0] || '',
      url: googleMapsUrl,
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      price: place.priceLevel ? PRICE_LEVEL_MAP[place.priceLevel] : undefined,
      categories,
      address,
      phone: place.nationalPhoneNumber || '',
      photos: photoUrls,
      isOpenNow:
        place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow,
      suggestedItems,
      dataSource,
      dataSourceUrl,
      googlePhotosFound: photoUrls.length,
    });
  } catch (error) {
    console.error('Google Places API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
