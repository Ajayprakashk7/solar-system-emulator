import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema, roverNameSchema, solSchema } from '@/lib/validation';
import { nasaRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = nasaRateLimiter.check('nasa_api_global');
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests to NASA API. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Extract parameters
    const roverRaw = searchParams.get('rover') || 'curiosity';
    const solStr = searchParams.get('sol');
    const earthDateStr = searchParams.get('earth_date');
    const camera = searchParams.get('camera');
    const pageStr = searchParams.get('page');

    // Validate rover name
    const roverValidation = roverNameSchema.safeParse(roverRaw);
    if (!roverValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid rover name. Must be one of: curiosity, opportunity, spirit, perseverance.',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }
    const rover = roverValidation.data;

    let endpoint = 'photos';
    const queryParts = [];

    // Validation logic for date/sol
    if (solStr !== null) {
      const solNum = parseInt(solStr, 10);
      const solValidation = solSchema.safeParse(solNum);
      if (!solValidation.success) {
        return NextResponse.json(
          {
            error: 'Invalid sol value. Must be a non-negative integer.',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
      queryParts.push(`sol=${solValidation.data}`);
    } else if (earthDateStr !== null) {
      const dateValidation = dateSchema.safeParse(earthDateStr);
      if (!dateValidation.success) {
        return NextResponse.json(
          {
            error: 'Please provide earth_date in YYYY-MM-DD format.',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
      queryParts.push(`earth_date=${earthDateStr}`);
    } else {
      // Fallback to latest photos
      endpoint = 'latest_photos';
    }

    // Add optional params
    if (camera) {
      queryParts.push(`camera=${encodeURIComponent(camera)}`);
    }
    if (pageStr) {
      const pageNum = parseInt(pageStr, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        return NextResponse.json(
          {
            error: 'Page must be a positive integer.',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
      queryParts.push(`page=${pageNum}`);
    }

    nasaLogger.debug(`Fetching Mars rover data: rover=${rover}, endpoint=${endpoint}, params=${queryParts.join('&')}`);

    const apiKey = env.NASA_API_KEY;
    queryParts.push(`api_key=${apiKey}`);

    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/${endpoint}?${queryParts.join('&')}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error: ${response.status}`);
      return NextResponse.json(
        {
          error: 'Failed to fetch Mars Rover data',
          code: 'API_ERROR'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    nasaLogger.debug('Successfully fetched Mars Rover data');

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
      },
    });
  } catch (error) {
    nasaLogger.error('[MARS_ROVER_API]', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}
