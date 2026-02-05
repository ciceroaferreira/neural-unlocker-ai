export type BlockLevel = 1 | 2 | 3 | 4 | 5;

export type InvestigationCategory =
  | 'heranca-familiar'
  | 'experiencias-marcantes'
  | 'gatilhos-atuais';

export interface NeuralAnalysis {
  blockName: string;
  level: BlockLevel;
  description: string;
  evidence: string[];
  currentPatterns: string[];
  investigationCategory: InvestigationCategory;
  actionPlan: string[];
  // Deprecated — backward compat with saved sessions
  intensity?: number;
  recommendations?: string[];
}

export interface AnalysisResult {
  insights: string;
  blocks: NeuralAnalysis[];
}

export const LEVEL_LABELS: Record<BlockLevel, string> = {
  5: 'Trava Forte',
  4: 'Forte',
  3: 'Médio',
  2: 'Leve',
  1: 'Fácil de Resolver',
};

export const LEVEL_COLORS: Record<BlockLevel, string> = {
  5: 'from-red-600 to-red-400',
  4: 'from-orange-500 to-orange-400',
  3: 'from-yellow-500 to-yellow-400',
  2: 'from-green-500 to-green-400',
  1: 'from-emerald-500 to-emerald-400',
};

export const INVESTIGATION_CATEGORY_LABELS: Record<InvestigationCategory, string> = {
  'heranca-familiar': 'Herança Familiar',
  'experiencias-marcantes': 'Experiências Marcantes',
  'gatilhos-atuais': 'Gatilhos Atuais',
};
