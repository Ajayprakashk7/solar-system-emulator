import { NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function GET() {
  try {
    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check('nasa-api');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          reset: rateLimitResult.reset.toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
            'Retry-After': Math.ceil(
              (rateLimitResult.reset.getTime() - Date.now()) / 1000
            ).toString(),
          }
        }
      );
    }

    const apiKey = env.NASA_API_KEY;
    // Use latest_photos to ensure we get something
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${apiKey}`;

    nasaLogger.debug('Fetching latest Mars Rover photos');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error: ${response.status}`);
      throw new AppError(
        `NASA API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Mars Rover photos'
      );
    }

    const data = await response.json();

    // Return just one random photo to keep payload small
    let result = null;
    if (data.latest_photos && data.latest_photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.latest_photos.length);
      result = data.latest_photos[randomIndex];
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars Rover data',
        code: appError.code
      },
      { status: appError.statusCode }
    );
  }
}
