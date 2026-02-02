import { SessionMetadata } from './session';
import { TranscriptionItem } from './transcription';
import { NeuralAnalysis } from './analysis';
import { QuestionResponse } from './questionFlow';

export interface ReportData {
  sessionMetadata: SessionMetadata;
  transcription: TranscriptionItem[];
  blocks: NeuralAnalysis[];
  aiInsights: string;
  questionResponses: QuestionResponse[];
  generatedAt: number;
}

export type ExportFormat = 'pdf' | 'markdown' | 'audio';
