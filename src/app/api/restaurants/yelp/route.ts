import { NextRequest, NextResponse } from 'next/server';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places';

interface PlacePhoto {
  name: string;
}

interface Place {
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
}

interface SearchTextResponse {
  places?: Place[];
  nextPageToken?: string;
}

const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

function formatPlaceType(place: Place): string {
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

async function fetchPhotoUrl(photoName: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.photoUri || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your .env.local file.' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location') || '11216';
  const term = searchParams.get('term') || '';
  const pageToken = searchParams.get('pageToken') || '';

  const textQuery = term
    ? `${term} near ${location}`
    : `gluten free vegetarian vegan restaurants near ${location}`;

  try {
    const body: Record<string, unknown> = {
      textQuery,
      pageSize: 20,
    };
    if (pageToken) body.pageToken = pageToken;

    const response = await fetch(`${PLACES_API_URL}:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.nationalPhoneNumber',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.photos',
          'places.primaryTypeDisplayName',
          'places.primaryType',
          'places.types',
          'nextPageToken',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Places API error:', errText);
      return NextResponse.json(
        { error: 'Failed to fetch from Google Places' },
        { status: response.status }
      );
    }

    const data: SearchTextResponse = await response.json();
    const places = data.places || [];

    // Fetch first-photo URL for each place in parallel
    const restaurants = await Promise.all(
      places.map(async (place) => {
        const firstPhoto = place.photos?.[0]?.name;
        const imageUrl = firstPhoto ? await fetchPhotoUrl(firstPhoto, apiKey) : null;
        return {
          yelpId: place.id,
          name: place.displayName?.text || '',
          address: place.formattedAddress || '',
          phone: place.nationalPhoneNumber || '',
          website: place.googleMapsUri || place.websiteUri || '',
          cuisineType: formatPlaceType(place),
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          price: place.priceLevel ? PRICE_LEVEL_MAP[place.priceLevel] : undefined,
          imageUrl: imageUrl || '',
        };
      })
    );

    return NextResponse.json({
      restaurants,
      hasMore: Boolean(data.nextPageToken),
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    console.error('Google Places API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
