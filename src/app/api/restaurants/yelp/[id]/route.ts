import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const YELP_API_URL = 'https://api.yelp.com/v3/businesses';
const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places';

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
  categories: string,
  isMenuPhoto: boolean = true
): Promise<SuggestedItem[]> {
  if (photoUrls.length === 0) return [];

  try {
    const imageContent = photoUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'high' as const },
    }));

    // Different prompts for menu photos vs food photos
    const prompt = isMenuPhoto
      ? `You are helping someone with celiac disease who is also vegetarian find safe menu items. These are menu photos from "${restaurantName}" (${categories}).

Analyze these menu images and extract ONLY menu items that are BOTH:
1. Gluten-free (naturally GF ingredients like rice, beans, vegetables, tofu, cheese, eggs - or explicitly marked GF)
2. Vegetarian (no meat, poultry, or fish)

Be thorough - read every item you can see on the menu(s), but ONLY include items that meet BOTH criteria.

Respond ONLY with a JSON array:
[
  { "name": "Exact Menu Item Name", "description": "Brief description or ingredients if visible", "isGlutenFree": true, "isVegetarian": true }
]

Important:
- ONLY include items that are BOTH gluten-free AND vegetarian
- Include the exact name as written on the menu
- Be conservative with GF labels - only include if clearly safe or naturally GF
- If you can see prices, don't include them in the name
- If you can't read the menu clearly or find no qualifying items, return []
- Only respond with the JSON array, no other text.`
      : `You are helping someone with celiac disease who is also vegetarian. These are food photos from "${restaurantName}" (${categories}).

Look at the dishes in these photos. For each dish that appears to be BOTH gluten-free AND vegetarian, describe what you see.

For the "name" field, describe what type of dish it appears to be (e.g., "Red Lentil Stew", "Sautéed Greens", "Chickpea Curry"). Don't make up specific menu names - just describe the dish type.

Context for ${categories} cuisine:
- Ethiopian: Look for stews/wots (lentils, split peas, vegetables). Injera bread is NOT GF.
- Indian: Look for dal, vegetable curries, rice dishes. Naan/roti are NOT GF.
- General: Look for rice, beans, lentils, vegetables, tofu, salads.

Respond ONLY with a JSON array:
[
  { "name": "Type of dish (e.g., 'Red Lentil Stew')", "description": "What you see - ingredients visible", "isGlutenFree": true, "isVegetarian": true }
]

Important:
- Only include dishes that appear naturally GF (no bread, pasta, breading)
- Only include vegetarian dishes (no meat/fish visible)
- Use generic dish type names, not made-up menu names
- If unsure or can't identify GF+veggie dishes, return []`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
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

    // Parse and filter to ensure both GF AND vegetarian
    const items: SuggestedItem[] = JSON.parse(content);
    return items.filter(item => item.isGlutenFree && item.isVegetarian);
  } catch (error) {
    console.error('Menu photo analysis error:', error);
    return [];
  }
}

