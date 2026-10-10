import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { nasaRateLimiter } from '@/lib/rate-limiter';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimitResult = nasaRateLimiter.check(clientIp);

    if (!rateLimitResult.success) {
      throw new AppError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT_EXCEEDED, 429, 'Too many requests. Please try again later.');
    }

    const apiKey = env.NASA_API_KEY;
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=${apiKey}`;

    const response = await fetch(url, { headers: { 'User-Agent': 'Solar-System-Emulator/1.0' } });

    if (!response.ok) {
      throw new AppError(`NASA API returned ${response.status}`, ERROR_CODES.API_ERROR, response.status, 'Failed to fetch rover data');
    }

    const data = await response.json();
    const photos = data?.photos || [];

    if (photos.length > 0) {
      // Pick a random photo
      const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
      return NextResponse.json({ url: randomPhoto.img_src, camera: randomPhoto.camera.full_name, date: randomPhoto.earth_date }, {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimitResult.reset.getTime() / 1000).toString(),
        },
      });
    }

    throw new AppError('No photos found', ERROR_CODES.NOT_FOUND, 404, 'No Mars rover photos found for this query');
  } catch (error) {
    const appError = handleError(error, 'MARS_ROVER_API');
    return NextResponse.json({ error: appError.userMessage || 'Failed to fetch Mars rover data', code: appError.code }, { status: appError.statusCode });
  }
}
