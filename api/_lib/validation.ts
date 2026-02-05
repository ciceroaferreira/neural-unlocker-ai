import type { VercelRequest, VercelResponse } from '@vercel/node';

export function validateMethod(req: VercelRequest, res: VercelResponse, method: string): boolean {
  if (req.method !== method) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
}

export function validateBody(
  req: VercelRequest,
  res: VercelResponse,
  requiredFields: string[]
): boolean {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body is required' });
    return false;
  }
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
      res.status(400).json({ error: `Field "${field}" is required and cannot be empty` });
      return false;
    }
  }
  return true;
}

export function handleError(res: VercelResponse, error: unknown, context: string): void {
  console.error(`[API Error - ${context}]:`, error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({ error: message });
}
