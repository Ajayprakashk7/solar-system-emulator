import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { handleError, AppError, ERROR_CODES } from '@/lib/app-error';
import { fetchNasaResource } from '@/lib/nasa-fetch';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded (${rateLimitResult.scope}) for Mars Rover API`);
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug('Fetching Mars rover latest photos');

    // Per memory instructions: use /latest_photos endpoint to avoid 404 errors
    // with specific sol/camera combinations
    const url = new URL('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos');
    url.searchParams.set('api_key', env.NASA_API_KEY);

    const response = await fetchNasaResource(
      url,
      {
        headers: {
          'User-Agent': 'Solar-System-Emulator/1.0',
          Accept: 'application/json',
        },
        next: { revalidate: CACHE_DURATION },
      },
      { timeoutMs: 8_000, retries: 1 }
    );

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error: ${response.status}`);
      throw new AppError(
        `NASA Mars Rover API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch Mars rover photos'
      );
    }

    const data = await response.json();

    // Get a random photo from the latest photos array, if available
    let photo = null;
    if (data.latest_photos && data.latest_photos.length > 0) {
      // Pick a random photo to keep it interesting
      const randomIndex = Math.floor(Math.random() * data.latest_photos.length);
      const rawPhoto = data.latest_photos[randomIndex];

      photo = {
        id: rawPhoto.id,
        img_src: rawPhoto.img_src,
        earth_date: rawPhoto.earth_date,
        sol: rawPhoto.sol,
        camera: rawPhoto.camera?.full_name || rawPhoto.camera?.name,
        rover: rawPhoto.rover?.name
      };
    }

    return NextResponse.json(photo, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars rover data',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
