import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema } from '@/lib/validation';
import { ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function GET(request: NextRequest) {
  try {
    // 1. IP-based Rate Limiting (DoS protection)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ipResult = ipRateLimiter.check(ip);
    if (!ipResult.success) {
      return NextResponse.json(
        { error: 'Too many requests from this IP. Please try again later.', code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }

    // 2. Global NASA API Rate Limiting (Quota exhaustion protection)
    const globalResult = nasaRateLimiter.check();
    if (!globalResult.success) {
      return NextResponse.json(
        { error: 'NASA API quota exceeded. Please try again later.', code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || startDate;
    
    // Validate dates
    const startValidation = dateSchema.safeParse(startDate);
    if (!startValidation.success) {
      return NextResponse.json(
        { error: 'Please provide start_date in YYYY-MM-DD format', code: ERROR_CODES.VALIDATION_ERROR },
        { status: 400 }
      );
    }
    
    const endValidation = dateSchema.safeParse(endDate);
    if (!endValidation.success) {
      return NextResponse.json(
        { error: 'Please provide end_date in YYYY-MM-DD format', code: ERROR_CODES.VALIDATION_ERROR },
        { status: 400 }
      );
    }
    
    // Ensure start_date is before end_date
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date', code: ERROR_CODES.VALIDATION_ERROR },
        { status: 400 }
      );
    }
    nasaLogger.debug(`Fetching NEO data: ${startDate} to ${endDate}`);
    
    const apiKey = env.NASA_API_KEY;
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });
    
    if (!response.ok) {
      nasaLogger.warn(`NASA NEO API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch Near-Earth Objects data', code: ERROR_CODES.API_ERROR },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    nasaLogger.debug(`Successfully fetched ${data.element_count || 0} NEO objects`);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
      },
    });
  } catch (error) {
    logger.error('[NEO_API]', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch NEO data',
        code: ERROR_CODES.UNKNOWN_ERROR
      },
      { status: 500 }
    );
  }
}
