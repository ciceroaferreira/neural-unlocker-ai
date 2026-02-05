import { GoogleGenAI } from '@google/genai';

let serverClient: GoogleGenAI | null = null;

export function getServerGeminiClient(): GoogleGenAI {
  if (!serverClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    serverClient = new GoogleGenAI({ apiKey });
  }
  return serverClient;
}
