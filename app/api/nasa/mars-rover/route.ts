import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { nasaRateLimiter } from '@/lib/rate-limiter';
import { env } from '@/lib/env';
import { roverNameSchema, solSchema, dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roverName = searchParams.get('rover') || 'curiosity';
    const sol = searchParams.get('sol');
    const earthDate = searchParams.get('earth_date');

    // Validate input
    const roverValidation = roverNameSchema.safeParse(roverName);
    if (!roverValidation.success) {
      throw new AppError(
        `Invalid rover name: ${roverName}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid rover name (curiosity, opportunity, spirit, or perseverance)'
      );
    }
    const validatedRoverName = roverValidation.data;

    let dateParam = '';
    if (sol) {
      const solValidation = solSchema.safeParse(parseInt(sol, 10));
      if (!solValidation.success) {
         throw new AppError(
          `Invalid sol: ${sol}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Please provide a valid sol number'
        );
      }
      dateParam = `&sol=${solValidation.data}`;
    } else if (earthDate) {
      const dateValidation = dateSchema.safeParse(earthDate);
      if (!dateValidation.success) {
         throw new AppError(
          `Invalid earth_date: ${earthDate}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Please provide a valid earth_date'
        );
      }
      dateParam = `&earth_date=${dateValidation.data}`;
    }

    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check();

    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for Mars Rover API`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    const apiKey = env.NASA_API_KEY;
    if (!apiKey) {
      throw new AppError(
        'NASA_API_KEY not configured',
        ERROR_CODES.CONFIG_ERROR,
        500,
        'NASA API Key is missing on the server'
      );
    }

    // Determine URL: use latest_photos endpoint if no specific date is provided
    let url = '';
    if (dateParam) {
        url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${validatedRoverName}/photos?api_key=${apiKey}${dateParam}`;
    } else {
        url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${validatedRoverName}/latest_photos?api_key=${apiKey}`;
    }

    nasaLogger.debug(`Fetching Mars rover photos from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA API error for Mars rover: ${response.status}`);
      throw new AppError(
        `NASA API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Mars rover data from NASA'
      );
    }

    const data = await response.json();

    // The response structure differs slightly between the /photos and /latest_photos endpoints
    const photos = data.photos || data.latest_photos || [];

    return NextResponse.json({ photos }, {
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
