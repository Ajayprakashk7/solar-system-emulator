import { NextResponse } from 'next/server';
import { RateLimiter, nasaRateLimiter } from '@/lib/rate-limiter';

// Instantiate an IP limiter
const ipRateLimiter = new RateLimiter(50, 60 * 60 * 1000);

export async function GET(request: Request) {
  // IP rate limiting
  const ipHeader = request.headers.get('x-forwarded-for');
  const ip = ipHeader ? ipHeader.split(',')[0]?.trim() || 'global' : 'global';

  const ipLimit = ipRateLimiter.check(ip);
  if (!ipLimit.success) {
    return NextResponse.json(
      { error: 'Too Many Requests from this IP' },
      { status: 429, headers: { 'X-RateLimit-Limit': ipLimit.limit.toString(), 'X-RateLimit-Remaining': ipLimit.remaining.toString() } }
    );
  }

  // Global rate limiting
  const globalLimit = nasaRateLimiter.check('global');
  if (!globalLimit.success) {
    return NextResponse.json(
      { error: 'NASA API Global Rate Limit Exceeded' },
      { status: 429, headers: { 'X-RateLimit-Limit': globalLimit.limit.toString(), 'X-RateLimit-Remaining': globalLimit.remaining.toString() } }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_NASA_API_KEY || 'DEMO_KEY';
  const { searchParams } = new URL(request.url);
  const sol = searchParams.get('sol') || '1000';

  try {
    const response = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${apiKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch from NASA Mars Rover API');
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Mars Rover API Route Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Mars Rover data' }, { status: 500 });
  }
}
