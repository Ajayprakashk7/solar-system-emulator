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
      nasaLogger.warn(`Rate limit exceeded (${rateLimitResult.scope}) for Mars Rover route`);
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    const apiKey = env.NASA_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    // Default to sol 1000 and camera fhaz if not provided
    const sol = searchParams.get('sol') || '1000';
    const camera = searchParams.get('camera') || 'fhaz';

    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&camera=${camera}&api_key=${apiKey}`;

    nasaLogger.debug(`Fetching Mars Rover photo for Sol ${sol}, Camera ${camera}`);

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

    // Some endpoints may return 429 when rate limit is exceeded
    if (response.status === 429) {
      nasaLogger.warn(`NASA Mars Rover API rate limit exceeded`);
      throw new AppError(
        `NASA API rate limit exceeded`,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'NASA API rate limit exceeded. Please try again later.'
      );
    }

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error: ${response.status}`);
      throw new AppError(
        `NASA Mars Rover API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch Mars Rover photo'
      );
    }

    const data = await response.json();

    // In case NASA API returns a 200 with an error object
    if (data.error) {
      if (data.error.code === 'OVER_RATE_LIMIT') {
        throw new AppError(
          `NASA API rate limit exceeded`,
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          429,
          'NASA API rate limit exceeded. Please try again later.'
        );
      }
      throw new AppError(
        `NASA API Error: ${data.error.message || 'Unknown error'}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch Mars Rover photo'
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars Rover photo',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
