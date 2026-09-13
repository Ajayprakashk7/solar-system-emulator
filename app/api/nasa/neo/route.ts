import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function GET(request: NextRequest) {
  try {
    // Determine client IP from headers
    // Vercel/cloud environments often provide x-real-ip
    const realIp = request.headers.get('x-real-ip');
    const forwardedFor = request.headers.get('x-forwarded-for');

    // Safely parse IP, avoiding spoofing vulnerabilities with left-most IPs in x-forwarded-for
    let ip = 'global';
    if (realIp) {
      ip = realIp;
    } else if (forwardedFor) {
      // Vercel appends the real IP to the end of x-forwarded-for, preventing spoofing
      ip = forwardedFor.split(',').pop()?.trim() || 'global';
    }

    // Check IP rate limit first
    const ipRateLimitResult = ipRateLimiter.check(ip);
    if (!ipRateLimitResult.success) {
      nasaLogger.warn(`IP Rate limit exceeded for IP: ${ip}`);

      return NextResponse.json(
        { error: 'Too many requests from this IP. Please try again later.', code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': ipRateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': ipRateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(ipRateLimitResult.reset.getTime() / 1000).toString(),
            'Retry-After': Math.ceil((ipRateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Check global NASA API rate limit
    const globalRateLimitResult = nasaRateLimiter.check();
    if (!globalRateLimitResult.success) {
      nasaLogger.warn('Global NASA API rate limit exceeded');

      return NextResponse.json(
        { error: 'Service is currently experiencing high traffic. Please try again later.', code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': globalRateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': globalRateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(globalRateLimitResult.reset.getTime() / 1000).toString(),
            'Retry-After': Math.ceil((globalRateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
          }
        }
      );
    }

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
        'X-RateLimit-Limit': globalRateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': globalRateLimitResult.remaining.toString(),
        // Convert Date object to unix timestamp string for header compatibility
        'X-RateLimit-Reset': Math.floor(globalRateLimitResult.reset.getTime() / 1000).toString(),
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
