import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { solSchema, roverNameSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check('mars-rover');

    if (!rateLimitResult.success) {
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const roverRaw = searchParams.get('rover') || 'curiosity';
    const solRaw = searchParams.get('sol') || '1000';

    // Validate rover name
    const roverValidation = roverNameSchema.safeParse(roverRaw.toLowerCase());
    if (!roverValidation.success) {
      throw new AppError(
        `Invalid rover name: ${roverRaw}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid rover name (curiosity, opportunity, spirit, perseverance)'
      );
    }
    const rover = roverValidation.data;

    // Validate sol
    const solNumber = parseInt(solRaw, 10);
    const solValidation = solSchema.safeParse(solNumber);
    if (!solValidation.success) {
      throw new AppError(
        `Invalid sol: ${solRaw}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid sol number'
      );
    }
    const sol = solValidation.data;

    nasaLogger.debug(`Fetching Mars rover photos for rover: ${rover}, sol: ${sol}`);

    const apiKey = env.NASA_API_KEY;
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error: ${response.status}`);
      throw new AppError(
        `NASA Mars Rover API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Mars Rover photos'
      );
    }

    const data = await response.json();

    nasaLogger.debug(`Successfully fetched Mars rover data (${data.photos?.length || 0} photos)`);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');

    let rateLimitResult;
    try {
      rateLimitResult = nasaRateLimiter.check('mars-rover-error');
    } catch(e) {}

    const responseInit: ResponseInit = { status: appError.statusCode };
    if (appError.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
      responseInit.headers = {
        'Retry-After': '3600',
      };
    } else if (rateLimitResult && rateLimitResult.success) {
       responseInit.headers = {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
      };
    }

    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars Rover data',
        code: appError.code
      },
      responseInit
    );
  }
}
