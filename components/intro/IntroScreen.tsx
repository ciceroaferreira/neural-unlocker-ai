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
  const [introStep, setIntroStep] = useState<'initial' | 'loading' | 'playing' | 'ready' | 'error'>('initial');
  const [introVolume, setIntroVolume] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { playIntroAudio } = useAudioPlayback(85);

  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  const handlePlayIntro = useCallback(async () => {
    if (introStep === 'loading' || introStep === 'playing') return;
    setIntroStep('loading');
    setLoadingMessage('Conectando com Zephyr...');
    setErrorMessage('');
    triggerHaptic(50);

    // Show loading progress messages
    const loadingMessages = [
      'Conectando com Zephyr...',
      'Preparando síntese de voz...',
      'Carregando áudio...',
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIndex]);
    }, 2000);

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(msgInterval);
      setIntroStep('error');
      setErrorMessage('Conexão lenta. Verifique sua internet e tente novamente.');
    }, 30000);

    try {
      await playIntroAudio(
        INTRO_QUESTION,
        (vol) => setIntroVolume(vol),
        () => {
          // Audio finished
          setIntroStep('ready');
          setIntroVolume(0);
          triggerHaptic([40, 40]);
        },
        () => {
          // Audio started playing
          clearInterval(msgInterval);
          clearTimeout(timeout);
          setIntroStep('playing');
        }
      );
    } catch (e: any) {
      clearInterval(msgInterval);
      clearTimeout(timeout);
      console.error('TTS Error:', e);

      // User-friendly error message
      let friendlyMessage = 'Não foi possível reproduzir o áudio.';
      if (e?.message?.includes('network') || e?.message?.includes('fetch')) {
        friendlyMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (e?.message?.includes('API') || e?.message?.includes('key')) {
        friendlyMessage = 'Erro de configuração. Contate o suporte.';
      }

      setErrorMessage(friendlyMessage);
      setIntroStep('error');
      onError(e, 'Intro TTS');
    }
  }, [introStep, playIntroAudio, onError]);

  const handleSkipToStart = useCallback(() => {
    triggerHaptic(60);
    onStart();
  }, [onStart]);

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-[#050505] text-white font-sans overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-600/5 rounded-full blur-[100px] sm:blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-cyan-600/5 rounded-full blur-[100px] sm:blur-[150px] animate-pulse duration-[7000ms]"></div>

      <div className="max-w-3xl w-full bg-white/[0.01] border border-white/5 backdrop-blur-[100px] rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-12 md:p-20 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <header className="flex flex-col items-center mb-8 sm:mb-16">
          <div className="text-[8px] sm:text-[10px] font-black tracking-[0.4em] sm:tracking-[0.6em] uppercase text-indigo-500 mb-3 sm:mb-4 animate-pulse">
            Sincronização Subconsciente
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase text-white/90">
            Ativação Neural
          </h1>
        </header>

        <div className="space-y-8 sm:space-y-12 text-center flex flex-col items-center">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-4 sm:mb-6 flex items-center justify-center">
            <NeuralVisualizer isActive={introStep === 'playing' || introStep === 'loading'} volume={introVolume} />

            {/* Play button - initial state */}
            {introStep === 'initial' && (
              <button onClick={handlePlayIntro} className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600/20 rounded-full flex items-center justify-center border border-indigo-500/30 hover:scale-110 active:scale-95 transition-all duration-500 animate-bounce">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}

            {/* Loading spinner */}
            {introStep === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}

            {/* Error state - retry button */}
            {introStep === 'error' && (
              <button onClick={handlePlayIntro} className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/20 rounded-full flex items-center justify-center border border-red-500/30 hover:scale-110 active:scale-95 transition-all duration-500">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </button>
            )}
          </div>

          <div className="min-h-[100px] sm:min-h-[140px] flex flex-col items-center justify-center px-2">
            {introStep === 'loading' ? (
              <div className="text-center animate-in fade-in duration-500">
                <p className="text-lg sm:text-2xl md:text-3xl font-light leading-tight text-indigo-100 italic mb-3">
                  {loadingMessage}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Isso pode levar alguns segundos...
                </p>
              </div>
            ) : introStep === 'playing' ? (
              <p className="text-lg sm:text-2xl md:text-3xl font-light leading-tight text-indigo-100 italic animate-in fade-in duration-700">
                "Ouvindo Zephyr..."
              </p>
            ) : introStep === 'ready' ? (
              <p className="text-lg sm:text-2xl md:text-3xl font-light leading-tight text-gray-100 italic">
                Protocolo recebido. Bio-scan autorizado.
              </p>
            ) : introStep === 'error' ? (
              <div className="text-center animate-in fade-in duration-500">
                <p className="text-lg sm:text-xl text-red-400 mb-2">
                  {errorMessage}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Toque acima para tentar novamente
                </p>
              </div>
            ) : (
              <p className="text-lg sm:text-2xl md:text-3xl font-light leading-tight text-gray-500 italic">
                Toque acima para ouvir sua pergunta guia.
              </p>
            )}
          </div>

          <div className="w-full max-w-md space-y-3 sm:space-y-4">
            {/* Main action button - shows in ready state or as skip option */}
            {introStep === 'ready' && (
              <button
                onClick={() => { triggerHaptic(60); onStart(); }}
                className="group relative w-full py-6 sm:py-10 rounded-[2rem] sm:rounded-[2.5rem] font-black text-lg sm:text-2xl transition-all bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-[0_0_50px_rgba(79,70,229,0.3)] overflow-hidden flex items-center justify-center gap-4 sm:gap-6 animate-in zoom-in-95 duration-700"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/50 animate-pulse"></div>
                <span className="tracking-widest uppercase italic">Iniciar Bio-Scan</span>
              </button>
            )}

            {/* Skip intro button - shows during loading or error */}
            {(introStep === 'loading' || introStep === 'error') && (
              <button
                onClick={handleSkipToStart}
                className="w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white/70"
              >
                Pular e Iniciar sem Áudio
              </button>
            )}

            <button
              onClick={onHistory}
              className="w-full py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 transition-all"
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
