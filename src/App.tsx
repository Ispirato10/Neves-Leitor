/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BatchUploadArea } from './components/BatchUploadArea';
import { XmlListTable } from './components/XmlListTable';
import { NativePdfViewerModal } from './components/NativePdfViewerModal';
import { DanfeSettingsModal } from './components/DanfeSettingsModal';
import { FiscalDocument, DanfeCustomization } from './types/nfe';
import { parseFiscalXml, formatCurrency } from './utils/xmlParser';
import { downloadDanfePdf } from './utils/pdfExporter';
import { SAMPLE_XMLS } from './utils/sampleXmls';
import { DollarSign, ShieldCheck, Layers, FileCheck2, Building2 } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customization, setCustomization] = useState<DanfeCustomization>({
    showCanhoto: true,
    canhotoPosition: 'top',
    compactMode: false,
    showIBPT: true,
    fontSize: 'sm',
  });

  // Load initial demo sample
  useEffect(() => {
    try {
      const sampleDocs = SAMPLE_XMLS.map((s) => parseFiscalXml(s.xml, `${s.id}.xml`));
      setDocuments(sampleDocs);
    } catch (err) {
      console.error('Erro ao carregar notas de exemplo:', err);
    }
  }, []);

  const handleFilesParsed = (newDocs: FiscalDocument[]) => {
    setDocuments((prev) => {
      const existingChaves = new Set(prev.map((d) => d.chave));
      const filtered = newDocs.filter((d) => !existingChaves.has(d.chave));
      return [...filtered, ...prev];
    });
  };

  const handleSelectSample = (sampleXml: string, filename: string) => {
    try {
      const doc = parseFiscalXml(sampleXml, filename);
      setDocuments((prev) => [doc, ...prev.filter((d) => d.chave !== doc.chave)]);
      setSelectedDocId(doc.id);
    } catch (err: any) {
      alert(`Erro ao carregar exemplo: ${err.message}`);
    }
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocId === id) setSelectedDocId(null);
  };

  const handleClearAll = () => {
    if (confirm('Deseja realmente limpar toda a lista de notas fiscais lidas?')) {
      setDocuments([]);
      setSelectedDocId(null);
    }
  };

  const handleOpenUploadNew = () => {
    setSelectedDocId(null);
    setTimeout(() => {
      const dropzone = document.getElementById('upload-section');
      dropzone?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const selectedDocIndex = documents.findIndex((d) => d.id === selectedDocId);
  const selectedDoc = selectedDocIndex >= 0 ? documents[selectedDocIndex] : null;

  const handlePrevDoc = () => {
    if (selectedDocIndex > 0) {
      setSelectedDocId(documents[selectedDocIndex - 1].id);
    }
  };

  const handleNextDoc = () => {
    if (selectedDocIndex < documents.length - 1) {
      setSelectedDocId(documents[selectedDocIndex + 1].id);
    }
  };

  // Aggregated Stats
  const totalValor = documents.reduce((acc, d) => acc + d.totais.vNF, 0);
  const totalIcms = documents.reduce((acc, d) => acc + d.totais.vICMS, 0);
  const uniqueEmitentes = new Set(documents.map((d) => d.emitente.cnpjCpf)).size;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* TREEUNFE-STYLE AMBIENT BACKGROUND ANIMATED GLOW BLOBS */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
          x: [0, 20, 0],
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="absolute -top-40 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 via-cyan-400/20 to-transparent rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.18, 0.08],
          x: [0, -30, 0],
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        className="absolute top-60 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/15 via-teal-400/15 to-transparent rounded-full blur-3xl pointer-events-none"
      />

      {/* HEADER BAR */}
      <Header
        onOpenUpload={handleOpenUploadNew}
        onOpenSettings={() => setShowSettingsModal(true)}
        onLoadSample={() => handleSelectSample(SAMPLE_XMLS[0].xml, 'nfe_comercial_55.xml')}
        processedCount={documents.length}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        {/* HERO INTRO BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-xs"
        >
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Leitor de XML & Conversor de DANFE PDF A4 Original
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Anexe ou cole XMLs de <strong className="text-slate-700 font-semibold">NF-e (modelo 55)</strong>,{' '}
              <strong className="text-slate-700 font-semibold">NFC-e (modelo 65)</strong> e{' '}
              <strong className="text-slate-700 font-semibold">CT-e (modelo 57)</strong>. Suporta notas de múltiplas páginas no padrão oficial SEFAZ com ajustador automático para telas de celular.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Processamento 100% Seguro e Local no Navegador</span>
          </div>
        </motion.div>

        {/* KPI DASHBOARD STRIP WITH STAGGERED ENTRANCE */}
        {documents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs transition-shadow hover:shadow-md"
            >
              <span className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                Notas Processadas
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {documents.length}
                </span>
                <FileCheck2 className="w-5 h-5 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs transition-shadow hover:shadow-md"
            >
              <span className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                Valor Total Acumulado
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {formatCurrency(totalValor)}
                </span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs transition-shadow hover:shadow-md"
            >
              <span className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                Total ICMS Destacado
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-blue-900 font-mono">
                  {formatCurrency(totalIcms)}
                </span>
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs transition-shadow hover:shadow-md"
            >
              <span className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                Emitentes Distintos
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {uniqueEmitentes}
                </span>
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
            </motion.div>
          </div>
        )}

        {/* UPLOAD DROPZONE SECTION */}
        <section id="upload-section">
          <BatchUploadArea
            onFilesParsed={handleFilesParsed}
            onSelectSample={handleSelectSample}
            onViewDocDirectly={(doc) => setSelectedDocId(doc.id)}
          />
        </section>

        {/* XML MANAGEMENT DASHBOARD TABLE */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Documentos Fiscais Carregados ({documents.length})
            </h2>
            <span className="text-xs text-slate-500">
              Clique no olho 👁️ para abrir a nota convertida no formato A4 original.
            </span>
          </div>

          <XmlListTable
            documents={documents}
            onSelectDoc={(doc) => setSelectedDocId(doc.id)}
            onDownloadSinglePdf={(doc) => downloadDanfePdf(doc, 'danfe-document-canvas')}
            onDeleteDoc={handleDeleteDoc}
            onClearAll={handleClearAll}
          />
        </section>
      </main>

      {/* NATIVE INTEGRATED PDF VIEWER MODAL */}
      {selectedDoc && (
        <NativePdfViewerModal
          doc={selectedDoc}
          customization={customization}
          onClose={() => setSelectedDocId(null)}
          onOpenUploadNew={handleOpenUploadNew}
          onPrevDoc={handlePrevDoc}
          onNextDoc={handleNextDoc}
          hasPrev={selectedDocIndex > 0}
          hasNext={selectedDocIndex < documents.length - 1}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <DanfeSettingsModal
          customization={customization}
          onSave={(newSettings) => setCustomization(newSettings)}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 mt-12 py-6 px-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Neves Leitor de XML & Generator de DANFE PDF A4 Original &copy; 2026. Padrão SEFAZ Brasil.
          </p>
          <div className="flex items-center gap-4">
            <span>Processamento 100% local no seu navegador</span>
            <span>·</span>
            <a
              href="https://www.nfe.fazenda.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-blue-600 font-semibold"
            >
              Portal Nacional da NF-e
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
