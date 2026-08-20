import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema } from '@/lib/validation';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

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

    // Check rate limit per IP to prevent DoS
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'global';
    const ipRateLimitResult = ipRateLimiter.check(ip);

    if (!ipRateLimitResult.success) {
      nasaLogger.warn(`IP Rate limit exceeded for APOD API: ${ip}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    // Check global NASA API key rate limit
    const nasaRateLimitResult = nasaRateLimiter.check();

    if (!nasaRateLimitResult.success) {
      nasaLogger.warn('Global NASA API Rate limit exceeded');
      throw new AppError(
        'Service temporarily unavailable',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        503,
        'Service is experiencing high traffic. Please try again later.'
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
