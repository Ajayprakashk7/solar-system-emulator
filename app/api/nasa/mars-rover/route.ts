import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { nasaRateLimiter } from '@/lib/rate-limiter';
import { env } from '@/lib/env';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'global';

    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check(clientIp);

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for mars-rover API: ${clientIp}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    nasaLogger.debug(`Fetching Mars rover photo for: ${clientIp}`);

    const apiKey = env.NASA_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const sol = searchParams.get('sol') || '1000';
    const camera = searchParams.get('camera');

    let url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${apiKey}`;
    if (camera) {
        url += `&camera=${camera}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error: ${response.status}`);
      throw new AppError(
        `NASA API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Mars rover data from NASA'
      );
    }

    const data = await response.json();

    nasaLogger.debug(`Successfully fetched Mars rover data`);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimitResult.reset.getTime() / 1000).toString(),
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars rover data',
        code: appError.code
      },
      { status: appError.statusCode }
    );
  }
}
