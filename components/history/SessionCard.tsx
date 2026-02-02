import React from 'react';
import { PersistedSession } from '@/types/session';

interface SessionCardProps {
  session: PersistedSession;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onSelect, onDelete }) => {
  const { metadata, analysis } = session;
  const date = new Date(metadata.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const duration = `${Math.floor(metadata.durationSeconds / 60)}m ${metadata.durationSeconds % 60}s`;
  const blocksCount = analysis?.length || 0;

  return (
    <div
      onClick={() => onSelect(metadata.id)}
      className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-white/80">{date}</div>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            Duração: {duration}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(metadata.id);
          }}
          className="text-gray-600 hover:text-red-400 transition-colors p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            {metadata.questionsAnswered} perguntas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            {blocksCount} bloqueios
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
