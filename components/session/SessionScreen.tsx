import React, { useState, useCallback, useMemo } from 'react';
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

  const startRecording = useCallback(async () => {
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

      if (questionFlow.currentQuestion) {
        gemini.addSystemMessage(
          questionFlow.currentQuestion.text,
          questionFlow.currentQuestion.id
        );
      }
    } catch (err) {
      onError(err, 'Hardware Link');
    }
  }, [gemini, neuralAnalysis, questionFlow, timer, audioExport, recording, onError]);

  const handleNextQuestion = useCallback(async () => {
    const currentQ = questionFlow.currentQuestion;
    if (!currentQ) return;

    const userText = gemini.getUserInputsSince(questionFlow.questionStartTime.current);
    await questionFlow.addUserResponse(userText);

    // After state update, the flow will have advanced. Get the new current question from state.
    // We use a timeout to wait for the state update since addUserResponse is async.
    setTimeout(() => {
      // The state will have updated by now, so we add the system message for the new current question
    }, 100);
  }, [questionFlow, gemini]);

  // Effect-like: when currentQuestion changes, show it as system message
  const lastShownQuestionRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const q = questionFlow.currentQuestion;
    if (q && q.id !== lastShownQuestionRef.current && recording.isRecording) {
      lastShownQuestionRef.current = q.id;
      // Don't re-show the first question (already shown in startRecording)
      if (questionFlow.state.currentQuestionIndex > 0) {
        gemini.addSystemMessage(q.text, q.id);
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
    <div className="min-h-screen p-4 flex flex-col items-center bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      <header className="w-full max-w-4xl flex flex-col items-center mt-6 mb-8">
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => {
            triggerHaptic(20);
            recording.stopCapture();
            gemini.endSession();
            onBack();
          }}
        >
          <svg className="w-4 h-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white/90">Neural Unlocker</h1>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        <RecordingPanel
          isRecording={recording.isRecording}
          isPaused={recording.isPaused}
          isAnalyzing={neuralAnalysis.isAnalyzing}
          volume={recording.volume}
          playingId={playback.playingId}
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
        />

        <div className="lg:col-span-7 flex flex-col gap-6">
          <ChatPanel
            messages={gemini.messages}
            isAnalyzing={neuralAnalysis.isAnalyzing}
            currentQuestion={questionFlow.currentQuestion}
            currentQuestionIndex={questionFlow.state.currentQuestionIndex}
            totalQuestions={questionFlow.totalQuestions}
            isGeneratingFollowUp={questionFlow.state.isGeneratingFollowUp}
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
      </main>

      <footer className="py-16 opacity-10 flex flex-col items-center gap-4">
        <div className="text-[11px] font-black tracking-[1.5em] uppercase text-gray-400">
          Neural Security & Integrity
        </div>
        <div className="text-[9px] font-mono text-indigo-500">
          SESSION_TOKEN: {crypto.randomUUID?.()?.slice(0, 11) || '8f2-9x1-r5k'}
        </div>
      </footer>
    </div>
  );
};

export default SessionScreen;
