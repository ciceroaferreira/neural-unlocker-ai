import React, { useState } from 'react';
import { ReportData } from '@/types/export';
import { downloadMarkdown, downloadPDF } from '@/services/exportService';

interface ExportPanelProps {
  reportData: ReportData | null;
  onDownloadWAV: () => void;
  hasAudio: boolean;
  onSaveSession: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  reportData,
  onDownloadWAV,
  hasAudio,
  onSaveSession,
}) => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!reportData) return null;

  const handlePDF = async () => {
    setExportingPDF(true);
    try {
      await downloadPDF(reportData);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleSave = () => {
    onSaveSession();
    setSaved(true);
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-cyan-400">
          Exportar Relatório
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* PDF */}
        <button
          onClick={handlePDF}
          disabled={exportingPDF}
          className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all group"
        >
          {exportingPDF ? (
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 group-hover:text-white">
            PDF
          </span>
        </button>

        {/* Markdown */}
        <button
          onClick={() => downloadMarkdown(reportData)}
          className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all group"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 group-hover:text-white">
            Texto
          </span>
        </button>

        {/* WAV Audio */}
        <button
          onClick={onDownloadWAV}
          disabled={!hasAudio}
          className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all group disabled:opacity-30"
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 group-hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 group-hover:text-white">
            Áudio
          </span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all group ${
            saved
              ? 'border-green-500/30 bg-green-600/10'
              : 'border-white/5 bg-white/[0.02] hover:bg-indigo-600/20 hover:border-indigo-500/30'
          }`}
        >
          {saved ? (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 group-hover:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 group-hover:text-white">
            {saved ? 'Salvo' : 'Salvar'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
