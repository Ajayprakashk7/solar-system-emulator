import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { fetchNasaResource } from '@/lib/nasa-fetch';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds
const MAX_DATE_RANGE_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || startDate;

    const startValidation = dateSchema.safeParse(startDate);
    if (!startValidation.success) {
      throw new AppError(
        `Invalid start_date: ${startDate}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide start_date in YYYY-MM-DD format'
      );
    }

    const endValidation = dateSchema.safeParse(endDate);
    if (!endValidation.success) {
      throw new AppError(
        `Invalid end_date: ${endDate}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide end_date in YYYY-MM-DD format'
      );
    }

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    if (start > end) {
      throw new AppError(
        'start_date must be before end_date',
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Start date must be before or equal to end date'
      );
    }

    const rangeDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    if (rangeDays > MAX_DATE_RANGE_DAYS) {
      throw new AppError(
        `NEO date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        `Please request at most ${MAX_DATE_RANGE_DAYS} days at a time`
      );
    }

    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded (${rateLimitResult.scope}) for NEO feed`);
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug(`Fetching NEO data: ${startDate} to ${endDate}`);

    const apiKey = env.NASA_API_KEY;
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&api_key=${apiKey}`;

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
      nasaLogger.warn(`NASA NEO API error: ${response.status}`);
      throw new AppError(
        `NASA NEO API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch Near-Earth Objects data'
      );
    }

    const data = await response.json();
    nasaLogger.debug(`Successfully fetched ${data.element_count || 0} NEO objects`);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'NEO_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch NEO data',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
