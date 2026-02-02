import React from 'react';
import NeuralVisualizer from '@/components/NeuralVisualizer';

interface RecordingPanelProps {
  isRecording: boolean;
  isPaused: boolean;
  isAnalyzing: boolean;
  volume: number;
  playingId: number | null;
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
    <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-8">
      {/* Visualizer area */}
      <div className="relative rounded-[3.5rem] border border-white/5 bg-black/40 p-2 overflow-hidden shadow-2xl min-h-[480px] flex items-center justify-center">
        <NeuralVisualizer isActive={(isRecording && !isPaused) || playingId !== null} volume={volume} />
        {isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div
              className={`relative bg-black/80 backdrop-blur-3xl w-full h-full rounded-[3rem] border transition-all duration-700 flex flex-col justify-between p-8 overflow-hidden ${
                isPaused ? 'border-indigo-500/30' : 'border-red-500/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-indigo-500' : 'bg-red-600 animate-pulse'}`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
                      {isPaused ? 'LINK SUSPENSO' : 'BIO-SCAN ATIVO'}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-cyan-400/50 uppercase tracking-[0.3em]">
                    {neuralStatus}
                  </div>
                </div>
                <div className="text-8xl font-mono font-black tracking-tighter tabular-nums text-white/90">
                  {formattedTime}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-12 flex items-end justify-between gap-[3px]">
                  {[...Array(44)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPaused
                          ? 'bg-indigo-900/20'
                          : 'bg-gradient-to-t from-red-600 via-indigo-500 to-cyan-400'
                      }`}
                      style={{
                        height: `${isPaused ? 2 : Math.max(2, volume * 1000 * (1 - Math.abs(i - 22) / 22))}px`,
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
      <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 space-y-8 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
            Neural Sync Profile
          </h3>
          <p className="text-xs text-gray-400 font-medium italic">
            Voz otimizada para ressonância subconsciente (Zephyr Engine).
          </p>
        </div>
        <div className="space-y-4 px-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
            <span>Calibração de Empatia</span>
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
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={() => { triggerHaptic(60); onStartRecording(); }}
            disabled={isAnalyzing}
            className="flex-1 py-10 rounded-[2.5rem] font-black text-xl bg-indigo-600 hover:bg-indigo-500 shadow-2xl transition-all uppercase tracking-widest"
          >
            Retomar Scan
          </button>
        ) : (
          <>
            <button
              onClick={() => { triggerHaptic(30); onTogglePause(); }}
              className={`px-10 rounded-[2.5rem] font-black border border-white/5 transition-all ${
                isPaused ? 'bg-green-600' : 'bg-white/5'
              }`}
            >
              {isPaused ? 'Retomar' : 'Pausar'}
            </button>
            {!isFlowComplete ? (
              <button
                onClick={() => { triggerHaptic([40, 30, 40]); onNextQuestion(); }}
                className="flex-1 py-10 rounded-[2.5rem] font-black text-xl bg-cyan-600 hover:bg-cyan-500 shadow-2xl transition-all uppercase tracking-widest"
              >
                Próxima Pergunta
              </button>
            ) : (
              <button
                onClick={() => { triggerHaptic([40, 30, 40]); onGenerateInsight(); }}
                disabled={!hasMessages}
                className="flex-1 py-10 rounded-[2.5rem] font-black text-xl bg-red-600 hover:bg-red-500 shadow-2xl animate-pulse uppercase tracking-widest"
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
