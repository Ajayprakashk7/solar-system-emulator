import { NextRequest, NextResponse } from 'next/server';
import { EDUCATIONAL_CONTENT } from '@/lib/educational-content';
import { nasaLogger } from '@/lib/logger';
import { bodyNameSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { nasaRateLimiter, ipRateLimiter } from '@/lib/rate-limiter';

const CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days - educational content rarely changes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ body: string }> }
) {
  try {
    const ipHeader = request.headers.get('x-forwarded-for');
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : 'global';

    if (!ipRateLimiter.check(ip).success || !nasaRateLimiter.check().success) {
      nasaLogger.warn(`Rate limit exceeded for Educational (IP: ${ip})`);
      throw new AppError(
        'Rate limit exceeded',
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        429,
        'Too many requests. Please try again later.'
      );
    }
    const { body } = await params;
    
    // Validate input
    const validationResult = bodyNameSchema.safeParse(body);
    if (!validationResult.success) {
      throw new AppError(
        `Invalid body name: ${body}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid celestial body name'
      );
    }
    
    const validatedBody = validationResult.data;
    nasaLogger.debug(`Fetching educational content for: ${validatedBody}`);
    
    const content = EDUCATIONAL_CONTENT[validatedBody];
    
    if (!content) {
      nasaLogger.warn(`No educational content found for ${validatedBody}`);
      throw new AppError(
        `No content found for ${validatedBody}`,
        ERROR_CODES.NOT_FOUND,
        404,
        'Educational content not found for this celestial body'
      );
    }
    
    nasaLogger.debug(`Successfully fetched educational content for ${validatedBody}`);
    
    return NextResponse.json(content, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'EDUCATIONAL_API');
    return NextResponse.json(
      { 
        error: appError.userMessage || 'Failed to fetch educational content',
        code: appError.code 
      },
      { status: appError.statusCode }
    );
  }
}
