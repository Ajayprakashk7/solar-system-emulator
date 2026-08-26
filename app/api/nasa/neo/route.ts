import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { ipRateLimiter, nasaRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || startDate;
    
    // Validate dates
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
    
    // Ensure start_date is before end_date
    if (new Date(startDate) > new Date(endDate)) {
      throw new AppError(
        'start_date must be before end_date',
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Start date must be before or equal to end date'
      );
    }

    // Rate limiting: IP first, then global
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!ipRateLimiter.check(clientIp).success || !nasaRateLimiter.check().success) {
      nasaLogger.warn(`Rate limit exceeded for NEO API (IP: ${clientIp})`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
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
      throw new AppError(
        `NASA NEO API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Near-Earth Objects data'
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
    const appError = handleError(error, 'NEO_API');
    return NextResponse.json(
      { 
        error: appError.userMessage || 'Failed to fetch NEO data',
        code: appError.code 
      },
      { status: appError.statusCode }
    );
  }
}
