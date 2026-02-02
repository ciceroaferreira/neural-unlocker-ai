import { getGeminiClient } from './geminiClient';
import { Question, QuestionResponse } from '@/types/questionFlow';
import { GEMINI_MODELS } from '@/constants/config';
import { FOLLOW_UP_SYSTEM_PROMPT } from '@/constants/prompts';

export async function generateFollowUpQuestion(
  currentQuestion: Question,
  userResponse: string,
  previousResponses: QuestionResponse[]
): Promise<Question | null> {
  if (!currentQuestion.followUpPrompt) return null;

  const ai = getGeminiClient();

  const context = previousResponses
    .map(r => `[${r.category}]: ${r.userResponse}`)
    .join('\n');

  const prompt = `${currentQuestion.followUpPrompt}

Contexto anterior:
${context}

Resposta atual do usuário à pergunta "${currentQuestion.text}":
"${userResponse}"`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.ANALYSIS_JSON,
      contents: prompt,
      config: { systemInstruction: FOLLOW_UP_SYSTEM_PROMPT },
    });

    const followUpText = response.text?.trim();
    if (!followUpText) return null;

    return {
      id: `followup-${currentQuestion.id}-${Date.now()}`,
      text: followUpText,
      category: currentQuestion.category,
      isMandatory: false,
      order: currentQuestion.order + 0.5,
    };
  } catch (e) {
    console.error('Failed to generate follow-up question:', e);
    return null;
  }
}
