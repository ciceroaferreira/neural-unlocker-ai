export type QuestionCategory =
  | 'childhood'
  | 'family'
  | 'self-image'
  | 'relationships'
  | 'career'
  | 'beliefs'
  | 'emotions'
  | 'future';

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  isMandatory: boolean;
  order: number;
  followUpPrompt?: string;
}

export interface QuestionResponse {
  questionId: string;
  questionText: string;
  userResponse: string;
  category: QuestionCategory;
  timestamp: number;
}

export interface QuestionFlowState {
  currentQuestionIndex: number;
  questions: Question[];
  responses: QuestionResponse[];
  isFlowComplete: boolean;
  isGeneratingFollowUp: boolean;
}
