import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  Trash2,
  Search,
  FileSpreadsheet,
  Archive,
  CheckSquare,
  Square,
  Code,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FiscalDocument } from '../types/nfe';
import { formatChave, formatCurrency, formatDate } from '../utils/xmlParser';
import { exportDocsToCsv, downloadMultipleDanfesZip, downloadXmlFile } from '../utils/pdfExporter';

interface XmlListTableProps {
  documents: FiscalDocument[];
  onSelectDoc: (doc: FiscalDocument) => void;
  onDownloadSinglePdf: (doc: FiscalDocument) => void;
  onDeleteDoc: (id: string) => void;
  onClearAll: () => void;
}

export const XmlListTable: React.FC<XmlListTableProps> = ({
  documents,
  onSelectDoc,
  onDownloadSinglePdf,
  onDeleteDoc,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter =
      activeFilter === 'all' ||
      doc.docType === activeFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      doc.chave.includes(term) ||
      doc.numero.includes(term) ||
      doc.emitente.xNome.toLowerCase().includes(term) ||
      doc.emitente.cnpjCpf.includes(term) ||
      doc.destinatario.xNome.toLowerCase().includes(term) ||
      doc.destinatario.cnpjCpf.includes(term);

    return matchesFilter && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchZip = async () => {
    const docsToZip = documents.filter((d) => selectedIds.includes(d.id));
    if (docsToZip.length === 0) return;

    setIsZipping(true);
    await downloadMultipleDanfesZip(docsToZip, (current, total) => {
      setZipProgress({ current, total });
    });
    setIsZipping(false);
  };

  const handleExportCsv = () => {
    const docsToExport = selectedIds.length > 0
      ? documents.filter((d) => selectedIds.includes(d.id))
      : filteredDocs;
    exportDocsToCsv(docsToExport);
  };

  const filterOptions = [
    { id: 'all', label: 'Todas', shortLabel: 'Todas', count: documents.length },
    { id: 'NFE', label: 'NF-e (55)', shortLabel: 'NF-e', count: documents.filter(d => d.docType === 'NFE').length },
    { id: 'NFCE', label: 'NFC-e (65)', shortLabel: 'NFC-e', count: documents.filter(d => d.docType === 'NFCE').length },
    { id: 'CTE', label: 'CT-e (57)', shortLabel: 'CT-e', count: documents.filter(d => d.docType === 'CTE').length },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* HEADER CONTROLS & ANIMATED FILTER TABS */}
      <div className="p-3 sm:p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        {/* MOBILE SEGMENTED CONTROL TABS (< sm) */}
        <div className="sm:hidden grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-xl w-full text-center">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`relative py-2 px-1 text-[11px] font-extrabold rounded-lg transition-colors cursor-pointer text-center z-10 flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? 'text-blue-900 font-black' : 'text-slate-600'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPillMobile"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                  />
                )}
                <div className="flex items-center gap-1">
                  <span>{option.shortLabel}</span>
                  {option.count > 0 && (
                    <span className={`text-[9px] px-1 rounded-full font-mono font-bold ${
                      isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-300/80 text-slate-700'
                    }`}>
                      {option.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* DESKTOP ANIMATED SLIDING FILTER TABS (>= sm) */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl shrink-0">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`relative px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 z-10 ${
                  isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPillDesktop"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                  />
                )}
                <span>{option.label}</span>
                {option.count > 0 && option.id !== 'all' && (
                  <span className="ml-1 text-[10px] opacity-70 font-mono">({option.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* SEARCH BAR & BATCH ACTIONS ROW */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-full md:max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Chave, Emitente, CNPJ, Nº..."
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {selectedIds.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBatchZip}
                disabled={isZipping}
                className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-xs font-extrabold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>
                  {isZipping
                    ? `ZIP (${zipProgress.current}/${zipProgress.total})...`
                    : `Baixar (${selectedIds.length}) ZIP`}
                </span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCsv}
              className="px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel/CSV</span>
            </motion.button>

            {documents.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-2 sm:py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Limpar todas as notas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE DATA WITH ANIMATED ENTRANCE */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum documento fiscal encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Arraste arquivos XML de notas fiscais no painel acima para ler e gerar os PDFs DANFE.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE RESPONSIVE CARDS VIEW (< md) */}
          <div className="md:hidden divide-y divide-slate-200">
            {filteredDocs.map((doc) => {
              const isSelected = selectedIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isSelected ? 'bg-blue-50/70' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectOne(doc.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-900 font-mono">
                            Nº {doc.numero}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                            {doc.docType}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate max-w-[190px] mt-0.5">
                          {formatChave(doc.chave)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 shrink-0">
                      {doc.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Emitente:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[190px]">
                        {doc.emitente.xNome}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Destinatário:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[190px]">
                        {doc.destinatario.xNome}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/70">
                      <span className="text-slate-500 text-[11px]">{formatDate(doc.dhEmi)}</span>
                      <span className="font-extrabold text-emerald-700 font-mono text-sm">
                        {formatCurrency(doc.totais.vNF)}
                      </span>
                    </div>
                  </div>

                  {/* MOBILE TOUCH ACTIONS BAR */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    <button
                      onClick={() => onSelectDoc(doc)}
                      className="col-span-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver DANFE A4</span>
                    </button>
                    <button
                      onClick={() => onDownloadSinglePdf(doc)}
                      className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-all"
                      title="Baixar PDF DANFE"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => onDeleteDoc(doc.id)}
                      className="py-2 px-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 active:scale-95 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer border border-slate-200 transition-all"
                      title="Remover Nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP DATA TABLE (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <button onClick={toggleSelectAll} className="cursor-pointer text-slate-500 hover:text-slate-800">
                      {selectedIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Documento & Nº</th>
                  <th className="p-3">Emitente</th>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Data Emissão</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3 text-center">Status SEFAZ</th>
                  <th className="p-3 text-center">Ações Fiscais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                <AnimatePresence>
                  {filteredDocs.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    return (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleSelectOne(doc.id)}
                            className="cursor-pointer text-slate-400 hover:text-slate-700"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* DOCUMENT TYPE & NUMBER */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 font-mono">
                              Nº {doc.numero}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {doc.docType} (Mod {doc.modelo}) · Sér {doc.serie}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[220px]" title={doc.chave}>
                            {formatChave(doc.chave)}
                          </div>
                        </td>

                        {/* EMITENTE */}
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={doc.emitente.xNome}>
                            {doc.emitente.xNome}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {doc.emitente.cnpjCpf} · {doc.emitente.ender.xMun}/{doc.emitente.ender.uf}
                          </div>
                        </td>

                        {/* DESTINATÁRIO */}
                        <td className="p-3">
                          <div className="font-medium text-slate-800 truncate max-w-[180px]" title={doc.destinatario.xNome}>
                            {doc.destinatario.xNome}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {doc.destinatario.cnpjCpf || 'Consumidor Final'}
                          </div>
                        </td>

                        {/* DATA EMISSÃO */}
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {formatDate(doc.dhEmi)}
                        </td>

                        {/* VALOR TOTAL */}
                        <td className="p-3 text-right font-bold text-slate-900 font-mono text-sm whitespace-nowrap">
                          {formatCurrency(doc.totais.vNF)}
                        </td>

                        {/* STATUS */}
                        <td className="p-3 text-center">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                            {doc.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* 👁️ NATIVE INTEGRATED PDF PREVIEW BUTTON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onSelectDoc(doc)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Visualizar Nota Convertida (A4 Original)"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>

                            {/* 📥 DIRECT DOWNLOAD PDF BUTTON */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onDownloadSinglePdf(doc)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title="Download Direto do PDF DANFE A4"
                            >
                              <Download className="w-4 h-4" />
                            </motion.button>

                            {/* 📄 DOWNLOAD XML */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => downloadXmlFile(doc)}
                              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Baixar XML Original"
                            >
                              <Code className="w-4 h-4" />
                            </motion.button>

                            {/* 🗑️ DELETE */}
                            <button
                              onClick={() => onDeleteDoc(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover Nota"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
