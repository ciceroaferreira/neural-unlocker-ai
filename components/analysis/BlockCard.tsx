import React from 'react';
import { NeuralAnalysis, LEVEL_LABELS, LEVEL_COLORS, INVESTIGATION_CATEGORY_LABELS, EMOTION_LABELS, BlockLevel, EvidenceItem, DominantEmotion } from '@/types/analysis';

const EMOTION_COLORS: Record<DominantEmotion, string> = {
  medo: 'bg-blue-500/20 text-blue-300',
  raiva: 'bg-red-500/20 text-red-300',
  vergonha: 'bg-pink-500/20 text-pink-300',
  culpa: 'bg-orange-500/20 text-orange-300',
  tristeza: 'bg-slate-500/20 text-slate-300',
};

interface BlockCardProps {
  block: NeuralAnalysis;
  index: number;
}

const BlockCard: React.FC<BlockCardProps> = ({ block, index }) => {
  const level = block.level ?? 3;
  const color = LEVEL_COLORS[level as BlockLevel] || LEVEL_COLORS[3];
  const label = LEVEL_LABELS[level as BlockLevel] || 'Médio';
  const categoryLabel = block.investigationCategory
    ? INVESTIGATION_CATEGORY_LABELS[block.investigationCategory]
    : null;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <h4 className="text-base sm:text-lg font-black text-white/90 uppercase tracking-wider">
            {block.blockName}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500">
              Bloqueio #{index + 1}
            </span>
            {categoryLabel && (
              <span className="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold uppercase tracking-wider">
                {categoryLabel}
              </span>
            )}
          </div>
        </div>
        <div className="text-right space-y-1 flex-shrink-0">
          <div className={`text-2xl sm:text-3xl font-mono font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {level}/5
          </div>
          <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {label}
          </span>
        </div>
      </div>

      {/* Level indicator — 5 segments */}
      <div className="flex gap-1.5">
        {[5, 4, 3, 2, 1].map((seg) => (
          <div
            key={seg}
            className={`h-2 flex-1 rounded-full transition-all duration-1000 ${
              seg <= level
                ? `bg-gradient-to-r ${color}`
                : 'bg-white/5'
            }`}
          />
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 leading-relaxed italic">
        {block.description}
      </p>

      {/* Evidence */}
      {block.evidence && block.evidence.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400">
            Evidências
          </h5>
          <div className="space-y-3">
            {block.evidence.map((ev: EvidenceItem | string, i: number) => {
              if (typeof ev === 'string') {
                return (
                  <blockquote key={i} className="border-l-2 border-amber-400/30 pl-3 text-sm text-gray-400 italic">
                    "{ev}"
                  </blockquote>
                );
              }
              const emotionColor = EMOTION_COLORS[ev.dominantEmotion] || 'bg-gray-500/20 text-gray-300';
              const emotionLabel = EMOTION_LABELS[ev.dominantEmotion] || ev.dominantEmotion;
              return (
                <div key={i} className="border-l-2 border-amber-400/30 pl-3 space-y-1.5">
                  <p className="text-sm text-gray-400 italic">"{ev.phrase}"</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${emotionColor}`}>
                      {emotionLabel}
                    </span>
                    <span className="text-[8px] text-gray-500">{ev.context}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Patterns */}
      {block.currentPatterns && block.currentPatterns.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">
            Padrões Atuais
          </h5>
          <ul className="space-y-2">
            {block.currentPatterns.map((pattern, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="text-purple-400 mt-0.5">&#x25B8;</span>
                {pattern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Plan */}
      {block.actionPlan && block.actionPlan.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">
            Plano de Ação
          </h5>
          <ul className="space-y-2">
            {block.actionPlan.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="text-cyan-400 mt-0.5 font-mono text-xs font-bold">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlockCard;
