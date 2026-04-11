import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { nasaRateLimiter } from '@/lib/rate-limiter';
import { roverNameSchema, solSchema, dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { env } from '@/lib/env';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roverRaw = searchParams.get('rover') || 'curiosity';
    const solRaw = searchParams.get('sol');
    const earthDateRaw = searchParams.get('earth_date');

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

    let queryParams = '';

    if (solRaw) {
      const solValidation = solSchema.safeParse(parseInt(solRaw, 10));
      if (!solValidation.success) {
         throw new AppError(
          `Invalid sol: ${solRaw}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Sol must be a non-negative integer'
        );
      }
      queryParams = `sol=${solValidation.data}`;
    } else if (earthDateRaw) {
      const dateValidation = dateSchema.safeParse(earthDateRaw);
      if (!dateValidation.success) {
         throw new AppError(
          `Invalid earth date: ${earthDateRaw}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Date must be in YYYY-MM-DD format'
        );
      }
      queryParams = `earth_date=${dateValidation.data}`;
    } else {
      // Default to the latest photos endpoint if no date/sol provided
      queryParams = 'latest';
    }

    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check();
    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for mars rover: ${rover}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    nasaLogger.debug(`Fetching mars rover photos for: ${rover} with params: ${queryParams}`);

    const apiKey = env.NASA_API_KEY;
    const baseUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}`;
    const url = queryParams === 'latest'
      ? `${baseUrl}/latest_photos?api_key=${apiKey}`
      : `${baseUrl}/photos?${queryParams}&api_key=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error for ${rover}: ${response.status}`);
      throw new AppError(
        `NASA API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Mars rover data from NASA'
      );
    }

    const data = await response.json();

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
        error: appError.userMessage || 'Failed to fetch Mars rover data',
        code: appError.code
      },
      { status: appError.statusCode }
    );
  }
}
