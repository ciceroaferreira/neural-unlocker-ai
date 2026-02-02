import { TranscriptionItem } from './transcription';
import { NeuralAnalysis } from './analysis';
import { QuestionResponse } from './questionFlow';

export type ViewMode = 'intro' | 'session' | 'history' | 'session-detail';

export interface AppError {
  title: string;
  message: string;
  suggestion: string;
  icon?: string;
}

export interface SessionMetadata {
  id: string;
  createdAt: number;
  completedAt: number | null;
  durationSeconds: number;
  questionFlowId: string;
  questionsAnswered: number;
  totalQuestions: number;
}

export interface Session {
  metadata: SessionMetadata;
  messages: TranscriptionItem[];
  analysis: NeuralAnalysis[] | null;
  aiInsights: string | null;
  questionResponses: QuestionResponse[];
  audioBlob: Blob | null;
}

export interface PersistedSession {
  metadata: SessionMetadata;
  messages: TranscriptionItem[];
  analysis: NeuralAnalysis[] | null;
  aiInsights: string | null;
  questionResponses: QuestionResponse[];
}
