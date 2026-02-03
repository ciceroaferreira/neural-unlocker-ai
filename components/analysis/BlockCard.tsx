import React from 'react';
import { NeuralAnalysis } from '@/types/analysis';

interface BlockCardProps {
  block: NeuralAnalysis;
  index: number;
}

const BlockCard: React.FC<BlockCardProps> = ({ block, index }) => {
  const intensityColor =
    block.intensity > 70
      ? 'from-red-600 to-red-400'
      : block.intensity > 40
        ? 'from-yellow-600 to-yellow-400'
        : 'from-green-600 to-green-400';

  const intensityLabel =
    block.intensity > 70
      ? 'ALTO'
      : block.intensity > 40
        ? 'MÉDIO'
        : 'BAIXO';

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-base sm:text-lg font-black text-white/90 uppercase tracking-wider">
            {block.blockName}
          </h4>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500">
            Bloqueio #{index + 1}
          </span>
        </div>
        <div className="text-right space-y-1 flex-shrink-0">
          <div className="text-2xl sm:text-3xl font-mono font-black text-white/80">{block.intensity}%</div>
          <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] bg-gradient-to-r ${intensityColor} bg-clip-text text-transparent`}>
            {intensityLabel}
          </span>
        </div>
      </div>

      {/* Intensity bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${intensityColor} rounded-full transition-all duration-1000`}
          style={{ width: `${block.intensity}%` }}
        />
      </div>

      <p className="text-sm text-gray-300 leading-relaxed italic">
        {block.description}
      </p>

      {block.recommendations.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">
            Recomendações
          </h5>
          <ul className="space-y-2">
            {block.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="text-cyan-400 mt-0.5">&#x25B8;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlockCard;
