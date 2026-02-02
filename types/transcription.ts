export interface TranscriptionItem {
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  questionId?: string;
}
