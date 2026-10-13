import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { planetNameSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';

const CACHE_DURATION = 7 * 24 * 60 * 60; // Library imagery is stable; cache for a week.

const IMAGE_PROFILES: Record<
  string,
  { query: string; preferredTerms: string[]; avoidTerms?: string[] }
> = {
  sun: {
    query: 'Sun Solar Dynamics Observatory SDO',
    preferredTerms: ['solar dynamics observatory', 'sdo', 'sun', 'solar'],
  },
  mercury: {
    query: 'Mercury MESSENGER planet',
    preferredTerms: ['messenger', 'mercury', 'global', 'planet'],
  },
  venus: {
    query: 'Venus Magellan planet',
    preferredTerms: ['magellan', 'venus', 'global', 'planet'],
  },
  earth: {
    query: 'Earth planet Blue Marble DSCOVR',
    preferredTerms: ['earth', 'blue marble', 'dscovr', 'epic', 'full disk'],
  },
  mars: {
    query: 'Mars planet global Viking MRO',
    preferredTerms: ['mars', 'global', 'viking', 'mro', 'mars reconnaissance orbiter'],
  },
  jupiter: {
    query: 'Jupiter Juno planet',
    preferredTerms: ['jupiter', 'juno', 'voyager', 'full disk'],
  },
  saturn: {
    query: 'Saturn Cassini planet',
    preferredTerms: ['saturn', 'cassini', 'voyager', 'full disk'],
  },
  uranus: {
    query: 'Uranus Voyager 2 planet',
    preferredTerms: ['uranus', 'voyager 2', 'voyager', 'full disk'],
  },
  neptune: {
    query: 'Neptune Voyager 2 planet',
    preferredTerms: ['neptune', 'voyager 2', 'voyager', 'full disk'],
  },
};

const GENERIC_AVOID_TERMS = [
  'artist concept',
  "artist's concept",
  'artistic concept',
  'illustration',
  'conceptual',
  'rendering',
  'computer generated',
  'simulation',
  'diagram',
  'poster',
  'infographic',
  'animation',
];

interface NasaImageItem {
  data?: Array<{
    title?: string;
    description?: string;
    description_508?: string;
    date_created?: string;
    photographer?: string;
    secondary_creator?: string;
    nasa_id?: string;
    center?: string;
    keywords?: string[];
  }>;
  links?: Array<{
    href?: string;
    rel?: string;
    render?: string;
  }>;
}

function textForItem(item: NasaImageItem) {
  const data = item.data?.[0];
  return [
    data?.title,
    data?.description,
    data?.description_508,
    data?.center,
    ...(data?.keywords || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreImage(item: NasaImageItem, planet: string, preferredTerms: string[]) {
  const text = textForItem(item);
  const title = item.data?.[0]?.title?.toLowerCase() || '';
  let score = 0;

  // The target body must be prominent, not merely mentioned in a long caption.
  if (title.includes(planet)) score += 100;
  else if (text.includes(planet)) score += 40;

  for (const term of preferredTerms) {
    if (title.includes(term)) score += 28;
    else if (text.includes(term)) score += 12;
  }

  if (/full[ -]?disk|global|natural color|true color|portrait/.test(text)) score += 22;
  if (/voyager|cassini|juno|messenger|magellan|viking|dscovr|epic|sdo/.test(text)) score += 16;

  for (const term of GENERIC_AVOID_TERMS) {
    if (text.includes(term)) score -= 120;
  }

  // Prefer actual image render links and records with stable NASA IDs.
  const imageLink = item.links?.find((link) => link.render === 'image' && link.href)?.href;
  if (imageLink) score += 12;
  if (item.data?.[0]?.nasa_id) score += 5;

  return score;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const validationResult = planetNameSchema.safeParse(name);
    if (!validationResult.success) {
      throw new AppError(
        `Invalid planet name: ${name}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid planet name'
      );
    }

    const validatedName = validationResult.data;
    const profile = IMAGE_PROFILES[validatedName];
    if (!profile) {
      throw new AppError(
        `Unsupported planet name: ${validatedName}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a Solar System planet or the Sun'
      );
    }

    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(
        `Rate limit exceeded (${rateLimitResult.scope}) for planet: ${validatedName}`
      );
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug(`Fetching ranked NASA imagery for: ${validatedName}`);

    // Do not impose a recent-year cutoff. For Uranus and Neptune in particular,
    // Voyager 2 remains the source of the best close-range spacecraft imagery.
    const url = new URL('https://images-api.nasa.gov/search');
    url.searchParams.set('q', profile.query);
    url.searchParams.set('media_type', 'image');
    url.searchParams.set('page_size', '50');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Solar-System-Emulator/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      nasaLogger.warn(`NASA Images API error for ${validatedName}: ${response.status}`);
      throw new AppError(
        `NASA Images API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch planet imagery from NASA'
      );
    }

    const data = await response.json();
    const items = (data?.collection?.items || []) as NasaImageItem[];
    const validImages = items.filter((item) => {
      const itemData = item.data?.[0];
      const imageLink = item.links?.find((link) => link.render === 'image' && link.href)?.href;
      return Boolean(itemData?.title && imageLink);
    });

    if (validImages.length === 0) {
      nasaLogger.warn(`No NASA images found for ${validatedName}`);
      throw new AppError(
        `No images found for ${validatedName}`,
        ERROR_CODES.NOT_FOUND,
        404,
        'No NASA imagery found for this planet'
      );
    }

    const rankedImages = validImages
      .map((item) => ({
        item,
        score: scoreImage(item, validatedName, profile.preferredTerms),
      }))
      .sort((a, b) => b.score - a.score);

    const topImage = rankedImages[0].item;
    const topData = topImage.data?.[0] || {};
    const imageUrl = topImage.links?.find(
      (link) => link.render === 'image' && link.href
    )?.href;

    if (!imageUrl) {
      throw new AppError(
        `NASA image record for ${validatedName} had no usable image URL`,
        ERROR_CODES.NOT_FOUND,
        404,
        'No usable NASA image was available for this planet'
      );
    }

    const result = {
      url: imageUrl,
      title: topData.title,
      description: topData.description || topData.description_508 || '',
      dateCreated: topData.date_created,
      photographer: topData.photographer || topData.secondary_creator || topData.center || 'NASA',
      nasaId: topData.nasa_id || null,
      center: topData.center || null,
      source: 'NASA Image and Video Library',
    };

    nasaLogger.debug(
      `Selected NASA image for ${validatedName} with ranking score ${rankedImages[0].score}`
    );

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'PLANET_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch planet data',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
