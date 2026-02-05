import OpenAI from 'openai';

let serverClient: OpenAI | null = null;

export function getServerOpenAIClient(): OpenAI {
  if (!serverClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    serverClient = new OpenAI({ apiKey });
  }
  return serverClient;
}
