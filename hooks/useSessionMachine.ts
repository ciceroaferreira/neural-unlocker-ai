import { useState, useReducer, useEffect, useCallback, useRef } from 'react';
import { SessionMachineState, SessionAction } from '@/types/sessionMachine';
import { SessionMetadata } from '@/types/session';
import { ReportData } from '@/types/export';
import { sessionMachineReducer, INITIAL_STATE } from './sessionMachineReducer';
import { useAudioRecording } from './useAudioRecording';
import { useAudioPlayback, QUESTION_PROSODY } from './useAudioPlayback';
import { useGeminiSession } from './useGeminiSession';
import { useQuestionFlow } from './useQuestionFlow';
import { useNeuralAnalysis } from './useNeuralAnalysis';
import { useTimer } from './useTimer';
import { useNeuralStatus } from './useNeuralStatus';
import { useSessionAudio } from './useSessionAudio';
import { useAudioExport } from './useAudioExport';
import { initAudioContext } from '@/services/audioContextManager';
import { generateTTSAudio, TTSResult } from '@/services/ttsService';
import { MANDATORY_QUESTIONS } from '@/constants/questions';

interface UseSessionMachineOptions {
  onError: (error: any, context: string) => void;
  onSessionComplete: (data: {
    messages: any[];
    analysis: any[] | null;
    aiInsights: string | null;
    questionResponses: any[];
    durationSeconds: number;
  }) => void;
}

