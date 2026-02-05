import { SessionMachineState, SessionAction } from '@/types/sessionMachine';

export const INITIAL_STATE: SessionMachineState = {
  phase: 'idle',
  currentQuestionIndex: 0,
  isPaused: false,
  error: null,
  reportData: null,
  lastSpokenQuestionId: null,
};

export function sessionMachineReducer(
  state: SessionMachineState,
  action: SessionAction
): SessionMachineState {
  // ── Global actions (from any phase) ───────────────────────────
  if (action.type === 'ABORT_SESSION') {
    return { ...INITIAL_STATE };
  }
  if (action.type === 'RESET') {
    return { ...INITIAL_STATE };
  }

  switch (state.phase) {
    // ── Idle ─────────────────────────────────────────────────────
    case 'idle': {
      if (action.type === 'START_SESSION') {
        return { ...state, phase: 'initializing', error: null };
      }
      break;
    }

    // ── Initializing ─────────────────────────────────────────────
    case 'initializing': {
      if (action.type === 'INIT_COMPLETE') {
        return {
          ...state,
          phase: 'recording',
          currentQuestionIndex: 0,
          isPaused: false,
          error: null,
        };
      }
      if (action.type === 'INIT_FAILED') {
        return { ...state, phase: 'error', error: action.error };
      }
      break;
    }

    // ── Recording ────────────────────────────────────────────────
    case 'recording': {
      if (action.type === 'TOGGLE_PAUSE') {
        return { ...state, isPaused: !state.isPaused };
      }
      if (action.type === 'NEXT_QUESTION') {
        return { ...state, phase: 'transitioning' };
      }
      if (action.type === 'GENERATE_INSIGHT') {
        return { ...state, phase: 'analyzing' };
      }
      break;
    }

    // ── Speaking (TTS playing) ───────────────────────────────────
    case 'speaking': {
      if (action.type === 'TTS_ENDED') {
        return { ...state, phase: 'recording' };
      }
      if (action.type === 'TTS_FAILED') {
        // Non-fatal: question still visible in chat, just resume recording
        return { ...state, phase: 'recording' };
      }
      break;
    }

    // ── Transitioning (between questions) ────────────────────────
    case 'transitioning': {
      if (action.type === 'TRANSITION_COMPLETE') {
        return {
          ...state,
          phase: 'speaking',
          currentQuestionIndex: action.questionIndex,
          lastSpokenQuestionId: action.questionId,
        };
      }
      if (action.type === 'FLOW_COMPLETE') {
        return { ...state, phase: 'recording' };
      }
      break;
    }

    // ── Analyzing ────────────────────────────────────────────────
    case 'analyzing': {
      if (action.type === 'ANALYSIS_COMPLETE') {
        return {
          ...state,
          phase: 'results',
          reportData: action.reportData,
        };
      }
      if (action.type === 'ANALYSIS_FAILED') {
        return { ...state, phase: 'error', error: action.error };
      }
      break;
    }

    // ── Results ──────────────────────────────────────────────────
    case 'results': {
      // Only RESET and ABORT_SESSION handled globally above
      break;
    }

    // ── Error ────────────────────────────────────────────────────
    case 'error': {
      if (action.type === 'RETRY') {
        // Return to idle so user can restart
        return { ...INITIAL_STATE };
      }
      break;
    }
  }

  // Invalid action for current phase — warn in dev
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[SessionMachine] Action "${action.type}" ignored in phase "${state.phase}"`
    );
  }
  return state;
}
