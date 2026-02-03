import React from 'react';
import { NeuralAnalysis } from '@/types/analysis';
import BlockCard from './BlockCard';

interface AnalysisResultsProps {
  analysis: NeuralAnalysis[];
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  if (analysis.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 sm:gap-4 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-indigo-400">
          Mapeamento de Bloqueios
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {analysis.map((block, i) => (
        <BlockCard key={i} block={block} index={i} />
      ))}
    </div>
  );
};

export default AnalysisResults;
