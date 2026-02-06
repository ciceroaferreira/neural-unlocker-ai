import React from 'react';
import { useSessionMachine } from '@/hooks/useSessionMachine';
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
  const machine = useSessionMachine({ onError, onSessionComplete });

  const handleBack = () => {
    machine.handleAbort();
    onBack();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex-shrink-0 w-full px-3 sm:px-4 pt-2 sm:pt-4 pb-2 sm:pb-4 flex justify-center">
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          onClick={handleBack}
        >
          <svg className="w-4 h-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-white/90">Neural Unlocker</h1>
        </div>
      </header>

      {/* Error Banner */}
      {machine.error && (
        <div className="mx-3 sm:mx-4 mb-3 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-red-400">{machine.error.context}</p>
            <p className="text-[10px] sm:text-xs text-red-300/70 truncate">{machine.error.message}</p>
          </div>
          <button
            onClick={machine.handleRetry}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 overflow-y-auto hide-scrollbar pb-4">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8">
          <div className="order-2 lg:order-1 lg:col-span-5 lg:sticky lg:top-4">
            <RecordingPanel
              isRecording={machine.isRecording}
              isPaused={machine.isPaused}
              isAnalyzing={machine.isAnalyzing}
              volume={machine.volume}
              playingId={machine.playingId}
              isSpeakingQuestion={machine.isSpeakingQuestion}
              formattedTime={machine.formattedTime}
              neuralStatus={machine.neuralStatus}
              vocalWarmth={machine.vocalWarmth}
              onVocalWarmthChange={machine.setVocalWarmth}
              onTogglePause={machine.handleTogglePause}
              onNextQuestion={machine.handleNextQuestion}
              onGenerateInsight={machine.handleGenerateInsight}
              onStartRecording={machine.handleStartSession}
              onNewSession={() => {
                machine.stopCurrentAudio();
                onBack();
              }}
              isFlowComplete={machine.isFlowComplete}
              hasMessages={machine.hasMessages}
              hasReport={machine.hasReport}
              isGeneratingFollowUp={machine.isGeneratingFollowUp}
              currentQuestionIndex={machine.currentQuestionIndex}
              totalQuestions={machine.totalQuestions}
            />
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col gap-3 sm:gap-6 w-full">
            <ChatPanel
              messages={machine.messages}
              isAnalyzing={machine.isAnalyzing}
              currentQuestion={machine.currentQuestion}
              currentQuestionIndex={machine.currentQuestionIndex}
              totalQuestions={machine.totalQuestions}
              isGeneratingFollowUp={machine.isGeneratingFollowUp}
              isSpeakingQuestion={machine.isSpeakingQuestion}
              playingId={machine.playingId}
              loadingAudioId={machine.loadingAudioId}
              onPlayVoice={machine.handlePlayVoice}
            />

            {machine.analysis && (
              <AnalysisResults analysis={machine.analysis} totalBloqueios={machine.totalBloqueios} />
            )}

            {machine.reportData && (
              <ExportPanel
                reportData={machine.reportData}
                onDownloadWAV={machine.downloadWAV}
                hasAudio={machine.hasAudio}
                onSaveSession={() => {
                  onSessionComplete({
                    messages: machine.messages,
                    analysis: machine.analysis,
                    aiInsights: machine.aiInsights,
                    questionResponses: machine.questionResponses,
                    durationSeconds: machine.durationSeconds,
                  });
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 sm:py-8 opacity-10 flex-shrink-0 ${machine.isRecording ? 'hidden sm:flex' : 'flex'} flex-col items-center`}>
        <div className="text-[8px] sm:text-[10px] font-black tracking-[0.5em] sm:tracking-[1em] uppercase text-gray-400">
          Neural Security
        </div>
      </footer>
    </div>
  );
};

export default SessionScreen;
