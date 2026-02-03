import React from 'react';
import { Question } from '@/types/questionFlow';
import { CATEGORY_LABELS } from '@/constants/questions';

interface QuestionPromptProps {
  question: Question | null;
  currentIndex: number;
  total: number;
  isGeneratingFollowUp: boolean;
  isSpeaking: boolean;
}

const QuestionPrompt: React.FC<QuestionPromptProps> = ({
  question,
  currentIndex,
  total,
  isGeneratingFollowUp,
  isSpeaking,
}) => {
  if (!question) return null;

  const categoryLabel = CATEGORY_LABELS[question.category] || question.category;
  const progress = ((currentIndex) / total) * 100;

  return (
    <div className={`border rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-5 duration-500 transition-colors ${
      isSpeaking
        ? 'bg-cyan-600/10 border-cyan-500/30'
        : 'bg-indigo-600/10 border-indigo-500/20'
    }`}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo-400">
          Pergunta {currentIndex + 1} de {total}
        </span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
          {categoryLabel}
        </span>
        {!question.isMandatory && (
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            Follow-up
          </span>
        )}
        {isSpeaking && (
          <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full animate-pulse">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            Zephyr
          </span>
        )}
      </div>

      <p className="text-sm sm:text-lg text-white/90 font-light italic leading-relaxed mb-3 sm:mb-4">
        "{question.text}"
      </p>

      {/* Instructions based on state */}
      {!isSpeaking && !isGeneratingFollowUp && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
            <span className="text-green-400 font-bold">Dica:</span> Fale naturalmente sobre o tema.
            Não há resposta certa ou errada. Quando terminar, toque em{' '}
            <span className="text-cyan-400 font-semibold">"Próxima Pergunta"</span>.
          </p>
        </div>
      )}

      <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isSpeaking
              ? 'bg-gradient-to-r from-cyan-500 to-white animate-pulse'
              : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isGeneratingFollowUp && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-yellow-300">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Analisando sua resposta e preparando a próxima pergunta...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPrompt;
