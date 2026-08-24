import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema } from '@/lib/validation';
import { ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

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
    const date = searchParams.get('date');
    
    // Validate date if provided
    if (date) {
      const validationResult = dateSchema.safeParse(date);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Please provide date in YYYY-MM-DD format', code: ERROR_CODES.VALIDATION_ERROR },
          { status: 400 }
        );
      }
    }
    nasaLogger.debug(`Fetching APOD${date ? ` for date: ${date}` : ''}`);
    
    const apiKey = env.NASA_API_KEY;
    const dateParam = date ? `&date=${date}` : '';
    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}${dateParam}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });
    
    if (!response.ok) {
      nasaLogger.warn(`NASA APOD API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch Astronomy Picture of the Day', code: ERROR_CODES.API_ERROR },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    nasaLogger.debug('Successfully fetched APOD data');
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
      },
    });
  } catch (error) {
    logger.error('[APOD_API]', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch APOD data',
        code: ERROR_CODES.UNKNOWN_ERROR
      },
      { status: 500 }
    );
  }
}
