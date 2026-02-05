import { ReportData } from './export';

// ── Session Phases ──────────────────────────────────────────────
export type SessionPhase =
  | 'idle'
  | 'initializing'
  | 'recording'
  | 'speaking'
  | 'transitioning'
  | 'analyzing'
  | 'results'
  | 'error';

// ── Error ───────────────────────────────────────────────────────
export interface SessionError {
  context: string;
  message: string;
  retryAction: SessionAction | null;
  retryCount: number;
}

// ── State ───────────────────────────────────────────────────────
export interface SessionMachineState {
  phase: SessionPhase;
  currentQuestionIndex: number;
  isPaused: boolean;
  error: SessionError | null;
  reportData: ReportData | null;
  lastSpokenQuestionId: string | null;
}

// ── Actions ─────────────────────────────────────────────────────
export type SessionAction =
  | { type: 'START_SESSION' }
  | { type: 'INIT_COMPLETE' }
  | { type: 'INIT_FAILED'; error: SessionError }
  | { type: 'NEXT_QUESTION' }
  | { type: 'TRANSITION_COMPLETE'; questionIndex: number; questionId: string }
  | { type: 'FLOW_COMPLETE' }
  | { type: 'TTS_ENDED' }
  | { type: 'TTS_FAILED' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'GENERATE_INSIGHT' }
  | { type: 'ANALYSIS_COMPLETE'; reportData: ReportData }
  | { type: 'ANALYSIS_FAILED'; error: SessionError }
  | { type: 'ABORT_SESSION' }
  | { type: 'RESET' }
  | { type: 'RETRY' };
