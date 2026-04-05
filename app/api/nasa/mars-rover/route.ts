import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { nasaRateLimiter } from '@/lib/rate-limiter';
import { dateSchema, roverNameSchema, solSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roverNameRaw = searchParams.get('rover') || 'perseverance';
    const solRaw = searchParams.get('sol');
    const earthDateRaw = searchParams.get('earth_date');
    const pageRaw = searchParams.get('page') || '1';

    // Validate inputs
    const roverValidation = roverNameSchema.safeParse(roverNameRaw.toLowerCase());
    if (!roverValidation.success) {
      throw new AppError(
        `Invalid rover name: ${roverNameRaw}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid rover name (curiosity, opportunity, spirit, perseverance)'
      );
    }
    const roverName = roverValidation.data;

    let paramsString = '';
    if (solRaw) {
      const solValidation = solSchema.safeParse(parseInt(solRaw, 10));
      if (!solValidation.success) {
        throw new AppError(
          `Invalid sol value: ${solRaw}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Please provide a valid sol number'
        );
      }
      paramsString = `sol=${solValidation.data}&page=${pageRaw}`;
    } else if (earthDateRaw) {
      const dateValidation = dateSchema.safeParse(earthDateRaw);
      if (!dateValidation.success) {
         throw new AppError(
          `Invalid earth_date format: ${earthDateRaw}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Please provide earth_date in YYYY-MM-DD format'
        );
      }
      paramsString = `earth_date=${dateValidation.data}&page=${pageRaw}`;
    } else {
        // Fallback to latest photos endpoint instead of specific sol/date
        paramsString = 'latest';
    }

    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check();

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for mars-rover route`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    nasaLogger.debug(`Fetching Mars rover photo for: ${roverName} with params: ${paramsString}`);

    const apiKey = env.NASA_API_KEY;
    let url = '';
    if (paramsString === 'latest') {
        url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/latest_photos?api_key=${apiKey}`;
    } else {
        url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?${paramsString}&api_key=${apiKey}`;
    }

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
        'Failed to fetch Mars rover photos'
      );
    }

    const data = await response.json();

    nasaLogger.debug('Successfully fetched Mars Rover photos');

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars Rover photos',
        code: appError.code
      },
      { status: appError.statusCode }
    );
  }
}
