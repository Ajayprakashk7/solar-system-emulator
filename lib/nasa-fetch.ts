import { AppError, ERROR_CODES } from '@/lib/error-handler';

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRIES = 1;
const BASE_RETRY_DELAY_MS = 250;
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

type NasaFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const retryDelayFor = (response: Response | null, attempt: number, baseDelay: number) => {
  const retryAfter = response?.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1_000, 2_000);
    }
  }

  return Math.min(baseDelay * 2 ** attempt, 1_500);
};

/**
 * Fetch a NASA resource with a hard timeout and one conservative retry for
 * transient upstream failures. Next.js cache/revalidation options are preserved
 * through the supplied fetch init object.
 */
export async function fetchNasaResource(
  input: string | URL,
  init: FetchInit = {},
  options: NasaFetchOptions = {}
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? BASE_RETRY_DELAY_MS;
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      lastResponse = response;
      if (!TRANSIENT_STATUSES.has(response.status) || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    } finally {
      clearTimeout(timeout);
    }

    await sleep(retryDelayFor(lastResponse, attempt, retryDelayMs));
  }

  const message =
    lastError instanceof Error ? lastError.message : 'NASA upstream request failed';

  throw new AppError(
    `NASA upstream request failed: ${message}`,
    ERROR_CODES.API_ERROR,
    502,
    'NASA data is temporarily unavailable. Please try again shortly.'
  );
}
