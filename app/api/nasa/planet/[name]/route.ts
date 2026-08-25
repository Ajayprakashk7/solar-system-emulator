import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';
import { planetNameSchema } from '@/lib/validation';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

// Common error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
    // Validate input
    const validationResult = planetNameSchema.safeParse(name);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Please provide a valid planet name', code: ERROR_CODES.VALIDATION_ERROR },
        { status: 400 }
      );
    }
    
    const validatedName = validationResult.data;
  
    // Check IP rate limit
    const clientIp = request.headers.get('x-forwarded-for') || 'global';
    const ipRateLimitResult = ipRateLimiter.check(clientIp);
    if (!ipRateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }

    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check();
    
    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for planet: ${validatedName}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }
    
    nasaLogger.debug(`Fetching planet image for: ${validatedName}`);
    
    // Special handling for Sun - search for "Sun solar surface" instead of "Sun planet"
    const query = validatedName === 'sun' ? 'Sun solar surface' : `${validatedName} planet`;
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&year_start=2010`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });
    
    if (!response.ok) {
      nasaLogger.warn(`NASA API error for ${validatedName}: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch planet data from NASA', code: ERROR_CODES.API_ERROR },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    const items = data?.collection?.items || [];
    
    // Filter for high-quality images
    const validImages = items.filter((item: { data?: Array<{ title?: string }>; links?: Array<{ href?: string }> }) => {
      const itemData = item.data?.[0];
      return itemData && itemData.title && item.links?.[0]?.href;
    });
    
    if (validImages.length > 0) {
      const topImage = validImages[0];
      const result = {
        url: topImage.links[0].href,
        title: topImage.data[0].title,
        description: topImage.data[0].description || '',
        dateCreated: topImage.data[0].date_created,
        photographer: topImage.data[0].photographer || topImage.data[0].secondary_creator || 'NASA',
      };
      
      nasaLogger.debug(`Successfully fetched image for ${validatedName}`);
      
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      });
    }
    
    nasaLogger.warn(`No images found for ${validatedName}`);
    return NextResponse.json(
      { error: 'No images found for this planet', code: ERROR_CODES.NOT_FOUND },
      { status: 404 }
    );
  } catch (error) {
    nasaLogger.error('[PLANET_API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch planet data', code: ERROR_CODES.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}