export function useSessionMachine({ onError, onSessionComplete }: UseSessionMachineOptions) {
  const [state, dispatch] = useReducer(sessionMachineReducer, INITIAL_STATE);

  // Vocal warmth state (UI control)
  const [vocalWarmth, setVocalWarmth] = useState(85);

  // All existing hooks — unchanged
  const recording = useAudioRecording();
  const playback = useAudioPlayback(vocalWarmth);
  const gemini = useGeminiSession(onError);
  const questionFlow = useQuestionFlow();
  const neuralAnalysis = useNeuralAnalysis(onError);
  const timer = useTimer(state.phase === 'recording' || state.phase === 'speaking' || state.phase === 'transitioning');
  const neuralStatus = useNeuralStatus(state.phase === 'recording');
  const sessionAudio = useSessionAudio();
  const audioExport = useAudioExport(sessionAudio.getSegments);

  // TTS cache: questionId → TTSResult
  const ttsCacheRef = useRef<Map<string, TTSResult>>(new Map());
  // Capture/session refs for cleanup
  const captureRef = useRef<{ stop: () => void } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }, []);

  const preloadAllQuestionsTTS = useCallback(() => {
    ttsCacheRef.current.clear();
    console.log('[TTS Cache] Pre-generating audio for all questions...');

    MANDATORY_QUESTIONS.forEach((q, index) => {
      generateTTSAudio(q.text, QUESTION_PROSODY)
        .then((result) => {
          ttsCacheRef.current.set(q.id, result);
          console.log(`[TTS Cache] Cached: ${q.id}`);
          // For Q1 (index 0): add audio to session export without playing
          if (index === 0) {
            sessionAudio.addQuestionAudio(result.audioBuffer, 0);
          }
        })
        .catch((e) => {
          console.warn(`[TTS Cache] Failed to cache ${q.id}:`, e);
        });
    });
  }, [sessionAudio]);

  // ── Phase Effects ──────────────────────────────────────────────

  // INITIALIZING: init AudioContext → preload TTS → reset hooks → start mic → start WebSocket
  useEffect(() => {
    if (state.phase !== 'initializing') return;

    let cancelled = false;

    (async () => {
      try {
        // 1. Init AudioContext (must be in user gesture chain)
        try {
          await initAudioContext();
        } catch (e) {
          console.warn('AudioContext init failed:', e);
        }

        if (cancelled) return;

        // 2. Pre-generate TTS
        preloadAllQuestionsTTS();

        // 3. Reset all hooks
        gemini.resetMessages();
        neuralAnalysis.reset();
        questionFlow.initFlow();
        timer.reset();
        sessionAudio.clear();

        if (cancelled) return;

        // 4. Start mic capture
        const capture = await recording.startCapture();
        captureRef.current = capture;

        if (cancelled) return;

        // 5. Start WebSocket transcription
        const session = await gemini.startSession(() => {
          capture.onAudioProcess((base64, rawData) => {
            session.sendAudio(base64);
            if (rawData) {
              sessionAudio.addResponseChunk(rawData);
            }
          });
        });

        if (cancelled) return;

        // 6. Show first question as text (already spoken on intro screen)
        const firstQ = MANDATORY_QUESTIONS[0];
        if (firstQ) {
          gemini.addSystemMessage(firstQ.text, firstQ.id);
          sessionAudio.startResponse(0);
        }

        dispatch({ type: 'INIT_COMPLETE' });
      } catch (err) {
        if (!cancelled) {
          onError(err, 'Hardware Link');
          dispatch({
            type: 'INIT_FAILED',
            error: {
              context: 'Hardware Link',
              message: err instanceof Error ? err.message : String(err),
              retryAction: { type: 'START_SESSION' },
              retryCount: 0,
            },
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // SPEAKING: play TTS, mute mic
  useEffect(() => {
    if (state.phase !== 'speaking') return;

    let cancelled = false;

    // Mute mic during TTS
    recording.muteCapture();

    const questionId = state.lastSpokenQuestionId;
    const questionIndex = state.currentQuestionIndex;
    const question = questionFlow.state.questions.find(q => q.id === questionId);

    if (!question) {
      dispatch({ type: 'TTS_FAILED' });
      return;
    }

    // Show question in chat
    gemini.addSystemMessage(question.text, question.id);

    const onEnded = () => {
      if (cancelled) return;
      recording.unmuteCapture();
      sessionAudio.startResponse(questionIndex);
      dispatch({ type: 'TTS_ENDED' });
    };

    const onAudioReady = (audioBuffer: AudioBuffer) => {
      sessionAudio.addQuestionAudio(audioBuffer, questionIndex);
    };

    (async () => {
      try {
        const cached = ttsCacheRef.current.get(questionId!);
        if (cached) {
          console.log(`[TTS Cache] Playing from cache: ${questionId}`);
          await playback.playQuestionFromBuffer(cached, onEnded, onAudioReady);
        } else {
          console.log(`[TTS Cache] Cache miss, generating: ${questionId}`);
          await playback.playQuestion(question.text, onEnded, onAudioReady);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Question TTS failed:', e);
          recording.unmuteCapture();
          sessionAudio.startResponse(questionIndex);
          dispatch({ type: 'TTS_FAILED' });
        }
      }
    })();

    return () => {
      cancelled = true;
      recording.unmuteCapture();
    };
  }, [state.phase, state.lastSpokenQuestionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // TRANSITIONING: finalize current response, advance question flow
  useEffect(() => {
    if (state.phase !== 'transitioning') return;

    let cancelled = false;

    (async () => {
      const currentQ = questionFlow.currentQuestion;
      if (!currentQ) {
        if (!cancelled) dispatch({ type: 'FLOW_COMPLETE' });
        return;
      }

      // Finalize current response audio
      sessionAudio.nextQuestion();

      // Record user response and advance
      const userText = gemini.getUserInputsSince(questionFlow.questionStartTime.current);
      await questionFlow.addUserResponse(userText);

      // After addUserResponse, questionFlow updates its state.
      // We need to check whether the flow is now complete or there's a next question.
      // The questionFlow hook will have updated by the time the await resolves
      // but React state may not have re-rendered yet. We check based on the math:
      const nextIndex = questionFlow.state.currentQuestionIndex + 1;
      const isComplete = nextIndex >= questionFlow.state.questions.length;

      if (cancelled) return;

      if (isComplete) {
        dispatch({ type: 'FLOW_COMPLETE' });
      } else {
        const nextQuestion = questionFlow.state.questions[nextIndex];
        dispatch({
          type: 'TRANSITION_COMPLETE',
          questionIndex: nextIndex,
          questionId: nextQuestion.id,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ANALYZING: stop recording, run analysis, generate report
  useEffect(() => {
    if (state.phase !== 'analyzing') return;

    let cancelled = false;

    (async () => {
      try {
        // Finalize pending audio
        sessionAudio.finalizeCurrentResponse();
        recording.stopCapture();
        gemini.endSession();

        const userInputs = gemini.getAllUserInputs();
        const result = await neuralAnalysis.runAnalysis(userInputs);

        if (cancelled) return;

        if (result) {
          gemini.addAiMessage(result.insights);

          const metadata: SessionMetadata = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            completedAt: Date.now(),
            durationSeconds: timer.seconds,
            questionFlowId: 'metodo-ip-v1',
            questionsAnswered: questionFlow.state.responses.length,
            totalQuestions: questionFlow.totalQuestions,
          };

          const reportData: ReportData = {
            sessionMetadata: metadata,
            transcription: gemini.messages,
            blocks: result.blocks,
            aiInsights: result.insights,
            questionResponses: questionFlow.state.responses,
            generatedAt: Date.now(),
          };

          onSessionComplete({
            messages: gemini.messages,
            analysis: result.blocks,
            aiInsights: result.insights,
            questionResponses: questionFlow.state.responses,
            durationSeconds: timer.seconds,
          });

          dispatch({ type: 'ANALYSIS_COMPLETE', reportData });
        } else {
          dispatch({
            type: 'ANALYSIS_FAILED',
            error: {
              context: 'Neural Mapping',
              message: 'Analysis returned no results',
              retryAction: { type: 'GENERATE_INSIGHT' },
              retryCount: 0,
            },
          });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'ANALYSIS_FAILED',
            error: {
              context: 'Neural Mapping',
              message: err instanceof Error ? err.message : String(err),
              retryAction: { type: 'GENERATE_INSIGHT' },
              retryCount: 0,
            },
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ABORT/RESET cleanup
  useEffect(() => {
    if (state.phase === 'idle') {
      recording.stopCapture();
      gemini.endSession();
      playback.stopCurrentAudio();
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Action Handlers (for UI) ───────────────────────────────────

  const handleStartSession = useCallback(() => {
    triggerHaptic(60);
    dispatch({ type: 'START_SESSION' });
  }, [triggerHaptic]);

  const handleNextQuestion = useCallback(() => {
    triggerHaptic([40, 30, 40]);
    dispatch({ type: 'NEXT_QUESTION' });
  }, [triggerHaptic]);

  const handleGenerateInsight = useCallback(() => {
    triggerHaptic([40, 30, 40]);
    dispatch({ type: 'GENERATE_INSIGHT' });
  }, [triggerHaptic]);

  const handleTogglePause = useCallback(() => {
    triggerHaptic(30);
    recording.togglePause();
    dispatch({ type: 'TOGGLE_PAUSE' });
  }, [triggerHaptic, recording]);

  const handleAbort = useCallback(() => {
    triggerHaptic(20);
    dispatch({ type: 'ABORT_SESSION' });
  }, [triggerHaptic]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  const handleNewSession = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handlePlayVoice = useCallback(
    async (text: string, id: number) => {
      try {
        await playback.playVoice(text, id);
      } catch (e) {
        onError(e, 'Insight TTS');
      }
    },
    [playback, onError]
  );

  // ── Derived State ──────────────────────────────────────────────

  const isRecording = state.phase === 'recording' || state.phase === 'speaking' || state.phase === 'transitioning';
  const isAnalyzing = state.phase === 'analyzing';
  const hasReport = state.phase === 'results';
  const isFlowComplete = questionFlow.state.isFlowComplete;
  const hasMessages = gemini.messages.length > 0;

  return {
    // State machine
    state,
    dispatch,

    // Derived flags
    isRecording,
    isAnalyzing,
    hasReport,
    isFlowComplete,
    hasMessages,

    // Recording state
    volume: recording.volume,
    isPaused: state.isPaused,
    formattedTime: timer.formatted,
    neuralStatus,
    vocalWarmth,
    setVocalWarmth,

    // Playback state
    playingId: playback.playingId,
    loadingAudioId: playback.loadingAudioId,
    isSpeakingQuestion: playback.isSpeakingQuestion,

    // Question flow
    currentQuestion: questionFlow.currentQuestion,
    currentQuestionIndex: questionFlow.state.currentQuestionIndex,
    totalQuestions: questionFlow.totalQuestions,
    isGeneratingFollowUp: questionFlow.state.isGeneratingFollowUp,

    // Messages & Analysis
    messages: gemini.messages,
    analysis: neuralAnalysis.analysis,
    aiInsights: neuralAnalysis.aiInsights,
    reportData: state.reportData,
    questionResponses: questionFlow.state.responses,
    durationSeconds: timer.seconds,

    // Audio export
    downloadWAV: audioExport.downloadWAV,
    hasAudio: sessionAudio.hasAudio,

    // Error
    error: state.error,

    // Handlers
    handleStartSession,
    handleNextQuestion,
    handleGenerateInsight,
    handleTogglePause,
    handleAbort,
    handleRetry,
    handleNewSession,
    handlePlayVoice,
    stopCurrentAudio: playback.stopCurrentAudio,
  };
}
