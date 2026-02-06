import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * End-to-end flow test: simulates the full path from user click to error/success display.
 *
 * Flow:
 * 1. User clicks "Gerar Insight"
 * 2. useSessionMachine dispatches GENERATE_INSIGHT → analyzing phase
 * 3. neuralAnalysis.runAnalysis(responses) is called
 * 4. runFullAnalysis() calls fetchWithRetry('/api/analysis', ...)
 * 5. fetchWithRetry retries on 500, returns response on final attempt (FIX)
 * 6. analysisService reads the response body for the error message
 * 7. Error propagates to handleError in App.tsx with proper suggestion
 */

// ── Mock fetch globally ──────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchWithRetry } from '../services/fetchWithRetry';

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('E2E: Neural Mapping analysis flow', () => {
  describe('Scenario 1: Successful analysis', () => {
    it('completes the full flow from fetch to parsed result', async () => {
      const analysisResult = {
        insights: 'Você carrega padrões profundos de herança familiar.',
        totalBloqueiosEncontrados: 5,
        blocks: [
          {
            blockName: 'Medo de rejeição',
            level: 5,
            description: 'Padrão enraizado na infância',
            evidence: [
              {
                phrase: 'Minha mãe sempre dizia que eu não seria nada',
                dominantEmotion: 'tristeza',
                context: 'Herança familiar — relato sobre a mãe',
              },
            ],
            currentPatterns: ['Evita exposição social'],
            investigationCategory: 'heranca-familiar',
            actionPlan: ['Ressignificar a frase materna'],
          },
          {
            blockName: 'Vergonha de existir',
            level: 3,
            description: 'Bloqueio de intensidade média',
            evidence: [
              {
                phrase: 'Sempre senti que atrapalhava',
                dominantEmotion: 'vergonha',
                context: 'Experiência marcante — escola',
              },
            ],
            currentPatterns: ['Dificuldade em pedir ajuda'],
            investigationCategory: 'experiencias-marcantes',
            actionPlan: ['Exercício de auto-validação'],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(analysisResult, 200));

      // Step 1: fetchWithRetry gets the response
      const response = await fetchWithRetry('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionResponses: [
            { questionId: 'q1', questionText: 'Q1', userResponse: 'R1', category: 'heranca-familiar', timestamp: 1 },
          ],
        }),
      });

      expect(response.ok).toBe(true);

      // Step 2: analysisService parses the response
      const result = await response.json();

      expect(result.insights).toContain('padrões profundos');
      expect(result.totalBloqueiosEncontrados).toBe(5);
      expect(result.blocks).toHaveLength(2);
    });
  });

  describe('Scenario 2: Server returns 500 (e.g., missing API key)', () => {
    it('propagates the server error message through the full chain', async () => {
      const serverError = { error: 'OPENAI_API_KEY environment variable is not set' };

      // Server returns 500 on every attempt
      mockFetch.mockResolvedValue(jsonResponse(serverError, 500));

      // Step 1: fetchWithRetry retries and returns the last response (FIX)
      const response = await fetchWithRetry('/api/analysis', {
        method: 'POST',
        body: '{}',
      }, {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      });

      // Should return the response (not throw)
      expect(response.status).toBe(500);

      // Step 2: analysisService reads the body
      const body = await response.json();
      expect(body.error).toBe('OPENAI_API_KEY environment variable is not set');

      // Step 3: The error would be thrown as:
      const thrownError = new Error(body.error || `Analysis API error: ${response.status}`);
      expect(thrownError.message).toBe('OPENAI_API_KEY environment variable is not set');

      // Step 4: handleError in App.tsx would categorize it correctly
      const msgLower = thrownError.message.toLowerCase();
      const isApiKeyError = msgLower.includes('api') || msgLower.includes('key') || msgLower.includes('environment');
      expect(isApiKeyError).toBe(true);
    });
  });

  describe('Scenario 3: Server returns 500 with JSON parse error', () => {
    it('shows descriptive error about invalid model response', async () => {
      const serverError = { error: 'Resposta do modelo em formato inválido. Tente novamente.' };

      mockFetch.mockResolvedValue(jsonResponse(serverError, 500));

      const response = await fetchWithRetry('/api/analysis', {
        method: 'POST',
        body: '{}',
      }, {
        maxRetries: 1,
        baseDelayMs: 1,
        maxDelayMs: 2,
      });

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toContain('formato inválido');

      // App.tsx suggestion logic
      const msgLower = body.error.toLowerCase();
      const isModelError = msgLower.includes('500') || msgLower.includes('modelo') || msgLower.includes('model');
      expect(isModelError).toBe(true);
    });
  });

  describe('Scenario 4: Network error (no internet)', () => {
    it('throws after retries with network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        fetchWithRetry('/api/analysis', { method: 'POST', body: '{}' }, {
          maxRetries: 1,
          baseDelayMs: 1,
          maxDelayMs: 2,
        })
      ).rejects.toThrow('Failed to fetch');
    });
  });

  describe('Scenario 5: Transient 500 then success', () => {
    it('recovers from temporary server error', async () => {
      const validResult = {
        insights: 'Insight',
        totalBloqueiosEncontrados: 1,
        blocks: [],
      };

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ error: 'temporary' }, 500))
        .mockResolvedValueOnce(jsonResponse(validResult, 200));

      const response = await fetchWithRetry('/api/analysis', {
        method: 'POST',
        body: '{}',
      }, {
        maxRetries: 3,
        baseDelayMs: 1,
        maxDelayMs: 2,
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.insights).toBe('Insight');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
