import React from 'react';
import { PersistedSession } from '@/types/session';
import { ReportData } from '@/types/export';
import { CATEGORY_LABELS } from '@/constants/questions';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import ExportPanel from '@/components/export/ExportPanel';

interface SessionDetailProps {
  session: PersistedSession;
  onBack: () => void;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ session, onBack }) => {
  const { metadata, messages, analysis, aiInsights, questionResponses } = session;

  const date = new Date(metadata.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const duration = `${Math.floor(metadata.durationSeconds / 60)}m ${metadata.durationSeconds % 60}s`;

  const reportData: ReportData = {
    sessionMetadata: metadata,
    transcription: messages,
    blocks: analysis || [],
    aiInsights: aiInsights || '',
    questionResponses,
    generatedAt: Date.now(),
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-[#050505] text-white font-sans">
      <header className="w-full max-w-4xl flex flex-col items-center mt-6 mb-8">
        <div
          className="flex items-center gap-4 cursor-pointer group mb-4"
          onClick={() => { triggerHaptic(20); onBack(); }}
        >
          <svg className="w-4 h-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white/90">
            Detalhes da Sessão
          </h1>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          <span>{date}</span>
          <span>|</span>
          <span>{duration}</span>
          <span>|</span>
          <span>{metadata.questionsAnswered} perguntas</span>
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {/* Question Responses */}
        {questionResponses.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400">
              Respostas às Perguntas
            </h2>
            {questionResponses.map((qr, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">
                    {i + 1}.
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
                    {CATEGORY_LABELS[qr.category] || qr.category}
                  </span>
                </div>
                <p className="text-sm text-white/70 font-medium">{qr.questionText}</p>
                <p className="text-sm text-gray-400 italic pl-4 border-l-2 border-indigo-500/20">
                  {qr.userResponse}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Transcription */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400">
            Transcrição
          </h2>
          <div className="bg-[#080808] rounded-[2rem] border border-white/5 p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-gray-400 font-mono italic' : m.role === 'system' ? 'text-indigo-400 font-bold uppercase text-[10px] tracking-wider' : 'text-gray-200'}`}>
                {m.role === 'user' && <span className="text-gray-600 mr-2">Usuário:</span>}
                {m.role === 'ai' && <span className="text-indigo-400 mr-2">Neural:</span>}
                {m.text}
              </div>
            ))}
          </div>
        </section>

        {/* Analysis */}
        {analysis && analysis.length > 0 && (
          <AnalysisResults analysis={analysis} />
        )}

        {/* AI Insights */}
        {aiInsights && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400">
              Insight Neural
            </h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8">
              <p className="text-lg text-gray-100 leading-relaxed font-light italic">
                "{aiInsights}"
              </p>
            </div>
          </section>
        )}

        {/* Export */}
        <ExportPanel
          reportData={reportData}
          onDownloadWAV={() => {}}
          hasAudio={false}
          onSaveSession={() => {}}
        />
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default SessionDetail;
