import { NeuralAnalysis } from '@/types/analysis';

export async function generateInsightText(userInputs: string): Promise<string> {
  const response = await fetch('/api/analysis-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInputs }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis API error: ${response.status}`);
  }

  const { insights } = await response.json();
  return insights || '';
}

export async function generateBlockAnalysis(userInputs: string): Promise<NeuralAnalysis[]> {
  const response = await fetch('/api/analysis-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInputs }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Block Analysis API error: ${response.status}`);
  }

  const { blocks } = await response.json();
  return blocks || [];
}
