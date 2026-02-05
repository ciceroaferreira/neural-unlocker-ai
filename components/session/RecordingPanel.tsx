import React from 'react';
import NeuralVisualizer from '@/components/NeuralVisualizer';

interface RecordingPanelProps {
  isRecording: boolean;
  isPaused: boolean;
  isAnalyzing: boolean;
  volume: number;
  playingId: number | null;
  isSpeakingQuestion: boolean;
  formattedTime: string;
  neuralStatus: string;
  vocalWarmth: number;
  onVocalWarmthChange: (value: number) => void;
  onTogglePause: () => void;
  onNextQuestion: () => void;
  onGenerateInsight: () => void;
  onStartRecording: () => void;
  onNewSession: () => void;
  isFlowComplete: boolean;
  hasMessages: boolean;
  hasReport: boolean;
  isGeneratingFollowUp: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
}

const RecordingPanel: React.FC<RecordingPanelProps> = ({
  isRecording,
  isPaused,
  isAnalyzing,
  volume,
  playingId,
  isSpeakingQuestion,
  formattedTime,
  neuralStatus,
  vocalWarmth,
  onVocalWarmthChange,
  onTogglePause,
  onNextQuestion,
  onGenerateInsight,
  onStartRecording,
  onNewSession,
  isFlowComplete,
  hasMessages,
  hasReport,
  isGeneratingFollowUp,
  currentQuestionIndex,
  totalQuestions,
}) => {
  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 w-full">
      {/* Visualizer area - smaller on mobile */}
      <div className="relative rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/5 bg-black/40 p-1.5 sm:p-2 overflow-hidden shadow-2xl min-h-[180px] sm:min-h-[280px] lg:min-h-[400px] flex items-center justify-center">
        <NeuralVisualizer isActive={(isRecording && !isPaused) || playingId !== null || isSpeakingQuestion} volume={volume} />
        {isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6">
            <div
              className={`relative bg-black/80 backdrop-blur-3xl w-full h-full rounded-[1rem] sm:rounded-[2rem] lg:rounded-[3rem] border transition-all duration-700 flex flex-col justify-between p-3 sm:p-5 lg:p-8 overflow-hidden ${
                isPaused ? 'border-indigo-500/30' : isSpeakingQuestion ? 'border-cyan-500/40' : 'border-red-500/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                      isPaused ? 'bg-indigo-500' : isSpeakingQuestion ? 'bg-cyan-400 animate-pulse' : 'bg-red-600 animate-pulse'
                    }`} />
                    <span className="text-[8px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                      {isPaused ? 'PAUSADO' : isSpeakingQuestion ? 'ZEPHYR' : 'GRAVANDO'}
                    </span>
                  </div>
                  <div className="text-[6px] sm:text-[7px] lg:text-[8px] font-mono text-cyan-400/50 uppercase tracking-[0.15em] sm:tracking-[0.2em] truncate max-w-[100px] sm:max-w-none">
                    {isSpeakingQuestion ? 'LENDO...' : neuralStatus}
                  </div>
                </div>
                <div className="text-3xl sm:text-5xl lg:text-7xl font-mono font-black tracking-tighter tabular-nums text-white/90">
                  {formattedTime}
                </div>
              </div>
              <div>
                <div className="h-6 sm:h-10 lg:h-12 flex items-end justify-between gap-[1px] sm:gap-[2px]">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPaused
                          ? 'bg-indigo-900/20'
                          : isSpeakingQuestion
                            ? 'bg-gradient-to-t from-cyan-600 via-indigo-500 to-white'
                            : 'bg-gradient-to-t from-red-600 via-indigo-500 to-cyan-400'
                      }`}
                      style={{
                        height: `${isPaused ? 2 : Math.max(2, volume * 600 * (1 - Math.abs(i - 12) / 12))}px`,
                        opacity: isPaused ? 0.1 : 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator - always visible during recording */}
      {isRecording && !isFlowComplete && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Progresso
            </span>
            <span className="text-[9px] sm:text-[11px] font-mono font-bold text-white/70">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>
          <div className="flex gap-1 sm:gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                  i < currentQuestionIndex
                    ? 'bg-green-500'
                    : i === currentQuestionIndex
                      ? isSpeakingQuestion
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-indigo-500 animate-pulse'
                      : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[8px] sm:text-[9px] text-gray-400 italic text-center leading-tight">
            {isSpeakingQuestion
              ? 'Ouvindo Zephyr...'
              : isGeneratingFollowUp
                ? 'Processando...'
                : 'Fale sua resposta, depois toque "Próxima"'
            }
          </p>
        </div>
      )}

      {/* Control buttons - larger touch targets on mobile */}
      <div className="flex gap-2 sm:gap-3">
        {!isRecording ? (
          isAnalyzing ? (
            <div className="flex-1 py-5 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-sm sm:text-lg lg:text-xl bg-white/5 shadow-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-3 text-white/70">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span>Analisando...</span>
            </div>
          ) : hasReport ? (
            <button
              onClick={() => { triggerHaptic(60); onNewSession(); }}
              className="flex-1 py-5 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-sm sm:text-lg lg:text-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:from-indigo-700 active:to-cyan-700 shadow-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Nova Sessão
            </button>
          ) : (
            <button
              onClick={() => { triggerHaptic(60); onStartRecording(); }}
              className="flex-1 py-5 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-sm sm:text-lg lg:text-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-2xl transition-all uppercase tracking-wider"
            >
              Iniciar Scan
            </button>
          )
        ) : (
          <>
            <button
              onClick={() => { triggerHaptic(30); onTogglePause(); }}
              className={`px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-xs sm:text-sm border border-white/5 transition-all ${
                isPaused ? 'bg-green-600 active:bg-green-700' : 'bg-white/5 active:bg-white/10'
              }`}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
            {!isFlowComplete ? (
              <button
                onClick={() => { triggerHaptic([40, 30, 40]); onNextQuestion(); }}
                disabled={isSpeakingQuestion || isGeneratingFollowUp}
                className={`flex-1 py-5 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-sm sm:text-lg lg:text-xl shadow-2xl transition-all uppercase tracking-wide sm:tracking-wider disabled:opacity-50 ${
                  isGeneratingFollowUp
                    ? 'bg-yellow-600'
                    : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700'
                }`}
              >
                {isSpeakingQuestion ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="hidden sm:inline">Ouvindo...</span>
                    <span className="sm:hidden">...</span>
                  </span>
                ) : isGeneratingFollowUp ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Processando</span>
                  </span>
                ) : (
                  <span>
                    <span className="hidden sm:inline">Próxima Pergunta</span>
                    <span className="sm:hidden">Próxima</span>
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => { triggerHaptic([40, 30, 40]); onGenerateInsight(); }}
                disabled={!hasMessages}
                className="flex-1 py-5 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-[2rem] font-black text-sm sm:text-lg lg:text-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:from-indigo-700 active:to-cyan-700 shadow-2xl uppercase tracking-wide sm:tracking-wider"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="hidden sm:inline">Gerar Insight</span>
                  <span className="sm:hidden">Insight</span>
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Vocal profile - collapsed by default on mobile, show only when not recording */}
      {!isRecording && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl lg:rounded-[2rem] p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500">
              Voz Zephyr
            </h3>
            <span className="text-[9px] sm:text-[10px] font-mono text-white/50">{vocalWarmth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={vocalWarmth}
            onChange={(e) => onVocalWarmthChange(parseInt(e.target.value))}
            className="w-full h-2 bg-white/5 rounded-full"
          />
        </div>
      )}
    </div>
  );
};

export default RecordingPanel;
