import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { handleError, AppError, ERROR_CODES } from '@/lib/app-error';
import { fetchNasaResource } from '@/lib/nasa-fetch';

const CACHE_DURATION = 24 * 60 * 60; // 1 day

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded (${rateLimitResult.scope}) for Mars rover photos`);
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug('Fetching Mars rover photos');

    // Get the latest photos from Curiosity rover
    const url = new URL('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos');
    // Using fetchNasaResource which automatically adds the API key
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
        'Failed to fetch Mars rover photos from NASA'
      );
    }

    const data = await response.json();
    const photos = data.latest_photos || [];

    if (photos.length === 0) {
      nasaLogger.warn('No Mars rover photos found');
      throw new AppError(
        'No Mars rover photos found',
        ERROR_CODES.NOT_FOUND,
        404,
        'No recent Mars rover photos available'
      );
    }

    // Select a random photo from the latest ones
    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];

    const result = {
      id: randomPhoto.id,
      img_src: randomPhoto.img_src,
      earth_date: randomPhoto.earth_date,
      camera: randomPhoto.camera.full_name,
      rover: randomPhoto.rover.name,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars rover photo',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
