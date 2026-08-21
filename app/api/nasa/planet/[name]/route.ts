import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';
import { planetNameSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipRateLimitResult = ipRateLimiter.check(ip);

    if (!ipRateLimitResult.success) {
      nasaLogger.warn(`IP Rate limit exceeded for IP: ${ip}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    const { name } = await params;
    
    // Validate input
    const validationResult = planetNameSchema.safeParse(name);
    if (!validationResult.success) {
      throw new AppError(
        `Invalid planet name: ${name}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid planet name'
      );
    }
    
    const validatedName = validationResult.data;
  
    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check();
    
    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for planet: ${validatedName}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
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
      throw new AppError(
        `NASA API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch planet data from NASA'
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
    throw new AppError(
      `No images found for ${validatedName}`,
      ERROR_CODES.NOT_FOUND,
      404,
      'No images found for this planet'
    );
  } catch (error) {
    const appError = handleError(error, 'PLANET_API');
    return NextResponse.json(
      { 
        error: appError.userMessage || 'Failed to fetch planet data',
        code: appError.code 
      },
      { status: appError.statusCode }
    );
  }
}
