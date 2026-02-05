interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
};

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

function getDelay(attempt: number, base: number, max: number): number {
  const exponential = base * Math.pow(2, attempt);
  const capped = Math.min(exponential, max);
  // Jitter: random between 50%-100% of the capped delay
  return capped * (0.5 + Math.random() * 0.5);
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      if (response.ok || !isRetryable(response.status)) {
        return response;
      }

      // Retryable status — fall through to retry logic
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      // Network error — retryable
      lastError = err;
    }

    if (attempt < maxRetries) {
      const delay = getDelay(attempt, baseDelayMs, maxDelayMs);
      console.warn(
        `[fetchWithRetry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(delay)}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
