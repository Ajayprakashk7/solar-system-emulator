import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { fetchNasaResource } from '@/lib/nasa-fetch';

const CACHE_DURATION = 24 * 60 * 60; // APOD changes once per day.
const APOD_ENDPOINT = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/';

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

    // NASA migrated APOD to its Science WordPress endpoint in September 2026.
    // Keep our route as the stable application boundary so the client does not
    // depend on NASA's response location or expose the API key.
    const url = new URL(APOD_ENDPOINT);
    url.searchParams.set('api_key', env.NASA_API_KEY);
    if (date) url.searchParams.set('date', date);

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
      nasaLogger.warn(`NASA APOD API error: ${response.status}`);
      throw new AppError(
        `NASA APOD API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch Astronomy Picture of the Day'
      );
    }

    const data = await response.json();

    // The current API's `url` is the article permalink. Preserve the familiar
    // APOD shape for callers by exposing the image as `url` when an HD image is
    // available and keep the NASA page separately as `permalink`.
    const normalized = {
      date: data.date,
      title: data.title,
      explanation: data.explanation,
      media_type: data.media_type,
      url: data.hdurl || data.url,
      hdurl: data.hdurl || null,
      permalink: data.permalink || data.url || null,
      copyright: data.copyright || null,
      credit: data.credit || data.copyright || 'NASA',
      alt: data.alt || data.title || 'NASA Astronomy Picture of the Day',
      post_id: data.post_id,
    };

    nasaLogger.debug('Successfully fetched APOD data');

    return NextResponse.json(normalized, {
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
