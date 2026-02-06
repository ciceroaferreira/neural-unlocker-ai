import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetchWithRetry
const mockFetchWithRetry = vi.fn();
vi.mock('../services/fetchWithRetry', () => ({
  fetchWithRetry: (...args: any[]) => mockFetchWithRetry(...args),
}));

import { runFullAnalysis } from '../services/analysisService';
import type { QuestionResponse } from '../types/questionFlow';

function makeResponses(count = 1): QuestionResponse[] {
  return Array.from({ length: count }, (_, i) => ({
    questionId: `q-${i}`,
    questionText: `Pergunta ${i + 1}`,
    userResponse: `Resposta do usuário ${i + 1}`,
    category: 'heranca-familiar' as const,
    timestamp: Date.now(),
  }));
}

const VALID_RESULT = {
  insights: 'Insights do usuário',
  totalBloqueiosEncontrados: 2,
  blocks: [
    {
      blockName: 'Bloqueio 1',
      level: 5,
      description: 'Desc',
      evidence: [],
      currentPatterns: [],
      investigationCategory: 'heranca-familiar',
      actionPlan: [],
    },
  ],
};

beforeEach(() => {
  mockFetchWithRetry.mockReset();
});

describe('runFullAnalysis', () => {
  it('returns parsed analysis on success', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: async () => VALID_RESULT,
    });

    const result = await runFullAnalysis(makeResponses(3));

    expect(result.insights).toBe('Insights do usuário');
    expect(result.blocks).toHaveLength(1);
    expect(result.totalBloqueiosEncontrados).toBe(2);
  });

  it('sends correct payload to fetchWithRetry', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      ok: true,
      json: async () => VALID_RESULT,
    });

    const responses = makeResponses(2);
    await runFullAnalysis(responses);

    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      '/api/analysis',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionResponses: responses }),
      },
      { maxRetries: 3, baseDelayMs: 2000, maxDelayMs: 15000 }
    );
  });

  it('throws with server error message when response is not ok', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'OPENAI_API_KEY environment variable is not set' }),
    });

    await expect(runFullAnalysis(makeResponses())).rejects.toThrow(
      'OPENAI_API_KEY environment variable is not set'
    );
  });

  it('throws with generic message when error body is unparseable', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('invalid json'); },
    });

    await expect(runFullAnalysis(makeResponses())).rejects.toThrow(
      'Analysis API error: 500'
    );
  });

  it('throws with descriptive message for JSON parse errors from server', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Resposta do modelo em formato inválido. Tente novamente.' }),
    });

    await expect(runFullAnalysis(makeResponses())).rejects.toThrow(
      'Resposta do modelo em formato inválido'
    );
  });

  it('propagates network errors from fetchWithRetry', async () => {
    mockFetchWithRetry.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(runFullAnalysis(makeResponses())).rejects.toThrow('Failed to fetch');
  });
});
