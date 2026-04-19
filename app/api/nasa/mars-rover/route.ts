import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { roverNameSchema, solSchema, dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rover = searchParams.get('rover') || 'curiosity';
    const sol = searchParams.get('sol');
    const earthDate = searchParams.get('earth_date');

    // Validate parameters
    const roverValidation = roverNameSchema.safeParse(rover);
    if (!roverValidation.success) {
      throw new AppError(
        `Invalid rover name: ${rover}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Invalid rover name. Valid options are: curiosity, opportunity, spirit, perseverance'
      );
    }

    let queryParams = '';

    if (sol) {
      const solNum = parseInt(sol, 10);
      const solValidation = solSchema.safeParse(solNum);
      if (!solValidation.success) {
        throw new AppError(
          `Invalid sol value: ${sol}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'Sol must be a valid integer'
        );
      }
      queryParams = `sol=${solNum}`;
    } else if (earthDate) {
      const dateValidation = dateSchema.safeParse(earthDate);
      if (!dateValidation.success) {
        throw new AppError(
          `Invalid earth_date value: ${earthDate}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          'earth_date must be in YYYY-MM-DD format'
        );
      }
      queryParams = `earth_date=${earthDate}`;
    }

    const apiKey = env.NASA_API_KEY;
    let url = '';

    if (queryParams) {
      url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?${queryParams}&api_key=${apiKey}`;
    } else {
      url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${apiKey}`;
    }

    nasaLogger.debug(`Fetching Mars rover photos from ${url.replace(apiKey, 'HIDDEN')}`);

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

    nasaLogger.debug('Successfully fetched Mars Rover photos');

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
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
