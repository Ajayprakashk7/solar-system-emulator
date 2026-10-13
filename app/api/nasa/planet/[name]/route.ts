import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { planetNameSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

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
    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(
        `Rate limit exceeded (${rateLimitResult.scope}) for planet: ${validatedName}`
      );
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug(`Fetching planet image for: ${validatedName}`);

    const query = validatedName === 'sun' ? 'Sun solar surface' : `${validatedName} planet`;
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&year_start=2010`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA API error for ${validatedName}: ${response.status}`);
      throw new AppError(
        `NASA API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch planet data from NASA'
      );
    }

    const data = await response.json();
    const items = data?.collection?.items || [];
    const validImages = items.filter(
      (item: { data?: Array<{ title?: string }>; links?: Array<{ href?: string }> }) => {
        const itemData = item.data?.[0];
        return Boolean(itemData?.title && item.links?.[0]?.href);
      }
    );

    if (validImages.length === 0) {
      nasaLogger.warn(`No images found for ${validatedName}`);
      throw new AppError(
        `No images found for ${validatedName}`,
        ERROR_CODES.NOT_FOUND,
        404,
        'No images found for this planet'
      );
    }

    const topImage = validImages[0];
    const result = {
      url: topImage.links[0].href,
      title: topImage.data[0].title,
      description: topImage.data[0].description || '',
      dateCreated: topImage.data[0].date_created,
      photographer:
        topImage.data[0].photographer || topImage.data[0].secondary_creator || 'NASA',
    };

    nasaLogger.debug(`Successfully fetched image for ${validatedName}`);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'PLANET_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch planet data',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
