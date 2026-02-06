import React from 'react';
import { NeuralAnalysis } from '@/types/analysis';
import BlockCard from './BlockCard';

interface AnalysisResultsProps {
  analysis: NeuralAnalysis[];
  totalBloqueios?: number | null;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, totalBloqueios }) => {
  if (analysis.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 sm:gap-4 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="text-center">
          <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-indigo-400">
            Mapeamento de Desbloqueios
          </h3>
          {totalBloqueios != null && totalBloqueios > analysis.length && (
            <p className="text-[7px] sm:text-[8px] text-gray-500 mt-1">
              Top {analysis.length} de {totalBloqueios} bloqueios identificados
            </p>
          )}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {analysis.map((block, i) => (
        <BlockCard key={i} block={block} index={i} />
      ))}
    </div>
  );
};

export default AnalysisResults;
