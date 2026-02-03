import React, { useRef, useEffect } from 'react';
import { TranscriptionItem } from '@/types/transcription';
import { Question } from '@/types/questionFlow';
import QuestionPrompt from './QuestionPrompt';
import UserMessage from './UserMessage';
import AiMessage from './AiMessage';

interface ChatPanelProps {
  messages: TranscriptionItem[];
  isAnalyzing: boolean;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  isGeneratingFollowUp: boolean;
  isSpeakingQuestion: boolean;
  playingId: number | null;
  loadingAudioId: number | null;
  onPlayVoice: (text: string, id: number) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isAnalyzing,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  isGeneratingFollowUp,
  isSpeakingQuestion,
  playingId,
  loadingAudioId,
  onPlayVoice,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  return (
    <div className="flex flex-col h-[45vh] sm:h-[55vh] lg:h-[700px] bg-[#080808] rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative w-full">
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-3 sm:space-y-6 custom-scrollbar hide-scrollbar">
        <QuestionPrompt
          question={currentQuestion}
          currentIndex={currentQuestionIndex}
          total={totalQuestions}
          isGeneratingFollowUp={isGeneratingFollowUp}
          isSpeaking={isSpeakingQuestion}
        />

        {messages.length === 0 && !isAnalyzing && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 text-center px-6 sm:px-20">
            <h3 className="text-base sm:text-xl font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] mb-4 sm:mb-6">Em Espera</h3>
            <p className="text-xs sm:text-sm font-medium text-gray-500 leading-relaxed max-w-sm">
              Aguardando biometria vocal para iniciar o mapeamento.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'system') {
            // Check if it's a question (questions are longer)
            const isQuestion = m.text.includes('?') && m.text.length > 30;
            return (
              <div key={i} className="animate-in fade-in slide-in-from-top-5 duration-700">
                {isQuestion ? (
                  <div className="my-4 sm:my-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400/70">
                        Nova Pergunta
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 sm:p-5">
                      <p className="text-sm sm:text-base text-indigo-200 italic leading-relaxed">
                        "{m.text}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo-400 bg-indigo-500/10 px-4 sm:px-6 py-2 rounded-full text-center max-w-[90%]">
                      {m.text}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          if (m.role === 'user') {
            return <UserMessage key={i} text={m.text} />;
          }
          return (
            <AiMessage
              key={i}
              text={m.text}
              id={i}
              playingId={playingId}
              loadingAudioId={loadingAudioId}
              onPlayVoice={onPlayVoice}
            />
          );
        })}

        {isAnalyzing && (
          <div className="flex justify-center py-6 sm:py-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo-400">
                Processando mapeamento neural...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ChatPanel;
