import React, { useState, useCallback } from 'react';
import NeuralVisualizer from '@/components/NeuralVisualizer';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { MANDATORY_QUESTIONS } from '@/constants/questions';

interface IntroScreenProps {
  onStart: () => void;
  onHistory: () => void;
  onError: (error: any, context: string) => void;
}

const INTRO_QUESTION = MANDATORY_QUESTIONS[0].text;

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart, onHistory, onError }) => {
  const [introStep, setIntroStep] = useState<'initial' | 'playing' | 'ready'>('initial');
  const [introVolume, setIntroVolume] = useState(0);
  const { playIntroAudio } = useAudioPlayback(85);

  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const handlePlayIntro = useCallback(async () => {
    if (introStep === 'playing') return;
    setIntroStep('playing');
    triggerHaptic(50);

    try {
      await playIntroAudio(
        INTRO_QUESTION,
        (vol) => setIntroVolume(vol),
        () => {
          setIntroStep('ready');
          setIntroVolume(0);
          triggerHaptic([40, 40]);
        }
      );
    } catch (e) {
      onError(e, 'Intro TTS');
      setIntroStep('initial');
    }
  }, [introStep, playIntroAudio, onError]);

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-[#050505] text-white font-sans overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[150px] animate-pulse duration-[7000ms]"></div>

      <div className="max-w-3xl w-full bg-white/[0.01] border border-white/5 backdrop-blur-[100px] rounded-[4rem] p-12 md:p-20 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <header className="flex flex-col items-center mb-16">
          <div className="text-[10px] font-black tracking-[0.6em] uppercase text-indigo-500 mb-4 animate-pulse">
            Sincronização Subconsciente
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white/90">
            Ativação Neural
          </h1>
        </header>

        <div className="space-y-12 text-center flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
            <NeuralVisualizer isActive={introStep === 'playing'} volume={introVolume} />
            {introStep === 'initial' && (
              <button onClick={handlePlayIntro} className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center border border-indigo-500/30 hover:scale-110 transition-all duration-500 animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>

          <div className="min-h-[140px] flex flex-col items-center justify-center">
            {introStep === 'playing' ? (
              <p className="text-2xl md:text-3xl font-light leading-tight text-indigo-100 italic animate-in fade-in duration-700">
                "Ouvindo as diretrizes de Zephyr..."
              </p>
            ) : introStep === 'ready' ? (
              <p className="text-2xl md:text-3xl font-light leading-tight text-gray-100 italic">
                Protocolo recebido. Bio-scan autorizado.
              </p>
            ) : (
              <p className="text-2xl md:text-3xl font-light leading-tight text-gray-500 italic">
                Toque acima para ouvir sua pergunta guia.
              </p>
            )}
          </div>

          <div className="w-full max-w-md space-y-4">
            {introStep === 'ready' && (
              <button
                onClick={() => { triggerHaptic(60); onStart(); }}
                className="group relative w-full py-10 rounded-[2.5rem] font-black text-2xl transition-all bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.3)] overflow-hidden flex items-center justify-center gap-6 animate-in zoom-in-95 duration-700"
              >
                <div className="w-5 h-5 rounded-full border-2 border-white/50 animate-pulse"></div>
                <span className="tracking-widest uppercase italic">Iniciar Bio-Scan</span>
              </button>
            )}
            <button
              onClick={onHistory}
              className="w-full py-4 rounded-[2rem] text-sm font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 transition-all"
            >
              Histórico de Sessões
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
