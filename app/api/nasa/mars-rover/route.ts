import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { roverNameSchema, solSchema, dateSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds

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
        roverValidation.error.errors[0]?.message || 'Invalid rover name'
      );
    }
    const rover = roverValidation.data;

    let dateParam = '';
    let endpoint = `/rovers/${rover}/photos`;

    // Validate and process date parameters
    if (solRaw) {
      const solNumber = parseInt(solRaw, 10);
      const solValidation = solSchema.safeParse(solNumber);
      if (!solValidation.success) {
        throw new AppError(
          `Invalid sol format: ${solRaw}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          solValidation.error.errors[0]?.message || 'Invalid sol format'
        );
      }
      dateParam = `sol=${solValidation.data}`;
    } else if (earthDateRaw) {
      const dateValidation = dateSchema.safeParse(earthDateRaw);
      if (!dateValidation.success) {
        throw new AppError(
          `Invalid earth_date format: ${earthDateRaw}`,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          dateValidation.error.errors[0]?.message || 'Please provide date in YYYY-MM-DD format'
        );
      }
      dateParam = `earth_date=${dateValidation.data}`;
    } else {
       // Fallback to latest_photos if no date/sol provided
       endpoint = `/rovers/${rover}/latest_photos`;
    }

    nasaLogger.debug(`Fetching Mars Rover photo for ${rover}${dateParam ? ` with ${dateParam}` : ' (latest)'}`);

    const apiKey = env.NASA_API_KEY;
    const queryStr = dateParam ? `?${dateParam}&api_key=${apiKey}` : `?api_key=${apiKey}`;
    const url = `https://api.nasa.gov/mars-photos/api/v1${endpoint}${queryStr}`;

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

    nasaLogger.debug('Successfully fetched Mars Rover data');

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
