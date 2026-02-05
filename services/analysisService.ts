import { AnalysisResult } from '@/types/analysis';
import { QuestionResponse } from '@/types/questionFlow';
import { fetchWithRetry } from './fetchWithRetry';

export async function runFullAnalysis(questionResponses: QuestionResponse[]): Promise<AnalysisResult> {
  const response = await fetchWithRetry(
    '/api/analysis',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionResponses }),
    },
    { maxRetries: 3, baseDelayMs: 2000, maxDelayMs: 15000 }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis API error: ${response.status}`);
  }

  const result: AnalysisResult = await response.json();
  return result;
}
