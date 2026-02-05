import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerOpenAIClient } from './_lib/openaiServer';
import { validateMethod, validateBody, handleError } from './_lib/validation';
import { OPENAI_MODELS } from '../constants/config';
import { ANALYSIS_SYSTEM_PROMPT } from '../constants/prompts';

const ANALYSIS_SCHEMA = {
  type: 'object' as const,
  properties: {
    insights: { type: 'string' as const },
    blocks: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          blockName: { type: 'string' as const },
          level: { type: 'number' as const, enum: [1, 2, 3, 4, 5] },
          description: { type: 'string' as const },
          evidence: { type: 'array' as const, items: { type: 'string' as const } },
          currentPatterns: { type: 'array' as const, items: { type: 'string' as const } },
          investigationCategory: {
            type: 'string' as const,
            enum: ['heranca-familiar', 'experiencias-marcantes', 'gatilhos-atuais'],
          },
          actionPlan: { type: 'array' as const, items: { type: 'string' as const } },
        },
        required: ['blockName', 'level', 'description', 'evidence', 'currentPatterns', 'investigationCategory', 'actionPlan'],
        additionalProperties: false,
      },
    },
  },
  required: ['insights', 'blocks'],
  additionalProperties: false,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(req, res, 'POST')) return;
  if (!validateBody(req, res, ['questionResponses'])) return;

  const { questionResponses } = req.body;

  if (!Array.isArray(questionResponses) || questionResponses.length === 0) {
    return res.status(400).json({ error: 'questionResponses must be a non-empty array' });
  }

  // Format user message with structured Q&A pairs
  const userMessage = questionResponses
    .map((qr: any, i: number) => `### Pergunta ${i + 1}: ${qr.questionText}\n**Resposta do usuário:** ${qr.userResponse}`)
    .join('\n\n');

  const totalChars = userMessage.length;
  if (totalChars > 50000) {
    return res.status(400).json({ error: 'Input exceeds maximum length' });
  }

  try {
    const openai = getServerOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.ANALYSIS,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'analysis_result',
          strict: true,
          schema: ANALYSIS_SCHEMA,
        },
      },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Empty response from analysis model' });
    }

    const result = JSON.parse(content);

    // Sort blocks by level descending (5 → 1)
    result.blocks.sort((a: any, b: any) => b.level - a.level);

    return res.status(200).json(result);
  } catch (error) {
    handleError(res, error, 'Analysis');
  }
}
