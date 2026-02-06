import React, { useState, useCallback } from 'react';
import { ViewMode, AppError, PersistedSession, SessionMetadata } from '@/types/session';
import { ReportData } from '@/types/export';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import IntroScreen from '@/components/intro/IntroScreen';
import SessionScreen from '@/components/session/SessionScreen';
import SessionHistory from '@/components/history/SessionHistory';
import SessionDetail from '@/components/history/SessionDetail';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [appError, setAppError] = useState<AppError | null>(null);
  const [selectedSession, setSelectedSession] = useState<PersistedSession | null>(null);

  const persistence = useSessionPersistence();

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    const errorMsg = error?.message || error?.toString?.() || 'Erro desconhecido';
    const msgLower = errorMsg.toLowerCase();

    let suggestion = 'Tente novamente. Se o erro persistir, verifique sua conexão.';
    if (msgLower.includes('api') || msgLower.includes('key') || msgLower.includes('environment')) {
      suggestion = 'Verifique se as chaves de API estão configuradas corretamente no ambiente.';
    } else if (msgLower.includes('microfone') || msgLower.includes('microphone') || msgLower.includes('permission')) {
      suggestion = 'Verifique as permissões do microfone no navegador.';
    } else if (msgLower.includes('500') || msgLower.includes('modelo') || msgLower.includes('model')) {
      suggestion = 'Erro no servidor de análise. Tente novamente em alguns segundos.';
    }

    setAppError({
      title: `Erro: ${context}`,
      message: errorMsg,
      suggestion,
    });
  }, []);

  const handleSelectSession = useCallback(
    async (id: string) => {
      const session = await persistence.getSession(id);
      if (session) {
        setSelectedSession(session);
        setViewMode('session-detail');
      }
    },
    [persistence]
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Error banner */}
      {appError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/30 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-500 max-w-lg">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-wider text-red-300 mb-1">
                {appError.title}
              </h4>
              <p className="text-xs text-red-200">{appError.message}</p>
              <p className="text-xs text-red-300/60 mt-1">{appError.suggestion}</p>
            </div>
            <button
              onClick={() => setAppError(null)}
              className="text-red-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {viewMode === 'intro' && (
        <IntroScreen
          onStart={() => setViewMode('session')}
          onHistory={() => {
            persistence.loadSessions();
            setViewMode('history');
          }}
          onError={handleError}
        />
      )}

      {viewMode === 'session' && (
        <SessionScreen
          onBack={() => setViewMode('intro')}
          onError={handleError}
          onSessionComplete={(data) => {
            const metadata: SessionMetadata = {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              completedAt: Date.now(),
              durationSeconds: data.durationSeconds,
              questionFlowId: 'metodo-ip-v1',
              questionsAnswered: data.questionResponses.length,
              totalQuestions: data.questionResponses.length,
            };

            const session: PersistedSession = {
              metadata,
              messages: data.messages,
              analysis: data.analysis,
              aiInsights: data.aiInsights,
              questionResponses: data.questionResponses,
            };

            persistence.saveSession(session);
          }}
        />
      )}

      {viewMode === 'history' && (
        <SessionHistory
          sessions={persistence.sessions}
          loading={persistence.loading}
          onSelect={handleSelectSession}
          onDelete={async (id) => {
            await persistence.removeSession(id);
          }}
          onBack={() => setViewMode('intro')}
        />
      )}

      {viewMode === 'session-detail' && selectedSession && (
        <SessionDetail
          session={selectedSession}
          onBack={() => {
            setSelectedSession(null);
            setViewMode('history');
          }}
        />
      )}
    </div>
  );
};

export default App;
