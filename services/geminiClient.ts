import { GoogleGenAI } from '@google/genai';

/**
 * Client-side Gemini client - used ONLY for live transcription (WebSocket).
 * TTS and Analysis calls go through /api/* proxy routes.
 *
 * The API key is exposed client-side for the WebSocket transcription service,
 * which cannot be proxied through Vercel serverless functions.
 */
let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured for transcription');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
