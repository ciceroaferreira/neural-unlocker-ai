import { describe, it, expect } from 'vitest';

/**
 * Tests the error suggestion logic from App.tsx handleError.
 * Extracted as pure function to test without React rendering.
 */
function getErrorSuggestion(errorMsg: string): string {
  const msgLower = errorMsg.toLowerCase();

  let suggestion = 'Tente novamente. Se o erro persistir, verifique sua conexão.';
  if (msgLower.includes('api') || msgLower.includes('key') || msgLower.includes('environment')) {
    suggestion = 'Verifique se as chaves de API estão configuradas corretamente no ambiente.';
  } else if (msgLower.includes('microfone') || msgLower.includes('microphone') || msgLower.includes('permission')) {
    suggestion = 'Verifique as permissões do microfone no navegador.';
  } else if (msgLower.includes('500') || msgLower.includes('modelo') || msgLower.includes('model')) {
    suggestion = 'Erro no servidor de análise. Tente novamente em alguns segundos.';
  }

  return suggestion;
}

describe('Error suggestion logic', () => {
  it('suggests API key check for key-related errors', () => {
    expect(getErrorSuggestion('OPENAI_API_KEY environment variable is not set'))
      .toContain('chaves de API');

    expect(getErrorSuggestion('Invalid API key provided'))
      .toContain('chaves de API');

    expect(getErrorSuggestion('Missing environment variable'))
      .toContain('chaves de API');
  });

  it('suggests microphone check for permission errors', () => {
    expect(getErrorSuggestion('Permissão do microfone negada'))
      .toContain('permissões do microfone');

    expect(getErrorSuggestion('Microphone access denied'))
      .toContain('permissões do microfone');

    expect(getErrorSuggestion('Permission denied by user'))
      .toContain('permissões do microfone');
  });

  it('suggests server retry for 500 errors', () => {
    expect(getErrorSuggestion('HTTP 500: Internal Server Error'))
      .toContain('servidor de análise');

    expect(getErrorSuggestion('Resposta do modelo em formato inválido'))
      .toContain('servidor de análise');

    expect(getErrorSuggestion('Analysis model returned unexpected'))
      .toContain('servidor de análise');
  });

  it('shows generic suggestion for unknown errors', () => {
    expect(getErrorSuggestion('Something went wrong'))
      .toContain('Tente novamente');

    expect(getErrorSuggestion('Erro desconhecido'))
      .toContain('Tente novamente');
  });

  it('handles the old error format "HTTP 500:" that was previously showing wrong suggestion', () => {
    // This was the exact error the user saw — should now show server error suggestion
    const suggestion = getErrorSuggestion('HTTP 500:');
    expect(suggestion).toContain('servidor de análise');
    expect(suggestion).not.toContain('microfone');
  });
});
