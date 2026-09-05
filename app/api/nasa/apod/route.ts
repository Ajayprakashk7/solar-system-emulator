import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    // Validate date if provided
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
    }

    // IP Rate Limit check (evaluate IP first to prevent global quota exhaustion)
    const ipHeader = request.headers.get('x-forwarded-for');
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : 'global';

    const ipRateLimitResult = ipRateLimiter.check(ip);
    if (!ipRateLimitResult.success) {
      nasaLogger.warn(`IP rate limit exceeded for APOD API: ${ip}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests from your IP. Please try again later.'
      );
    }

    // Global Rate Limit check
    const globalRateLimitResult = nasaRateLimiter.check();
    if (!globalRateLimitResult.success) {
      nasaLogger.warn(`Global rate limit exceeded for APOD API`);
      throw new AppError(
        'Global rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Service is currently busy. Please try again later.'
      );
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
      throw new AppError(
        `NASA APOD API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Astronomy Picture of the Day'
      );
    }
    
    const data = await response.json();
    
    nasaLogger.debug('Successfully fetched APOD data');
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
        'X-RateLimit-Limit': globalRateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': globalRateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': globalRateLimitResult.reset.toISOString(),
      },
    });
  } catch (error) {
    const appError = handleError(error, 'APOD_API');
    return NextResponse.json(
      { 
        error: appError.userMessage || 'Failed to fetch APOD data',
        code: appError.code 
      },
      { status: appError.statusCode }
    );
  }
}
