import React from 'react';
import { PersistedSession } from '@/types/session';
import SessionCard from './SessionCard';

interface SessionHistoryProps {
  sessions: PersistedSession[];
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  loading,
  onSelect,
  onDelete,
  onBack,
}) => {
  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-[#050505] text-white font-sans">
      <header className="w-full max-w-3xl flex flex-col items-center mt-6 mb-12">
        <div
          className="flex items-center gap-4 cursor-pointer group mb-8"
          onClick={() => { triggerHaptic(20); onBack(); }}
        >
          <svg className="w-4 h-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white/90">
            Histórico de Sessões
          </h1>
        </div>
      </header>

      <main className="w-full max-w-3xl space-y-4">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <h3 className="text-lg font-black uppercase tracking-[0.6em] mb-4">Nenhuma Sessão</h3>
            <p className="text-sm text-gray-500">Suas sessões salvas aparecerão aqui.</p>
          </div>
        )}

        {sessions.map(session => (
          <SessionCard
            key={session.metadata.id}
            session={session}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </main>
    </div>
  );
};

export default SessionHistory;
