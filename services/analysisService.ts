import { NeuralAnalysis } from '@/types/analysis';
import { fetchWithRetry } from './fetchWithRetry';

export async function generateInsightText(userInputs: string): Promise<string> {
  const response = await fetchWithRetry(
    '/api/analysis-insights',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInputs }),
    },
    { maxRetries: 3, baseDelayMs: 1000 }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis API error: ${response.status}`);
  }

  const { insights } = await response.json();
  return insights || '';
}

export async function generateBlockAnalysis(userInputs: string): Promise<NeuralAnalysis[]> {
  const response = await fetchWithRetry(
    '/api/analysis-blocks',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInputs }),
    },
    { maxRetries: 3, baseDelayMs: 1000 }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Block Analysis API error: ${response.status}`);
  }

  const { blocks } = await response.json();
  return blocks || [];
}
