import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithRetry } from '../services/fetchWithRetry';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: object, status = 200, statusText = 'OK'): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('fetchWithRetry', () => {
  it('returns immediately on 200 OK', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const res = await fetchWithRetry('/api/test');
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns immediately on 400 (non-retryable)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'bad request' }, 400, 'Bad Request'));

    const res = await fetchWithRetry('/api/test');
    expect(res.status).toBe(400);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 and succeeds on second attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'server error' }, 500, 'Internal Server Error'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    const res = await fetchWithRetry('/api/test', undefined, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 2,
    });
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 rate limit', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'rate limited' }, 429, 'Too Many Requests'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    const res = await fetchWithRetry('/api/test', undefined, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 2,
    });
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns the error response (with body) after all retries exhausted on 500', async () => {
    const errorBody = { error: 'OPENAI_API_KEY environment variable is not set' };
    mockFetch.mockResolvedValue(jsonResponse(errorBody, 500, 'Internal Server Error'));

    const res = await fetchWithRetry('/api/test', undefined, {
      maxRetries: 2,
      baseDelayMs: 1,
      maxDelayMs: 2,
    });

    // KEY FIX: should return the response (not throw), so caller can read the body
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('OPENAI_API_KEY environment variable is not set');

    // 1 initial + 2 retries = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws on network error after all retries', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      fetchWithRetry('/api/test', undefined, {
        maxRetries: 1,
        baseDelayMs: 1,
        maxDelayMs: 2,
      })
    ).rejects.toThrow('Failed to fetch');

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on network error then succeeds', async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const res = await fetchWithRetry('/api/test', undefined, {
      maxRetries: 2,
      baseDelayMs: 1,
      maxDelayMs: 2,
    });
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