// Search Google Places for a restaurant and get its photos
async function getGooglePlacesData(
  restaurantName: string,
  address: string,
  googleApiKey: string
): Promise<{ photoUrls: string[]; googleMapsUrl: string | null }> {
  try {
    // First, search for the place using text search
    const searchResponse = await fetch(
      `${GOOGLE_PLACES_API_URL}:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.googleMapsUri',
        },
        body: JSON.stringify({
          textQuery: `${restaurantName} ${address}`,
          maxResultCount: 1,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!searchResponse.ok) {
      console.error('Google Places search failed:', await searchResponse.text());
      return { photoUrls: [], googleMapsUrl: null };
    }

    const searchData = await searchResponse.json();
    const place = searchData.places?.[0];

    if (!place || !place.photos || place.photos.length === 0) {
      return { photoUrls: [], googleMapsUrl: place?.googleMapsUri || null };
    }

    // Get photo URLs - Google Places API v1 returns photo references
    // We need to fetch each photo's actual URL using the getMedia endpoint
    const photoUrls: string[] = [];

    // Take up to 5 photos (prioritizing variety)
    const photosToFetch = place.photos.slice(0, 5);

    for (const photo of photosToFetch) {
      try {
        // Google Places API v1 - fetch the photo media to get the actual photoUri
        // The response returns a short-lived URL we can use with OpenAI
        const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=800&skipHttpRedirect=true&key=${googleApiKey}`;
        const mediaResponse = await fetch(mediaUrl, { signal: AbortSignal.timeout(5000) });

        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          if (mediaData.photoUri) {
            photoUrls.push(mediaData.photoUri);
          }
        } else {
          console.error(`Google photo fetch failed (${mediaResponse.status}):`, await mediaResponse.text().catch(() => 'no body'));
        }
      } catch (err) {
        console.error('Google photo fetch error:', err);
      }
    }

    return {
      photoUrls,
      googleMapsUrl: place.googleMapsUri || null,
    };
  } catch (error) {
    console.error('Google Places API error:', error);
    return { photoUrls: [], googleMapsUrl: null };
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

    // Parse and filter to ensure both GF AND vegetarian
    const items: SuggestedItem[] = JSON.parse(content);
    return items.filter(item => item.isGlutenFree && item.isVegetarian);
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
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Yelp API key not configured' },
      { status: 500 }
    );
  }

  const { id } = await params;

  try {
    // Fetch business details from Yelp
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
    const address = business.location.display_address.join(', ');

    // Gather data from multiple sources in parallel
    const [menuText, yelpData, yelpApiPhotos, googleData] = await Promise.all([
      // Try restaurant's own website
      business.attributes?.menu_url
        ? scrapeMenuFromWebsite(business.attributes.menu_url)
        : Promise.resolve(null),
      // Scrape Yelp page for menu photos and popular dishes
      scrapeYelpPage(business.url),
      // Try Yelp's photo API
      getYelpMenuPhotos(id, apiKey),
      // Try Google Places API for photos
      googleApiKey
        ? getGooglePlacesData(business.name, address, googleApiKey)
        : Promise.resolve({ photoUrls: [], googleMapsUrl: null }),
    ]);

    // Combine menu photo sources from Yelp
    const yelpMenuPhotos = [...new Set([...yelpData.menuPhotoUrls, ...yelpApiPhotos])].slice(0, 4);

    let suggestedItems: SuggestedItem[] = [];
    let dataSource = 'none';
    let dataSourceUrl: string | null = null;

    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });

      // Priority 1: Analyze Yelp menu photos with Vision (most reliable for menus)
      if (yelpMenuPhotos.length > 0) {
        suggestedItems = await analyzeMenuPhotos(openai, yelpMenuPhotos, business.name, categories, true);
        if (suggestedItems.length > 0) {
          dataSource = 'menu_photo';
          dataSourceUrl = `${business.url}/photos`;
        }
      }

      // Priority 2: Try Google Places photos (food photos, not menu photos)
      if (suggestedItems.length === 0 && googleData.photoUrls.length > 0) {
        // These are food photos, not menu photos - use different prompt
        suggestedItems = await analyzeMenuPhotos(openai, googleData.photoUrls, business.name, categories, false);
        if (suggestedItems.length > 0) {
          dataSource = 'google_photos';
          dataSourceUrl = googleData.googleMapsUrl;
        }
      }

      // Priority 3: Analyze website menu text
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

      // Priority 4: Use popular dishes from Yelp
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
      address,
      phone: business.display_phone,
      photos: business.photos,
      isOpenNow: business.hours?.[0]?.is_open_now,
      suggestedItems,
      dataSource,
      dataSourceUrl,
      menuPhotosFound: yelpMenuPhotos.length,
      googlePhotosFound: googleData.photoUrls.length,
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
