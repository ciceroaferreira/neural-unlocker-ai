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
  isFlowComplete: boolean;
  hasMessages: boolean;
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
  isFlowComplete,
  hasMessages,
}) => {
  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  return (
    <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-8 w-full">
      {/* Visualizer area */}
      <div className="relative rounded-[2rem] sm:rounded-[3.5rem] border border-white/5 bg-black/40 p-2 overflow-hidden shadow-2xl min-h-[280px] sm:min-h-[480px] flex items-center justify-center">
        <NeuralVisualizer isActive={(isRecording && !isPaused) || playingId !== null || isSpeakingQuestion} volume={volume} />
        {isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
            <div
              className={`relative bg-black/80 backdrop-blur-3xl w-full h-full rounded-[1.5rem] sm:rounded-[3rem] border transition-all duration-700 flex flex-col justify-between p-4 sm:p-8 overflow-hidden ${
                isPaused ? 'border-indigo-500/30' : isSpeakingQuestion ? 'border-cyan-500/40' : 'border-red-500/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${
                      isPaused ? 'bg-indigo-500' : isSpeakingQuestion ? 'bg-cyan-400 animate-pulse' : 'bg-red-600 animate-pulse'
                    }`} />
                    <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white">
                      {isPaused ? 'LINK SUSPENSO' : isSpeakingQuestion ? 'ZEPHYR FALANDO' : 'BIO-SCAN ATIVO'}
                    </span>
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-mono text-cyan-400/50 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                    {isSpeakingQuestion ? 'LENDO PERGUNTA...' : neuralStatus}
                  </div>
                </div>
                <div className="text-4xl sm:text-8xl font-mono font-black tracking-tighter tabular-nums text-white/90">
                  {formattedTime}
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="h-8 sm:h-12 flex items-end justify-between gap-[2px] sm:gap-[3px]">
                  {[...Array(32)].map((_, i) => (
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
                        height: `${isPaused ? 2 : Math.max(2, volume * 800 * (1 - Math.abs(i - 16) / 16))}px`,
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

      {/* Vocal profile */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-8 space-y-4 sm:space-y-8 shadow-2xl">
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
            Neural Sync Profile
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium italic">
            Voz Zephyr - ressonância subconsciente.
          </p>
        </div>
        <div className="space-y-3 sm:space-y-4 px-1 sm:px-2">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-gray-500">
            <span>Empatia</span>
            <span>{vocalWarmth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={vocalWarmth}
            onChange={(e) => onVocalWarmthChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-full appearance-none accent-indigo-600"
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3 sm:gap-4">
        {!isRecording ? (
          <button
            onClick={() => { triggerHaptic(60); onStartRecording(); }}
            disabled={isAnalyzing}
            className="flex-1 py-6 sm:py-10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-base sm:text-xl bg-indigo-600 hover:bg-indigo-500 shadow-2xl transition-all uppercase tracking-widest"
          >
            Retomar Scan
          </button>
        ) : (
          <>
            <button
              onClick={() => { triggerHaptic(30); onTogglePause(); }}
              className={`px-6 sm:px-10 py-6 sm:py-10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-sm sm:text-base border border-white/5 transition-all ${
                isPaused ? 'bg-green-600' : 'bg-white/5'
              }`}
            >
              {isPaused ? 'Retomar' : 'Pausar'}
            </button>
            {!isFlowComplete ? (
              <button
                onClick={() => { triggerHaptic([40, 30, 40]); onNextQuestion(); }}
                disabled={isSpeakingQuestion}
                className="flex-1 py-6 sm:py-10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-sm sm:text-xl bg-cyan-600 hover:bg-cyan-500 shadow-2xl transition-all uppercase tracking-wider sm:tracking-widest disabled:opacity-50"
              >
                {isSpeakingQuestion ? 'Ouvindo...' : 'Próxima'}
              </button>
            ) : (
              <button
                onClick={() => { triggerHaptic([40, 30, 40]); onGenerateInsight(); }}
                disabled={!hasMessages}
                className="flex-1 py-6 sm:py-10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-sm sm:text-xl bg-red-600 hover:bg-red-500 shadow-2xl animate-pulse uppercase tracking-wider sm:tracking-widest"
              >
                Gerar Insight
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecordingPanel;
