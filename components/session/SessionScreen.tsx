import React, { useState, useCallback } from 'react';
import { SessionMetadata } from '@/types/session';
import { ReportData } from '@/types/export';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useGeminiSession } from '@/hooks/useGeminiSession';
import { useQuestionFlow } from '@/hooks/useQuestionFlow';
import { useNeuralAnalysis } from '@/hooks/useNeuralAnalysis';
import { useTimer } from '@/hooks/useTimer';
import { useNeuralStatus } from '@/hooks/useNeuralStatus';
import { useAudioExport } from '@/hooks/useAudioExport';
import { initAudioContext } from '@/services/audioContextManager';
import RecordingPanel from './RecordingPanel';
import ChatPanel from './ChatPanel';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import ExportPanel from '@/components/export/ExportPanel';

interface SessionScreenProps {
  onBack: () => void;
  onError: (error: any, context: string) => void;
  onSessionComplete: (data: {
    messages: any[];
    analysis: any[] | null;
    aiInsights: string | null;
    questionResponses: any[];
    durationSeconds: number;
  }) => void;
}

const SessionScreen: React.FC<SessionScreenProps> = ({ onBack, onError, onSessionComplete }) => {
  const [vocalWarmth, setVocalWarmth] = useState(85);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Track which question was last spoken to prevent duplicates
  const lastShownQuestionRef = React.useRef<string | null>(null);

  const recording = useAudioRecording();
  const playback = useAudioPlayback(vocalWarmth);
  const gemini = useGeminiSession(onError);
  const questionFlow = useQuestionFlow();
  const neuralAnalysis = useNeuralAnalysis(onError);
  const timer = useTimer(recording.isRecording && !recording.isPaused);
  const neuralStatus = useNeuralStatus(recording.isRecording && !recording.isPaused);
  const audioExport = useAudioExport(recording.rawBuffers);

  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  // Track if we're already speaking to prevent duplicate audio
  const isSpeakingRef = React.useRef(false);

  // Read a question aloud via TTS
  const speakQuestion = useCallback(
    async (text: string) => {
      // Prevent duplicate audio if already speaking
      if (isSpeakingRef.current || playback.isSpeakingQuestion) {
        console.log('Already speaking, skipping duplicate TTS');
        return;
      }

      isSpeakingRef.current = true;
      try {
        await playback.playQuestion(text, () => {
          isSpeakingRef.current = false;
        });
      } catch (e) {
        isSpeakingRef.current = false;
        // TTS failure for question is non-critical, just log
        console.error('Question TTS failed:', e);
      }
    },
    [playback]
  );

  const startRecording = useCallback(async () => {
    // CRITICAL: Initialize AudioContext FIRST, directly in user gesture
    // Mobile browsers require this to allow audio playback
    try {
      await initAudioContext();
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }

    gemini.resetMessages();
    neuralAnalysis.reset();
    questionFlow.initFlow();
    timer.reset();
    audioExport.clear();
    setReportData(null);

    try {
      const capture = await recording.startCapture();
      const session = await gemini.startSession(() => {
        capture.onAudioProcess((base64) => {
          session.sendAudio(base64);
        });
      });

      // Show and speak the first question
      if (questionFlow.currentQuestion) {
        // Mark as shown BEFORE speaking to prevent useEffect from re-triggering
        lastShownQuestionRef.current = questionFlow.currentQuestion.id;
        gemini.addSystemMessage(
          questionFlow.currentQuestion.text,
          questionFlow.currentQuestion.id
        );
        speakQuestion(questionFlow.currentQuestion.text);
      }
    } catch (err) {
      onError(err, 'Hardware Link');
    }
  }, [gemini, neuralAnalysis, questionFlow, timer, audioExport, recording, onError, speakQuestion]);

  const handleNextQuestion = useCallback(async () => {
    const currentQ = questionFlow.currentQuestion;
    if (!currentQ) return;

    const userText = gemini.getUserInputsSince(questionFlow.questionStartTime.current);
    await questionFlow.addUserResponse(userText);
  }, [questionFlow, gemini]);

  // When currentQuestion changes, show it as system message and read it aloud
  React.useEffect(() => {
    const q = questionFlow.currentQuestion;
    if (q && q.id !== lastShownQuestionRef.current && recording.isRecording) {
      lastShownQuestionRef.current = q.id;
      if (questionFlow.state.currentQuestionIndex > 0) {
        gemini.addSystemMessage(q.text, q.id);
        speakQuestion(q.text);
      }
    }
  }, [questionFlow.currentQuestion, questionFlow.state.currentQuestionIndex, recording.isRecording]);

  const handleGenerateInsight = useCallback(async () => {
    recording.stopCapture();
    gemini.endSession();

    const userInputs = gemini.getAllUserInputs();
    const result = await neuralAnalysis.runAnalysis(userInputs);

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

      const report: ReportData = {
        sessionMetadata: metadata,
        transcription: gemini.messages,
        blocks: result.blocks,
        aiInsights: result.insights,
        questionResponses: questionFlow.state.responses,
        generatedAt: Date.now(),
      };
      setReportData(report);

      onSessionComplete({
        messages: gemini.messages,
        analysis: result.blocks,
        aiInsights: result.insights,
        questionResponses: questionFlow.state.responses,
        durationSeconds: timer.seconds,
      });
    }
  }, [recording, gemini, neuralAnalysis, questionFlow, timer, onSessionComplete]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* Header - compact on mobile */}
      <header className="flex-shrink-0 w-full px-3 sm:px-4 pt-2 sm:pt-4 pb-2 sm:pb-4 flex justify-center">
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          onClick={() => {
            triggerHaptic(20);
            recording.stopCapture();
            gemini.endSession();
            playback.stopCurrentAudio();
            onBack();
          }}
        >
          <svg className="w-4 h-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white/90">Neural Unlocker</h1>
        </div>
      </header>

      {/* Main content - scrollable area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 overflow-y-auto hide-scrollbar pb-4">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8">
          {/* On mobile: Chat first, then Recording Panel */}
          {/* On desktop: Recording Panel left, Chat right */}
          <div className="order-2 lg:order-1 lg:col-span-5 lg:sticky lg:top-4">
            <RecordingPanel
              isRecording={recording.isRecording}
              isPaused={recording.isPaused}
              isAnalyzing={neuralAnalysis.isAnalyzing}
              volume={recording.volume}
              playingId={playback.playingId}
              isSpeakingQuestion={playback.isSpeakingQuestion}
              formattedTime={timer.formatted}
              neuralStatus={neuralStatus}
              vocalWarmth={vocalWarmth}
              onVocalWarmthChange={setVocalWarmth}
              onTogglePause={recording.togglePause}
              onNextQuestion={handleNextQuestion}
              onGenerateInsight={handleGenerateInsight}
              onStartRecording={startRecording}
              isFlowComplete={questionFlow.state.isFlowComplete}
              hasMessages={gemini.messages.length > 0}
              isGeneratingFollowUp={questionFlow.state.isGeneratingFollowUp}
              currentQuestionIndex={questionFlow.state.currentQuestionIndex}
              totalQuestions={questionFlow.totalQuestions}
            />
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col gap-3 sm:gap-6 w-full">
            <ChatPanel
              messages={gemini.messages}
              isAnalyzing={neuralAnalysis.isAnalyzing}
              currentQuestion={questionFlow.currentQuestion}
              currentQuestionIndex={questionFlow.state.currentQuestionIndex}
              totalQuestions={questionFlow.totalQuestions}
              isGeneratingFollowUp={questionFlow.state.isGeneratingFollowUp}
              isSpeakingQuestion={playback.isSpeakingQuestion}
              playingId={playback.playingId}
              loadingAudioId={playback.loadingAudioId}
              onPlayVoice={handlePlayVoice}
            />

            {neuralAnalysis.analysis && (
              <AnalysisResults analysis={neuralAnalysis.analysis} />
            )}

            {reportData && (
              <ExportPanel
                reportData={reportData}
                onDownloadWAV={audioExport.downloadWAV}
                hasAudio={audioExport.hasAudio}
                onSaveSession={() => {
                  onSessionComplete({
                    messages: gemini.messages,
                    analysis: neuralAnalysis.analysis,
                    aiInsights: neuralAnalysis.aiInsights,
                    questionResponses: questionFlow.state.responses,
                    durationSeconds: timer.seconds,
                  });
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer - hidden on mobile during recording */}
      <footer className={`py-4 sm:py-8 opacity-10 flex-shrink-0 ${recording.isRecording ? 'hidden sm:flex' : 'flex'} flex-col items-center`}>
        <div className="text-[8px] sm:text-[10px] font-black tracking-[0.5em] sm:tracking-[1em] uppercase text-gray-400">
          Neural Security
        </div>
      </footer>
    </div>
  );
};

export default SessionScreen;
