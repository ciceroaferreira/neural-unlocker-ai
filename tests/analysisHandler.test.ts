import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI before importing handler
const mockCreate = vi.fn();
vi.mock('../api/_lib/openaiServer.js', () => ({
  getServerOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }),
}));

import handler from '../api/analysis';

// Helper to create mock VercelRequest / VercelResponse
function createMockReq(overrides: any = {}) {
  return {
    method: 'POST',
    body: {
      questionResponses: [
        {
          questionId: 'q-heranca-familiar',
          questionText: 'O que você ouviu dos seus pais?',
          userResponse: 'Minha mãe sempre dizia que eu não seria nada.',
          category: 'heranca-familiar',
          timestamp: Date.now(),
        },
      ],
    },
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    _status: 0,
    _json: null,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
  };
  return res;
}

const VALID_ANALYSIS_RESPONSE = {
  insights: 'Você carrega padrões familiares profundos.',
  totalBloqueiosEncontrados: 3,
  blocks: [
    {
      blockName: 'Desvalorização herdada',
      level: 5,
      description: 'Padrão de desvalorização originado na infância',
      evidence: [
        {
          phrase: 'Minha mãe sempre dizia que eu não seria nada',
          dominantEmotion: 'tristeza',
          context: 'Herança familiar — relato sobre a mãe',
        },
      ],
      currentPatterns: ['Autossabotagem no trabalho'],
      investigationCategory: 'heranca-familiar',
      actionPlan: ['Identificar frases internalizadas'],
    },
  ],
};

beforeEach(() => {
  mockCreate.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/analysis', () => {
  it('rejects non-POST methods', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('rejects missing questionResponses', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('rejects empty questionResponses array', async () => {
    const req = createMockReq({ body: { questionResponses: [] } });
    const res = createMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('non-empty');
  });

  it('returns 200 with valid analysis', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(VALID_ANALYSIS_RESPONSE),
          },
        },
      ],
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.insights).toBe('Você carrega padrões familiares profundos.');
    expect(res._json.blocks).toHaveLength(1);
    expect(res._json.blocks[0].blockName).toBe('Desvalorização herdada');
    expect(res._json.totalBloqueiosEncontrados).toBe(3);
  });

  it('sorts blocks by level descending', async () => {
    const multiBlockResponse = {
      ...VALID_ANALYSIS_RESPONSE,
      blocks: [
        { ...VALID_ANALYSIS_RESPONSE.blocks[0], blockName: 'Leve', level: 1 },
        { ...VALID_ANALYSIS_RESPONSE.blocks[0], blockName: 'Forte', level: 5 },
        { ...VALID_ANALYSIS_RESPONSE.blocks[0], blockName: 'Médio', level: 3 },
      ],
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(multiBlockResponse) } }],
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.blocks[0].blockName).toBe('Forte');
    expect(res._json.blocks[1].blockName).toBe('Médio');
    expect(res._json.blocks[2].blockName).toBe('Leve');
  });

  it('returns 500 when OpenAI returns empty content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json.error).toContain('vazia');
  });

  it('returns 500 with descriptive message when JSON parse fails', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'This is not valid JSON {{{' } }],
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json.error).toContain('formato inválido');
  });

  it('returns 500 when result has no blocks array', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ insights: 'test', totalBloqueiosEncontrados: 0 }) } }],
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json.error).toContain('bloqueios');
  });

  it('returns 500 when OpenAI throws an error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Rate limit exceeded'));

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json.error).toContain('Rate limit exceeded');
  });

  it('rejects input exceeding max length', async () => {
    const longResponse = 'a'.repeat(60000);
    const req = createMockReq({
      body: {
        questionResponses: [
          {
            questionId: 'q1',
            questionText: 'Test',
            userResponse: longResponse,
            category: 'heranca-familiar',
            timestamp: Date.now(),
          },
        ],
      },
    });
    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.error).toContain('maximum length');
  });

  it('handles multiple question responses correctly', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(VALID_ANALYSIS_RESPONSE) } }],
    });

    const req = createMockReq({
      body: {
        questionResponses: [
          {
            questionId: 'q-heranca-familiar',
            questionText: 'O que você ouviu dos seus pais?',
            userResponse: 'Minha mãe dizia que eu não seria nada.',
            category: 'heranca-familiar',
            timestamp: Date.now(),
          },
          {
            questionId: 'q-experiencias-marcantes',
            questionText: 'Algo que te marcou?',
            userResponse: 'Fui humilhado na escola.',
            category: 'experiencias-marcantes',
            timestamp: Date.now(),
          },
          {
            questionId: 'q-gatilhos-atuais',
            questionText: 'O que te afeta hoje?',
            userResponse: 'Tenho medo de falar em público.',
            category: 'gatilhos-atuais',
            timestamp: Date.now(),
          },
        ],
      },
    });

    const res = createMockRes();
    await handler(req, res);

    expect(res._status).toBe(200);

    // Verify the user message sent to OpenAI includes all 3 questions
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[1].content;
    expect(userMessage).toContain('Pergunta 1');
    expect(userMessage).toContain('Pergunta 2');
    expect(userMessage).toContain('Pergunta 3');
    expect(userMessage).toContain('Minha mãe dizia');
    expect(userMessage).toContain('humilhado na escola');
    expect(userMessage).toContain('medo de falar em público');
  });
});
