import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building,
  User,
  Copy,
  Check,
  FileCheck,
  PlusCircle,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FiscalDocument, DanfeCustomization } from '../types/nfe';
import { DanfeView } from './DanfeView';
import { downloadDanfePdf, downloadXmlFile } from '../utils/pdfExporter';
import { formatCurrency, formatNumber } from '../utils/xmlParser';

interface NativePdfViewerModalProps {
  doc: FiscalDocument;
  customization: DanfeCustomization;
  onClose: () => void;
  onOpenUploadNew: () => void;
  onPrevDoc?: () => void;
  onNextDoc?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const NativePdfViewerModal: React.FC<NativePdfViewerModalProps> = ({
  doc,
  customization,
  onClose,
  onOpenUploadNew,
  onPrevDoc,
  onNextDoc,
  hasPrev = false,
  hasNext = false,
}) => {
  const [activeTab, setActiveTab] = useState<'danfe' | 'interactive' | 'xml'>('danfe');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        const screenWidth = window.innerWidth - 16;
        const a4WidthPx = 794;
        const calculatedScale = Math.min(Math.max(screenWidth / a4WidthPx, 0.32), 0.95);
        setZoomScale(calculatedScale);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.15, 0.32));
  const handleResetZoom = () => setZoomScale(1);
  const handleFitMobile = () => {
    const screenWidth = window.innerWidth - 16;
    const calculatedScale = Math.min(Math.max(screenWidth / 794, 0.32), 0.95);
    setZoomScale(calculatedScale);
  };

  const handleDirectDownload = async () => {
    setIsDownloading(true);
    await downloadDanfePdf(doc, undefined, customization);
    setIsDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(doc.xmlRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'danfe', label: 'DANFE A4 Original', shortLabel: 'DANFE A4' },
    { id: 'interactive', label: 'Detalhamento Fiscal', shortLabel: 'Detalhes' },
    { id: 'xml', label: 'Código XML', shortLabel: 'XML' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col z-50 overflow-hidden"
      >
        {/* TOP CONTROL BAR */}
        <div className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          {/* LEFT: PROMINENT VOLTAR (BACK) BUTTON & DOCUMENT TITLE */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700/80 shadow-xs"
              title="Voltar para a Lista de Notas"
            >
              <ChevronLeft className="w-4 h-4 text-blue-400" />
              <span>Voltar</span>
            </button>

            {hasPrev && (
              <button
                onClick={onPrevDoc}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hidden sm:block"
                title="Nota Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div className="truncate max-w-[120px] sm:max-w-xs">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white truncate">
                  Nº {doc.numero}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono shrink-0">
                  {doc.docType}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                {doc.emitente.xNome}
              </p>
            </div>

            {hasNext && (
              <button
                onClick={onNextDoc}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hidden sm:block"
                title="Próxima Nota"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* VIEW MODE TABS (DESKTOP) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-800/90 rounded-xl relative">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`relative px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="modalActiveTab"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute inset-0 bg-blue-600 rounded-lg shadow-sm -z-10"
                    />
                  )}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT: DESKTOP ACTIONS & CLOSE X */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenUploadNew();
                }}
                className="px-3 py-1.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all flex items-center gap-1 shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-blue-200" />
                <span>+ Inserir Outro XML</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-extrabold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                title="Imprimir / Salvar como PDF Nativo"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                onClick={handleDirectDownload}
                disabled={isDownloading}
                className="px-3 py-1.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Gerando...' : 'Baixar PDF'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar Visualizador"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MOBILE TAB SELECTOR */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-1.5 grid grid-cols-3 gap-1 text-center font-bold">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-1.5 px-1 rounded-lg cursor-pointer transition-colors text-[11px] font-extrabold ${
                activeTab === t.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.shortLabel}
            </button>
          ))}
        </div>

        {/* PDF ZOOM & MOBILE PRESET TOOLBAR */}
        {activeTab === 'danfe' && (
          <div className="bg-slate-800/90 text-slate-300 px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-700/80 text-xs shrink-0 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300 text-[11px]">Zoom:</span>
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold w-10 text-center text-white text-[11px]">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={handleFitMobile}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1 transition-colors ${
                  zoomScale === 0.45 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Ajustar à Tela</span>
              </button>
              <button
                onClick={handleResetZoom}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer hidden sm:inline transition-colors ${
                  zoomScale === 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                100% (A4 Real)
              </button>
            </div>

            <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
              Chave: <strong className="text-white">{doc.chave.slice(-12)}</strong>
            </div>
          </div>
        )}

        {/* MAIN VIEWPORT BODY */}
        <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-950/80 flex justify-center items-start relative">
          {/* 1. DANFE PDF OFFICIAL PRINT VIEW IN EXACT A4 PAPER FORMAT */}
          {activeTab === 'danfe' && (
            <motion.div
              id="danfe-zoom-wrapper"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: zoomScale, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="origin-top my-2 sm:my-4"
            >
              <DanfeView
                doc={doc}
                customization={customization}
                idToTarget="danfe-native-preview-element"
              />
            </motion.div>
          )}

          {/* 2. INTERACTIVE FISCAL BREAKDOWN TAB */}
          {activeTab === 'interactive' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl w-full bg-white rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 my-2 text-slate-900 border border-slate-200"
            >
              {/* OVERVIEW BANNER */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-blue-950 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Resumo da Nota Fiscal Nº {doc.numero} (Série {doc.serie})</span>
                  </h3>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Natureza da Operação: <strong className="uppercase">{doc.natOp}</strong>
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-blue-700 block uppercase font-semibold">Valor Total da Nota</span>
                  <span className="text-xl font-extrabold text-blue-900">{formatCurrency(doc.totais.vNF)}</span>
                </div>
              </div>

              {/* EMITENTE & DESTINATÁRIO CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Emitente (Prestador / Vendedor)</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{doc.emitente.xNome}</h4>
                  {doc.emitente.xFant && <p className="text-xs font-medium text-slate-600">{doc.emitente.xFant}</p>}
                  <div className="mt-2 text-xs space-y-1 text-slate-600">
                    <p><strong>CNPJ:</strong> {doc.emitente.cnpjCpf}</p>
                    <p><strong>Inscrição Estadual:</strong> {doc.emitente.ie || 'ISENTO'}</p>
                    <p>
                      <strong>Endereço:</strong> {doc.emitente.ender.xLgr}, {doc.emitente.ender.nro} - {doc.emitente.ender.xBairro},{' '}
                      {doc.emitente.ender.xMun}/{doc.emitente.ender.uf} (CEP {doc.emitente.ender.cep})
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Destinatário (Comprador / Cliente)</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{doc.destinatario.xNome}</h4>
                  <div className="mt-2 text-xs space-y-1 text-slate-600">
                    <p><strong>CNPJ/CPF:</strong> {doc.destinatario.cnpjCpf || 'Consumidor Final'}</p>
                    <p><strong>Inscrição Estadual:</strong> {doc.destinatario.ie || 'ISENTO'}</p>
                    <p>
                      <strong>Endereço:</strong>{' '}
                      {doc.destinatario.ender.xLgr
                        ? `${doc.destinatario.ender.xLgr}, ${doc.destinatario.ender.nro} - ${doc.destinatario.ender.xMun}/${doc.destinatario.ender.uf}`
                        : 'Endereço não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* IMPOSTOS GRID */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Quadro Resumo de Impostos (SEFAZ)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">BC ICMS</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(doc.totais.vBC)}</span>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor ICMS</span>
                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(doc.totais.vICMS)}</span>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor IPI</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(doc.totais.vIPI)}</span>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">PIS + COFINS</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(doc.totais.vPIS + doc.totais.vCOFINS)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ITENS TABLE */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Lista de Itens ({doc.produtos.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-[11px] text-slate-700 uppercase">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Código</th>
                        <th className="p-2.5">Descrição</th>
                        <th className="p-2.5 text-center">NCM</th>
                        <th className="p-2.5 text-center">CFOP</th>
                        <th className="p-2.5 text-right">Qtd</th>
                        <th className="p-2.5 text-right">V. Unit</th>
                        <th className="p-2.5 text-right">V. Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {doc.produtos.map((p) => (
                        <tr key={p.nItem} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-400 font-bold">{p.nItem}</td>
                          <td className="p-2 text-slate-700">{p.cProd}</td>
                          <td className="p-2 font-sans font-semibold text-slate-900 uppercase">{p.xProd}</td>
                          <td className="p-2 text-center text-slate-600">{p.NCM}</td>
                          <td className="p-2 text-center text-slate-600">{p.CFOP}</td>
                          <td className="p-2 text-right">{formatNumber(p.qCom, 2)}</td>
                          <td className="p-2 text-right">{formatCurrency(p.vUnCom)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(p.vProd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. RAW XML CODE VIEWER */}
          {activeTab === 'xml' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl w-full bg-slate-950 rounded-2xl p-4 sm:p-6 shadow-xl my-2 text-slate-100 flex flex-col space-y-4 border border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-slate-400">
                  Arquivo: <strong className="text-slate-200">{doc.filename}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyXml}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copiado!' : 'Copiar XML'}</span>
                  </button>
                  <button
                    onClick={() => downloadXmlFile(doc)}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar XML</span>
                  </button>
                </div>
              </div>

              <pre className="font-mono text-xs text-emerald-400 bg-slate-900 p-4 rounded-xl overflow-auto max-h-[60vh] whitespace-pre-wrap leading-relaxed select-all">
                {doc.xmlRaw}
              </pre>
            </motion.div>
          )}
        </div>

        {/* FIXED MOBILE BOTTOM TOOLBAR */}
        <div className="sm:hidden bg-slate-900 border-t border-slate-800 p-2.5 flex items-center justify-between gap-1.5 z-10 shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onClose();
              onOpenUploadNew();
            }}
            className="py-2 px-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-blue-200" />
            <span>+ XML</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className="py-2 px-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Imprimir</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDirectDownload}
            disabled={isDownloading}
            className="py-2 px-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 flex-1"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Gerando...' : 'Baixar PDF'}</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
