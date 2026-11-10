import React from 'react';
import { FileText, Download, UploadCloud, Settings, HelpCircle, FileCode, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onLoadSample: () => void;
  processedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenSettings,
  onLoadSample,
  processedCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 group"
      >
        <motion.div
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shadow-blue-500/30"
        >
          XML
        </motion.div>
        <span className="group-hover:text-blue-600 transition-colors">Neves Leitor & DANFE</span>
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <a href="#dashboard" className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <span>Início</span>
          {processedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-mono font-bold">
              {processedCount}
            </span>
          )}
        </a>
        <button
          onClick={onLoadSample}
          className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Exemplos</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Configurações DANFE</span>
        </button>
        <a
          href="https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Portal SEFAZ</span>
        </a>
      </nav>

      {/* Zone 3: Primary Actions & Mobile Extras */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={onOpenSettings}
          className="md:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Configurações DANFE"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={onLoadSample}
          className="md:hidden p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          title="Carregar Exemplo XML"
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
        </button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenUpload}
          className="px-3 sm:px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">+ Carregar XMLs</span>
          <span className="sm:hidden">+ XMLs</span>
        </motion.button>
      </div>
    </header>
  );
};
