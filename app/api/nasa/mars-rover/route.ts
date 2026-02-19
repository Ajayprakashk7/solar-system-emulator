import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { roverNameSchema, solSchema } from '@/lib/validation';
import { nasaRateLimiter } from '@/lib/rate-limiter';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rover = searchParams.get('rover') || 'curiosity';
    const sol = searchParams.get('sol');

    // Validate rover name
    const roverValidation = roverNameSchema.safeParse(rover);
    if (!roverValidation.success) {
      throw new AppError(
        `Invalid rover name: ${rover}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid rover name (curiosity, opportunity, spirit, or perseverance)'
      );
    }
    const validatedRover = roverValidation.data;

    // Validate sol if provided
    let validatedSol: number | undefined;
    if (sol !== null) {
      const solNumber = parseInt(sol, 10);
      const solValidation = solSchema.safeParse(solNumber);
      if (!solValidation.success) {
        throw new AppError(
          `Invalid sol: ${sol}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Please provide a valid sol (integer >= 0)'
        );
      }
      validatedSol = solValidation.data;
    }

    // Check rate limit
    const rateLimitResult = nasaRateLimiter.check('mars-rover');
    if (!rateLimitResult.success) {
      nasaLogger.warn(`Rate limit exceeded for Mars Rover API: ${validatedRover}`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }

    nasaLogger.debug(`Fetching Mars rover photos for ${validatedRover}${validatedSol !== undefined ? ` at sol ${validatedSol}` : ' (latest)'}`);

    const apiKey = env.NASA_API_KEY;
    const endpoint = validatedSol !== undefined ? 'photos' : 'latest_photos';
    const solParam = validatedSol !== undefined ? `&sol=${validatedSol}` : '';
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${validatedRover}/${endpoint}?api_key=${apiKey}${solParam}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
      },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Mars Rover API error for ${validatedRover}: ${response.status}`);
      throw new AppError(
        `NASA Mars Rover API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        response.status,
        'Failed to fetch Mars rover photos'
      );
    }

    const data = await response.json();

    nasaLogger.debug(`Successfully fetched Mars rover photos for ${validatedRover}`);

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
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch Mars rover photos',
        code: appError.code
      },
      { status: appError.statusCode }
    );
  }
}
