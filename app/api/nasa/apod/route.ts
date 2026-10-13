import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (date) {
      const validationResult = dateSchema.safeParse(date);
      if (!validationResult.success) {
        throw new AppError(
          `Invalid date format: ${date}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Please provide date in YYYY-MM-DD format'
        );
      }

      const requestedDate = new Date(`${date}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(23, 59, 59, 999);
      if (requestedDate > today) {
        throw new AppError(
          `APOD date cannot be in the future: ${date}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Astronomy Picture of the Day is only available for today or earlier'
        );
      }
    }

    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded (${rateLimitResult.scope}) for APOD`);
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug(`Fetching APOD${date ? ` for date: ${date}` : ''}`);

    const apiKey = env.NASA_API_KEY;
    const dateParam = date ? `&date=${encodeURIComponent(date)}` : '';
    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}${dateParam}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA APOD API error: ${response.status}`);
      throw new AppError(
        `NASA APOD API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch Astronomy Picture of the Day'
      );
    }

    const data = await response.json();
    nasaLogger.debug('Successfully fetched APOD data');

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'APOD_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch APOD data',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
