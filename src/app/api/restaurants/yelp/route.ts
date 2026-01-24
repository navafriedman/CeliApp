import { NextRequest, NextResponse } from 'next/server';

// Yelp Fusion API endpoint
const YELP_API_URL = 'https://api.yelp.com/v3/businesses/search';

interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  categories: { alias: string; title: string }[];
  rating: number;
  coordinates: { latitude: number; longitude: number };
  price?: string;
  location: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip_code: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number;
}

interface YelpResponse {
  businesses: YelpBusiness[];
  total: number;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YELP_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Yelp API key not configured. Add YELP_API_KEY to your .env.local file.' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location') || '11216'; // Default to user's zip
  const offset = searchParams.get('offset') || '0';
  const searchTerm = searchParams.get('term') || ''; // Restaurant name search

  try {
    // Build search params
    const params = new URLSearchParams({
      location,
      limit: '20',
      offset,
      sort_by: 'rating',
    });

    // If searching for a specific restaurant, use that term
    // Otherwise default to GF-friendly categories
    if (searchTerm) {
      params.set('term', searchTerm);
    } else {
      params.set('term', 'gluten free vegetarian vegan');
      params.set('categories', 'vegetarian,vegan,glutenfree,healthfood,juicebars,raw_food');
    }

    const response = await fetch(`${YELP_API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Yelp API error:', error);
      return NextResponse.json(
        { error: error.error?.description || 'Failed to fetch from Yelp' },
        { status: response.status }
      );
    }

    const data: YelpResponse = await response.json();

    // Transform Yelp results to our app's format
    const restaurants = data.businesses.map((biz) => ({
      yelpId: biz.id,
      name: biz.name,
      address: biz.location.display_address.join(', '),
      phone: biz.display_phone,
      website: biz.url,
      cuisineType: biz.categories.map(c => c.title).join(', '),
      rating: biz.rating,
      reviewCount: biz.review_count,
      price: biz.price,
      imageUrl: biz.image_url,
      distance: biz.distance,
    }));

    return NextResponse.json({
      restaurants,
      total: data.total,
      hasMore: parseInt(offset) + 20 < data.total,
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants from Yelp' },
      { status: 500 }
    );
  }
}
