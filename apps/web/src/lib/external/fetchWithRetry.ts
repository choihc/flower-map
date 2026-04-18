export interface FetchWithRetryOptions {
  retries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 300;
const DEFAULT_BACKOFF_FACTOR = 4;
const DEFAULT_TIMEOUT_MS = 15_000;

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'EPIPE',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
]);

function getErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const direct = (err as { code?: unknown }).code;
  if (typeof direct === 'string') return direct;
  const cause = (err as { cause?: unknown }).cause;
  if (cause && typeof cause === 'object') {
    const code = (cause as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

function isRetryableError(err: unknown): boolean {
  const code = getErrorCode(err);
  if (code && RETRYABLE_ERROR_CODES.has(code)) return true;
  if (err instanceof TypeError && err.message === 'fetch failed') return true;
  return false;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const initialDelayMs = options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const backoffFactor = options.backoffFactor ?? DEFAULT_BACKOFF_FACTOR;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok && RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
        lastError = new Error(`HTTP ${response.status}`);
        await sleep(initialDelayMs * backoffFactor ** attempt);
        continue;
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt >= retries || !isRetryableError(err)) {
        throw err;
      }
      await sleep(initialDelayMs * backoffFactor ** attempt);
    }
  }
  throw lastError ?? new Error('fetchWithRetry exhausted retries');
}
