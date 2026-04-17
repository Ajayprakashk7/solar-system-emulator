import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { nasaLogger } from '@/lib/logger';
import { nasaRateLimiter } from '@/lib/rate-limiter';

import { roverNameSchema, solSchema, dateSchema, validateInput } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rover = searchParams.get('rover') || 'curiosity';
    const sol = searchParams.get('sol');
    const earthDate = searchParams.get('earth_date');

    // Validate rover name
    const roverValidation = validateInput(roverNameSchema, rover);
    if (!roverValidation.success) {
      return NextResponse.json({ error: roverValidation.error || 'Invalid rover name' }, { status: 400 });
    }

    // Rate Limiting check
    const rateLimit = nasaRateLimiter.check('nasa_mars_rover');
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded for NASA API' }, { status: 429 });
    }

    let url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverValidation.data}`;

    if (sol) {
      const solValidation = validateInput(solSchema, parseInt(sol));
      if (!solValidation.success) {
        return NextResponse.json({ error: solValidation.error || 'Invalid sol' }, { status: 400 });
      }
      url += `/photos?sol=${solValidation.data}&api_key=${env.NASA_API_KEY}`;
    } else if (earthDate) {
      const dateValidation = validateInput(dateSchema, earthDate);
      if (!dateValidation.success) {
        return NextResponse.json({ error: dateValidation.error || 'Invalid date' }, { status: 400 });
      }
      url += `/photos?earth_date=${dateValidation.data}&api_key=${env.NASA_API_KEY}`;
    } else {
      url += `/latest_photos?api_key=${env.NASA_API_KEY}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 43200 }, // Cache for 12 hours
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      nasaLogger.error(`NASA Mars Rover API Error (${response.status}):`, errorData);
      return NextResponse.json({ error: 'Failed to fetch from NASA Mars Rover API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    nasaLogger.error('Unhandled error in Mars Rover API route', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
