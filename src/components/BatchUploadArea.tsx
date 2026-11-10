import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, Sparkles, Eye, ArrowRight, FileCheck } from 'lucide-react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { parseFiscalXml } from '../utils/xmlParser';
import { FiscalDocument } from '../types/nfe';
import { SAMPLE_XMLS } from '../utils/sampleXmls';

interface BatchUploadAreaProps {
  onFilesParsed: (docs: FiscalDocument[]) => void;
  onSelectSample: (sampleXml: string, name: string) => void;
  onViewDocDirectly: (doc: FiscalDocument) => void;
}

export const BatchUploadArea: React.FC<BatchUploadAreaProps> = ({
  onFilesParsed,
  onSelectSample,
  onViewDocDirectly,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    count: number;
    lastDoc: FiscalDocument;
  } | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedXml, setPastedXml] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessBanner(null);

    const parsedDocs: FiscalDocument[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        if (file.name.endsWith('.zip')) {
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(file);

          for (const filename of Object.keys(zipContent.files)) {
            if (filename.toLowerCase().endsWith('.xml') && !zipContent.files[filename].dir) {
              const xmlText = await zipContent.files[filename].async('string');
              try {
                const doc = parseFiscalXml(xmlText, filename.split('/').pop() || filename);
                parsedDocs.push(doc);
              } catch (e: any) {
                errors.push(`Erro no arquivo ${filename}: ${e.message}`);
              }
            }
          }
        } else if (file.name.toLowerCase().endsWith('.xml') || file.type === 'text/xml' || file.type === 'application/xml') {
          const text = await file.text();
          const doc = parseFiscalXml(text, file.name);
          parsedDocs.push(doc);
        } else {
          const text = await file.text();
          if (text.includes('<nfeProc') || text.includes('<NFe') || text.includes('<cteProc') || text.includes('<mdfeProc')) {
            const doc = parseFiscalXml(text, file.name);
            parsedDocs.push(doc);
          } else {
            errors.push(`O arquivo ${file.name} não é um XML fiscal válido (NF-e, NFC-e, CT-e, MDF-e).`);
          }
        }
      } catch (err: any) {
        errors.push(`Falha ao ler ${file.name}: ${err.message}`);
      }
    }

    setLoading(false);

    if (parsedDocs.length > 0) {
      onFilesParsed(parsedDocs);
      setSuccessBanner({
        count: parsedDocs.length,
        lastDoc: parsedDocs[0],
      });
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(' | '));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedXml.trim()) return;
    try {
      const doc = parseFiscalXml(pastedXml, 'xml_colado.xml');
      onFilesParsed([doc]);
      setSuccessBanner({ count: 1, lastDoc: doc });
      setPastedXml('');
      setShowPasteModal(false);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(`Erro ao processar o XML colado: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* SUCCESS NOTIFICATION TOAST WITH ANIMATEPRESENCE */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-400/30 overflow-hidden relative"
          >
            {/* Ambient shine bar */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            />

            <div className="flex items-center gap-3 z-10">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight text-white flex items-center gap-1.5">
                  <span>
                    {successBanner.count === 1
                      ? `XML da Nota Fiscal Nº ${successBanner.lastDoc.numero} convertida com sucesso!`
                      : `${successBanner.count} arquivos XML convertidos com sucesso!`}
                  </span>
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                  Emitente: <strong>{successBanner.lastDoc.emitente.xNome}</strong> | Valor: R${' '}
                  {successBanner.lastDoc.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto z-10">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onViewDocDirectly(successBanner.lastDoc)}
                className="px-4 py-2 text-xs font-extrabold text-emerald-950 bg-white rounded-lg hover:bg-emerald-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Visualizar Nota Convertida (A4 Original)</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </motion.button>
              <button
                onClick={() => setSuccessBanner(null)}
                className="text-emerald-200 hover:text-white font-bold p-1 text-sm hidden sm:block cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TREEUNFE-STYLE ANIMATED DRAG & DROP AREA */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.003 }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
          isDragging
            ? 'border-blue-500 bg-blue-50/90 shadow-xl shadow-blue-500/10 scale-[1.008]'
            : 'border-slate-300/90 bg-white hover:border-blue-400 hover:bg-slate-50/80 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          multiple
          accept=".xml,.zip,text/xml,application/xml"
          className="hidden"
        />

        {/* LASER SCANNING BEAM ANIMATION ON DRAG/LOADING */}
        {(isDragging || loading) && (
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-20 shadow-sm shadow-blue-500"
          />
        )}

        <div className="max-w-md mx-auto flex flex-col items-center relative z-10">
          {/* FLOATING ANIMATED ICON WITH RIPPLE RINGS */}
          <div className="relative mb-4">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute -inset-2 bg-blue-400/20 rounded-full blur-md"
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 relative"
            >
              <UploadCloud className="w-8 h-8" />
            </motion.div>
          </div>

          <h2 className="text-lg font-extrabold text-slate-900 mb-1 tracking-tight">
            Anexe ou arraste seus arquivos XML de notas fiscais aqui
          </h2>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Suporta <strong className="text-slate-700 font-semibold">NF-e (Mod 55)</strong>,{' '}
            <strong className="text-slate-700 font-semibold">NFC-e (Mod 65)</strong>,{' '}
            <strong className="text-slate-700 font-semibold">CT-e (Mod 57)</strong> e arquivos em lote em pasta <strong className="text-slate-700 font-semibold">.ZIP</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              Anexar Arquivos XML
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPasteModal(true);
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
            >
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>Colar Código XML</span>
            </motion.button>
          </div>
        </div>

        {/* LOADING OVERLAY */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center z-30"
            >
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3 shadow-md" />
              <p className="text-xs font-bold text-slate-900 tracking-wide">
                Lendo XML e convertendo para DANFE A4 original...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ERROR FEEDBACK */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* TREEUNFE-STYLE INTERACTIVE SAMPLE PRESET CARDS */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
              Exemplos de XML para teste imediato com 1 clique:
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_XMLS.map((sample) => (
            <motion.button
              key={sample.id}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectSample(sample.xml, `${sample.id}.xml`)}
              className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 group-hover:text-blue-600 mb-1.5">
                  <span>{sample.name}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200/60">
                    {sample.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {sample.description}
                </p>
              </div>
              <div className="mt-3 text-[11px] font-extrabold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver Nota Convertida A4 &rarr;</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* PASTE XML MODAL */}
      <AnimatePresence>
        {showPasteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-600" />
                  <span>Colar Código XML da Nota Fiscal</span>
                </h3>
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cole a estrutura do XML (&lt;nfeProc&gt; ou &lt;NFe&gt;) abaixo:
                </label>
                <textarea
                  value={pastedXml}
                  onChange={(e) => setPastedXml(e.target.value)}
                  rows={10}
                  placeholder="<nfeProc xmlns='http://www.portalfiscal.inf.br/nfe'... >"
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePasteSubmit}
                  disabled={!pastedXml.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  Converter e Abrir em A4
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
