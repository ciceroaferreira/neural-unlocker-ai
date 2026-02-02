import React from 'react';
import { Question } from '@/types/questionFlow';
import { CATEGORY_LABELS } from '@/constants/questions';

interface QuestionPromptProps {
  question: Question | null;
  currentIndex: number;
  total: number;
  isGeneratingFollowUp: boolean;
}

const QuestionPrompt: React.FC<QuestionPromptProps> = ({
  question,
  currentIndex,
  total,
  isGeneratingFollowUp,
}) => {
  if (!question) return null;

  const categoryLabel = CATEGORY_LABELS[question.category] || question.category;
  const progress = ((currentIndex) / total) * 100;

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-6 mb-6 animate-in fade-in slide-in-from-top-5 duration-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400">
            Pergunta {currentIndex + 1} de {total}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
            {categoryLabel}
          </span>
          {!question.isMandatory && (
            <span className="text-[8px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full">
              Follow-up
            </span>
          )}
        </div>
      </div>

      <p className="text-lg text-white/90 font-light italic leading-relaxed mb-4">
        "{question.text}"
      </p>

      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {isGeneratingFollowUp && (
        <div className="mt-3 flex items-center gap-2 text-[10px] text-cyan-400 uppercase tracking-wider">
          <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
          Gerando pergunta adaptativa...
        </div>
      )}
    </div>
  );
};

export default QuestionPrompt;
