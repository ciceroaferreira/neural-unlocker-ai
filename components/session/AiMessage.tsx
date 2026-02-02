import React from 'react';

interface AiMessageProps {
  text: string;
  id: number;
  playingId: number | null;
  loadingAudioId: number | null;
  onPlayVoice: (text: string, id: number) => void;
}

const AiMessage: React.FC<AiMessageProps> = ({
  text,
  id,
  playingId,
  loadingAudioId,
  onPlayVoice,
}) => (
  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-10 duration-700">
    <div className="max-w-[95%] bg-white/[0.04] border border-white/10 p-12 rounded-[4rem] rounded-tl-none group shadow-2xl">
      <p className="text-[19px] text-gray-100 leading-relaxed mb-10 font-light italic">
        "{text}"
      </p>
      <div className="flex items-center gap-8 pt-10 border-t border-white/5">
        <button
          onClick={() => onPlayVoice(text, id)}
          disabled={loadingAudioId === id}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            playingId === id
              ? 'bg-indigo-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.5)]'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          {loadingAudioId === id ? (
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : playingId === id ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex-1 space-y-2">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full bg-cyan-400 transition-all ${
                playingId === id ? 'w-full duration-[25000ms] ease-linear' : 'w-0'
              }`}
            />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">
            Neural Persona Active // Fidelity: Max
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default AiMessage;
