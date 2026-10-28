import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { handleError, AppError, ERROR_CODES } from '@/lib/app-error';
import { fetchNasaResource } from '@/lib/nasa-fetch';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours cache

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

    nasaLogger.debug('Fetching Mars rover latest photos');

    const apiKey = env.NASA_API_KEY;
    // Using latest_photos endpoint which doesn't require specific sol or camera combinations
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${apiKey}`;

    const response = await fetchNasaResource(
      url,
      {
        headers: {
          'User-Agent': 'Solar-System-Emulator/1.0',
          Accept: 'application/json',
        },
        next: { revalidate: CACHE_DURATION },
      },
      { timeoutMs: 7_000, retries: 1 }
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
    nasaLogger.debug(`Successfully fetched ${data.latest_photos?.length || 0} Mars rover photos`);

    // Return the first image or null if none
    const photo = data.latest_photos?.[0] || null;

    if (!photo) {
      throw new AppError(
        'No Mars rover photos found',
        ERROR_CODES.NOT_FOUND,
        404,
        'No Mars rover photos are currently available'
      );
    }

    return NextResponse.json({
      url: photo.img_src,
      title: `Mars Rover ${photo.rover.name}`,
      description: `Taken by ${photo.rover.name}'s ${photo.camera.full_name} on Earth date ${photo.earth_date} (Sol ${photo.sol}).`,
      dateCreated: photo.earth_date,
      photographer: 'NASA/JPL-Caltech',
      source: 'NASA Mars Rover Photos API'
    }, {
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
