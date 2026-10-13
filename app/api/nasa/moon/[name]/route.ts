import { NextRequest, NextResponse } from 'next/server';
import { nasaLogger } from '@/lib/logger';
import { checkNasaRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';
import { moonNameSchema } from '@/lib/validation';
import { handleError, AppError, ERROR_CODES } from '@/lib/error-handler';
import { fetchNasaResource } from '@/lib/nasa-fetch';

const CACHE_DURATION = 7 * 24 * 60 * 60;

const MISSION_TERMS: Record<string, string[]> = {
  Moon: ['apollo', 'lro', 'lunar reconnaissance orbiter'],
  Phobos: ['mars reconnaissance orbiter', 'mro', 'viking'],
  Deimos: ['mars reconnaissance orbiter', 'mro', 'viking'],
  Io: ['galileo', 'voyager', 'juno'],
  Europa: ['galileo', 'voyager', 'juno'],
  Ganymede: ['galileo', 'voyager', 'juno'],
  Callisto: ['galileo', 'voyager'],
  Mimas: ['cassini', 'voyager'],
  Enceladus: ['cassini'],
  Tethys: ['cassini', 'voyager'],
  Dione: ['cassini', 'voyager'],
  Rhea: ['cassini', 'voyager'],
  Titan: ['cassini', 'huygens', 'voyager'],
  Iapetus: ['cassini', 'voyager'],
  Miranda: ['voyager 2', 'voyager'],
  Ariel: ['voyager 2', 'voyager'],
  Umbriel: ['voyager 2', 'voyager'],
  Titania: ['voyager 2', 'voyager'],
  Oberon: ['voyager 2', 'voyager'],
  Triton: ['voyager 2', 'voyager'],
  Proteus: ['voyager 2', 'voyager'],
};

const AVOID_TERMS = [
  'artist concept',
  "artist's concept",
  'illustration',
  'rendering',
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
  links?: Array<{ href?: string; render?: string }>;
}

const itemText = (item: NasaImageItem) => {
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
};

const scoreMoonImage = (item: NasaImageItem, moonName: string) => {
  const text = itemText(item);
  const title = item.data?.[0]?.title?.toLowerCase() || '';
  const target = moonName.toLowerCase();
  let score = 0;

  if (title.includes(target)) score += 100;
  else if (text.includes(target)) score += 45;

  for (const term of MISSION_TERMS[moonName] || []) {
    if (title.includes(term)) score += 26;
    else if (text.includes(term)) score += 12;
  }

  if (/full[ -]?disk|global|natural color|true color|close-up|mosaic/.test(text)) score += 18;

  for (const term of AVOID_TERMS) {
    if (text.includes(term)) score -= 120;
  }

  if (item.data?.[0]?.nasa_id) score += 5;
  return score;
};

const normalizeImage = (item: NasaImageItem) => {
  const data = item.data?.[0] || {};
  const url = item.links?.find((link) => link.render === 'image' && link.href)?.href;
  if (!url) return null;

  return {
    url,
    title: data.title,
    description: data.description || data.description_508 || '',
    caption: data.description || data.description_508 || '',
    dateCreated: data.date_created,
    photographer: data.photographer || data.secondary_creator || data.center || 'NASA',
    nasaId: data.nasa_id || null,
    center: data.center || null,
    source: 'NASA Image and Video Library',
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const validationResult = moonNameSchema.safeParse(name);
    if (!validationResult.success) {
      throw new AppError(
        `Invalid moon name: ${name}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        'Please provide a valid moon name'
      );
    }

    const validatedName = validationResult.data;
    const rateLimitResult = checkNasaRateLimit(request.headers);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      nasaLogger.warn(
        `Rate limit exceeded (${rateLimitResult.scope}) for moon: ${validatedName}`
      );
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    nasaLogger.debug(`Fetching ranked moon imagery for: ${validatedName}`);

    const missionHint = (MISSION_TERMS[validatedName] || [])[0] || '';
    const query = [validatedName, 'moon', missionHint].filter(Boolean).join(' ');
    const url = new URL('https://images-api.nasa.gov/search');
    url.searchParams.set('q', query);
    url.searchParams.set('media_type', 'image');
    url.searchParams.set('page_size', '50');

    // No year cutoff: Voyager-era imagery is still the best close-range record
    // for several moons of Uranus and Neptune.
    const response = await fetchNasaResource(
      url,
      {
        headers: {
          'User-Agent': 'Solar-System-Emulator/1.0',
          Accept: 'application/json',
        },
        next: { revalidate: CACHE_DURATION },
      },
      { timeoutMs: 8_000, retries: 1 }
    );

    if (!response.ok) {
      nasaLogger.warn(`NASA Images API error for moon ${validatedName}: ${response.status}`);
      throw new AppError(
        `NASA Images API returned ${response.status}`,
        ERROR_CODES.API_ERROR,
        502,
        'Failed to fetch moon imagery from NASA'
      );
    }

    const data = await response.json();
    const items = (data?.collection?.items || []) as NasaImageItem[];
    const validImages = items.filter((item) => {
      const imageLink = item.links?.find((link) => link.render === 'image' && link.href)?.href;
      return Boolean(item.data?.[0]?.title && imageLink);
    });

    if (validImages.length === 0) {
      nasaLogger.warn(`No images found for moon ${validatedName}`);
      throw new AppError(
        `No images found for ${validatedName}`,
        ERROR_CODES.NOT_FOUND,
        404,
        'No NASA imagery found for this moon'
      );
    }

    const ranked = validImages
      .map((item) => ({ item, score: scoreMoonImage(item, validatedName) }))
      .sort((a, b) => b.score - a.score);

    const gallery = ranked
      .slice(0, 5)
      .map(({ item }) => normalizeImage(item))
      .filter((item): item is NonNullable<ReturnType<typeof normalizeImage>> => Boolean(item));

    const topImage = gallery[0];
    if (!topImage) {
      throw new AppError(
        `NASA image record for ${validatedName} had no usable image URL`,
        ERROR_CODES.NOT_FOUND,
        404,
        'No usable NASA image was available for this moon'
      );
    }

    const result = {
      ...topImage,
      gallery,
    };

    nasaLogger.debug(
      `Selected NASA moon image for ${validatedName} with ranking score ${ranked[0].score}`
    );

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        ...rateLimitHeaders,
      },
    });
  } catch (error) {
    const appError = handleError(error, 'MOON_API');
    return NextResponse.json(
      {
        error: appError.userMessage || 'Failed to fetch moon data',
        code: appError.code,
      },
      { status: appError.statusCode }
    );
  }
}
