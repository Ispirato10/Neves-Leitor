import React from 'react';
import { FiscalDocument, DanfeCustomization, ProdutoItem } from '../types/nfe';
import { formatChave, formatCurrency, formatNumber } from '../utils/xmlParser';
import { Code128Barcode, QrCodeCanvas } from './BarcodeCanvas';

interface DanfeViewProps {
  doc: FiscalDocument;
  customization?: DanfeCustomization;
  idToTarget?: string;
}

// Function to chunk products into pages according to SEFAZ rules
function paginateProducts(items: ProdutoItem[]): ProdutoItem[][] {
  const PAGE_1_MAX_ITEMS = 7;
  const CONTINUATION_PAGE_MAX_ITEMS = 18;

  if (items.length <= PAGE_1_MAX_ITEMS) {
    return [items];
  }

  const pages: ProdutoItem[][] = [];
  pages.push(items.slice(0, PAGE_1_MAX_ITEMS));

  let currentIndex = PAGE_1_MAX_ITEMS;
  while (currentIndex < items.length) {
    pages.push(items.slice(currentIndex, currentIndex + CONTINUATION_PAGE_MAX_ITEMS));
    currentIndex += CONTINUATION_PAGE_MAX_ITEMS;
  }

  return pages;
}

export const DanfeView: React.FC<DanfeViewProps> = ({
  doc,
  customization = {
    showCanhoto: true,
    canhotoPosition: 'top',
    compactMode: false,
    showIBPT: true,
    fontSize: 'sm',
  },
  idToTarget = 'danfe-document-canvas',
}) => {
  const isNFCe = doc.docType === 'NFCE';
  const isCanceled = doc.status === 'Cancelada';
  const isHomologation = doc.protocolo?.tpAmb === 'Homologação';

  const totais = doc.totais;
  const emit = doc.emitente;
  const dest = doc.destinatario;
  const transp = doc.transporte;
  const cobr = doc.cobranca;
  const prot = doc.protocolo;

  const productPages = isNFCe ? [doc.produtos] : paginateProducts(doc.produtos);
  const totalPages = productPages.length;

  return (
    <div
      id={idToTarget}
      className="flex flex-col items-center gap-6 print:gap-0 font-sans select-text"
    >
      {productPages.map((pageItems, pageIdx) => {
        const pageNum = pageIdx + 1;
        const isFirstPage = pageNum === 1;
        const isLastPage = pageNum === totalPages;

        return (
          <div
            key={pageIdx}
            className={`danfe-page-sheet bg-white text-black p-4 w-[210mm] min-h-[297mm] mx-auto shadow-2xl print:shadow-none print:p-0 border border-[#cbd5e1] print:border-none print:break-after-page relative overflow-hidden ${
              customization.fontSize === 'xs'
                ? 'text-[8.5px]'
                : customization.fontSize === 'base'
                ? 'text-[10.5px]'
                : 'text-[9.5px]'
            }`}
            style={{ boxSizing: 'border-box' }}
          >
            {/* WATERMARK STAMPS FOR CANCELED OR HOMOLOGATION NOTES */}
            {isCanceled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-15 rotate-[-35deg]">
                <span className="text-[#dc2626] border-8 border-[#dc2626] font-black text-6xl tracking-widest px-8 py-4 uppercase text-center rounded-2xl">
                  NOTA FISCAL CANCELADA
                </span>
              </div>
            )}
            {isHomologation && !isCanceled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-15 rotate-[-35deg]">
                <span className="text-[#d97706] border-8 border-[#d97706] font-black text-4xl tracking-widest px-6 py-3 uppercase text-center rounded-xl">
                  AMBIENTE DE HOMOLOGAÇÃO<br />SEM VALOR FISCAL
                </span>
              </div>
            )}

            {/* ---------------- CANHOTO (STUB) - PAGE 1 ONLY ---------------- */}
            {isFirstPage && customization.showCanhoto && customization.canhotoPosition === 'top' && !isNFCe && (
              <div className="mb-1.5 border border-black p-1 text-[8.5px] relative">
                <div className="flex divide-x divide-black border-b border-black pb-1 mb-0.5">
                  <div className="w-[82%] pr-2">
                    <p className="font-bold leading-tight uppercase text-[8px]">
                      RECEBEMOS DE {emit.xNome} OS PRODUTOS / SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex-1 border-t border-black pt-0.5">
                        <span className="font-bold block text-[7.5px] text-[#334155]">DATA DE RECEBIMENTO</span>
                      </div>
                      <div className="flex-[2] border-t border-black pt-0.5">
                        <span className="font-bold block text-[7.5px] text-[#334155]">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-[18%] pl-2 text-center flex flex-col justify-center bg-[#f8fafc]">
                    <span className="font-extrabold text-[12px] leading-tight">NF-e</span>
                    <span className="font-bold text-[9.5px]">Nº {doc.numero}</span>
                    <span className="font-bold text-[9px]">SÉRIE {doc.serie}</span>
                  </div>
                </div>
                <div className="text-center text-[7.5px] tracking-widest text-[#64748b] uppercase border-t border-dashed border-black pt-0.5 font-mono">
                  - - - - - - - - - - - - - - - - - - - - CORTE NA LINHA PONTILHADA - - - - - - - - - - - - - - - - - - - -
                </div>
              </div>
            )}

            {/* ---------------- HEADER (FULL FOR PAGE 1, COMPACT FOR CONTINUATION) ---------------- */}
            {isNFCe ? (
              /* NFC-e COUPON HEADER */
              <div className="border border-black p-3 text-center mb-1">
                <h2 className="font-bold text-sm uppercase">{emit.xNome}</h2>
                <p className="text-[9px]">
                  {emit.ender.xLgr}, {emit.ender.nro} {emit.ender.xCpl} - {emit.ender.xBairro} - {emit.ender.xMun}/{emit.ender.uf}
                </p>
                <p className="text-[9px]">CNPJ: {emit.cnpjCpf} - IE: {emit.ie}</p>
                <hr className="my-1 border-black" />
                <h3 className="font-extrabold text-xs uppercase">DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</h3>
                <p className="text-[8.5px] font-semibold">Não permite aproveitamento de crédito de ICMS</p>
              </div>
            ) : isFirstPage ? (
              /* FULL PAGE 1 HEADER */
              <div className="border border-black grid grid-cols-12 divide-x divide-y divide-black mb-1">
                {/* EMITENTE */}
                <div className="col-span-4 p-1.5 flex flex-col justify-between">
                  {customization.customLogoUrl && (
                    <img
                      src={customization.customLogoUrl}
                      alt="Logo Emitente"
                      className="max-h-11 object-contain mb-1 mx-auto"
                    />
                  )}
                  <div>
                    <h1 className="font-extrabold text-[10.5px] leading-tight uppercase tracking-tight">{emit.xNome}</h1>
                    {emit.xFant && <p className="text-[8.5px] font-bold text-[#334155] uppercase">{emit.xFant}</p>}
                    <p className="text-[8px] mt-1 leading-tight text-[#1e293b]">
                      {emit.ender.xLgr}, {emit.ender.nro} {emit.ender.xCpl || ''}
                      <br />
                      {emit.ender.xBairro} - CEP: {emit.ender.cep}
                      <br />
                      {emit.ender.xMun} - {emit.ender.uf} | FONE: {emit.ender.fone || 'N/I'}
                    </p>
                  </div>
                </div>

                {/* DANFE IDENTIFIER */}
                <div className="col-span-3 p-1 text-center flex flex-col justify-between bg-[#f8fafc]">
                  <div>
                    <h2 className="font-black text-[15px] tracking-tight text-[#0f172a]">DANFE</h2>
                    <p className="text-[7px] uppercase font-extrabold leading-tight text-[#1e293b]">
                      Documento Auxiliar da Nota Fiscal Eletrônica
                    </p>
                  </div>
                  <div className="flex justify-center items-center gap-1.5 my-1">
                    <div className="border border-black px-1.5 py-0.5 font-extrabold text-[9.5px] bg-white">
                      {doc.tpNF === 0 ? '0 - ENTRADA' : '1 - SAÍDA'}
                    </div>
                    <div className="text-[9.5px] font-bold text-left leading-tight">
                      Nº {doc.numero}
                      <br />
                      SÉRIE {doc.serie}
                    </div>
                  </div>
                  <div className="text-[8.5px] font-bold">
                    FOLHA {pageNum} / {totalPages}
                  </div>
                </div>

                {/* BARCODE & CHAVE DE ACESSO */}
                <div className="col-span-5 p-1 flex flex-col justify-between">
                  <div>
                    <Code128Barcode value={doc.chave} height={34} />
                    <div className="text-[6.5px] font-bold uppercase text-[#475569] mt-0.5">CHAVE DE ACESSO DA NOTA FISCAL</div>
                    <div className="font-mono font-bold text-[9px] tracking-tight bg-[#f1f5f9] p-0.5 border border-[#cbd5e1] text-center">
                      {formatChave(doc.chave)}
                    </div>
                  </div>
                  <div className="text-[7px] leading-tight mt-1 text-[#334155]">
                    Consulta de autenticidade no portal nacional da NF-e
                    <br />
                    <span className="font-bold underline text-black">www.nfe.fazenda.gov.br/portal</span> ou no site da Sefaz
                  </div>
                </div>
              </div>
            ) : (
              /* CONTINUATION PAGE HEADER (PAGE 2, 3...) */
              <div className="border border-black grid grid-cols-12 divide-x divide-black mb-1 bg-[#f8fafc]">
                <div className="col-span-4 p-1 flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-[11px] uppercase leading-none">{emit.xNome}</h2>
                    <span className="text-[7.5px] text-[#475569] font-bold">DANFE - FOLHA DE CONTINUAÇÃO</span>
                  </div>
                </div>
                <div className="col-span-3 p-1 text-center font-bold text-[9px]">
                  <span>Nº {doc.numero} · SÉRIE {doc.serie}</span>
                  <br />
                  <span className="text-[8px] text-[#1e3a8a]">FOLHA {pageNum} / {totalPages}</span>
                </div>
                <div className="col-span-5 p-1 font-mono text-[8px] text-center">
                  <span className="text-[6.5px] font-bold text-[#64748b] block">CHAVE DE ACESSO</span>
                  <span className="font-bold">{formatChave(doc.chave)}</span>
                </div>
              </div>
            )}

            {/* ---------------- NATUREZA DA OPERAÇÃO & IE (PAGE 1 ONLY) ---------------- */}
            {isFirstPage && !isNFCe && (
              <>
                <div className="border border-black grid grid-cols-12 divide-x divide-black mb-1">
                  <div className="col-span-7 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">NATUREZA DA OPERAÇÃO</span>
                    <span className="font-bold text-[9px] uppercase">{doc.natOp}</span>
                  </div>
                  <div className="col-span-5 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                    <span className="font-bold text-[9px] font-mono">
                      {prot ? `${prot.nProt} - ${prot.dhRecbto}` : '135230001234567 - AUTORIZADO SEFAZ'}
                    </span>
                  </div>
                </div>

                <div className="border border-black grid grid-cols-12 divide-x divide-black mb-1">
                  <div className="col-span-4 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">INSCRIÇÃO ESTADUAL</span>
                    <span className="font-bold text-[8.5px]">{emit.ie || 'ISENTO'}</span>
                  </div>
                  <div className="col-span-4 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">INSC. ESTADUAL DO SUBST. TRIB.</span>
                    <span className="font-bold text-[8.5px]">{emit.ieST || '-'}</span>
                  </div>
                  <div className="col-span-4 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">CNPJ / CPF</span>
                    <span className="font-bold text-[8.5px] font-mono">{emit.cnpjCpf}</span>
                  </div>
                </div>
              </>
            )}

            {/* ---------------- DESTINATÁRIO (PAGE 1 ONLY) ---------------- */}
            {isFirstPage && (
              <div className="mb-1">
                <div className="bg-[#e2e8f0] border border-black border-b-0 px-1 py-0.5 font-bold text-[7.5px] uppercase">
                  DESTINATÁRIO / REMETENTE
                </div>
                <div className="border border-black grid grid-cols-12 divide-x divide-y divide-black">
                  <div className="col-span-7 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">NOME / RAZÃO SOCIAL</span>
                    <span className="font-bold text-[9px] uppercase">{dest.xNome}</span>
                  </div>
                  <div className="col-span-3 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">CNPJ / CPF</span>
                    <span className="font-bold text-[8.5px] font-mono">{dest.cnpjCpf || 'CONSUMIDOR FINAL'}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">DATA DA EMISSÃO</span>
                    <span className="font-bold text-[8.5px]">{doc.dhEmi.split('T')[0].split('-').reverse().join('/')}</span>
                  </div>

                  <div className="col-span-5 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">ENDEREÇO</span>
                    <span className="font-semibold text-[8px] uppercase">
                      {dest.ender.xLgr ? `${dest.ender.xLgr}, ${dest.ender.nro} ${dest.ender.xCpl || ''}` : '-'}
                    </span>
                  </div>
                  <div className="col-span-3 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">BAIRRO / DISTRITO</span>
                    <span className="font-semibold text-[8px] uppercase">{dest.ender.xBairro || '-'}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">CEP</span>
                    <span className="font-semibold text-[8px] font-mono">{dest.ender.cep || '-'}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">DATA DA SAÍDA/ENTRADA</span>
                    <span className="font-semibold text-[8px]">
                      {doc.dhSaiEnt ? doc.dhSaiEnt.split('T')[0].split('-').reverse().join('/') : '-'}
                    </span>
                  </div>

                  <div className="col-span-4 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">MUNICÍPIO</span>
                    <span className="font-semibold text-[8px] uppercase">{dest.ender.xMun || '-'}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">FONE / FAX</span>
                    <span className="font-semibold text-[8px]">{dest.ender.fone || '-'}</span>
                  </div>
                  <div className="col-span-1 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">UF</span>
                    <span className="font-semibold text-[8px]">{dest.ender.uf || '-'}</span>
                  </div>
                  <div className="col-span-3 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">INSCRIÇÃO ESTADUAL</span>
                    <span className="font-semibold text-[8px]">{dest.ie || 'ISENTO'}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">HORA DA SAÍDA</span>
                    <span className="font-semibold text-[8px]">
                      {doc.dhSaiEnt && doc.dhSaiEnt.includes('T') ? doc.dhSaiEnt.split('T')[1].substring(0, 5) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- FATURA / DUPLICATAS (PAGE 1 ONLY) ---------------- */}
            {isFirstPage && cobr.dup.length > 0 && (
              <div className="mb-1">
                <div className="bg-[#e2e8f0] border border-black border-b-0 px-1 py-0.5 font-bold text-[7.5px] uppercase">
                  FATURA / DUPLICATAS
                </div>
                <div className="border border-black p-1 grid grid-cols-6 gap-1">
                  {cobr.dup.map((dup, i) => (
                    <div key={i} className="border border-black p-0.5 text-center bg-[#f8fafc]">
                      <span className="text-[6.5px] font-bold block uppercase text-[#475569]">DUP {dup.nDup}</span>
                      <span className="text-[7.5px] font-semibold block">VENC: {dup.dVenc}</span>
                      <span className="text-[8.5px] font-bold block font-mono text-black">{formatCurrency(dup.vDup)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- CÁLCULO DO IMPOSTO (PAGE 1 ONLY) ---------------- */}
            {isFirstPage && (
              <div className="mb-1">
                <div className="bg-[#e2e8f0] border border-black border-b-0 px-1 py-0.5 font-bold text-[7.5px] uppercase">
                  CÁLCULO DO IMPOSTO
                </div>
                <div className="border border-black grid grid-cols-10 divide-x divide-y divide-black">
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">BASE DE CÁLCULO DO ICMS</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vBC)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">VALOR DO ICMS</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vICMS)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">BASE DE CÁLCULO DO ICMS ST</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vBCST)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">VALOR DO ICMS ST</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vST)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">VALOR TOTAL DOS PRODUTOS</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vProd)}</span>
                  </div>

                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">VALOR DO FRETE</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vFrete)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">VALOR DO SEGURO</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vSeg)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">DESCONTO</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vDesc)}</span>
                  </div>
                  <div className="col-span-2 p-1">
                    <span className="text-[6px] font-bold uppercase block text-[#475569]">OUTRAS DESPESAS</span>
                    <span className="font-bold text-[8.5px] font-mono block text-right">{formatCurrency(totais.vOutro)}</span>
                  </div>
                  <div className="col-span-2 p-1 bg-[#f1f5f9]">
                    <span className="text-[6px] font-bold uppercase block text-[#1e293b]">VALOR TOTAL DA NOTA</span>
                    <span className="font-extrabold text-[10px] font-mono block text-right text-black">{formatCurrency(totais.vNF)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TRANSPORTADOR (PAGE 1 ONLY) ---------------- */}
            {isFirstPage && !isNFCe && (() => {
              // Calculate volume totals if multiple volumes exist
              const volumesList = transp.vol || [];
              const hasVolumes = volumesList.length > 0;
              const totalQVol = hasVolumes ? volumesList.reduce((acc, v) => acc + (v.qVol || 0), 0) : null;
              const totalPesoB = hasVolumes ? volumesList.reduce((acc, v) => acc + (v.pesoB || 0), 0) : null;
              const totalPesoL = hasVolumes ? volumesList.reduce((acc, v) => acc + (v.pesoL || 0), 0) : null;
              
              const especieText = hasVolumes ? Array.from(new Set(volumesList.map(v => v.esp).filter(Boolean))).join(', ') || volumesList[0]?.esp : '-';
              const marcaText = hasVolumes ? Array.from(new Set(volumesList.map(v => v.marca).filter(Boolean))).join(', ') || volumesList[0]?.marca : '-';
              const numVolText = hasVolumes ? volumesList.map(v => v.nVol).filter(Boolean).join(', ') || volumesList[0]?.nVol : '-';

              return (
                <div className="mb-1">
                  <div className="bg-[#e2e8f0] border border-black border-b-0 px-1 py-0.5 font-bold text-[7.5px] uppercase">
                    TRANSPORTADOR / VOLUMES TRANSPORTADOS
                  </div>
                  <div className="border border-black grid grid-cols-12 divide-x divide-y divide-black">
                    {/* LINHA 1 */}
                    <div className="col-span-4 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">RAZÃO SOCIAL</span>
                      <span className="font-bold text-[8px] uppercase">{transp.transporta?.xNome || 'SEM OCORRÊNCIA DE TRANSPORTE'}</span>
                    </div>
                    <div className="col-span-3 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">FRETE POR CONTA</span>
                      <span className="font-bold text-[7.5px] uppercase">{transp.modFreteTexto}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">CÓD. ANTT</span>
                      <span className="font-semibold text-[7.5px]">{transp.veicTransp?.rntc || '-'}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">PLACA VEÍC.</span>
                      <span className="font-semibold text-[7.5px]">{transp.veicTransp?.placa || '-'}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">UF</span>
                      <span className="font-semibold text-[7.5px]">{transp.veicTransp?.uf || '-'}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">CNPJ / CPF</span>
                      <span className="font-semibold text-[8px] font-mono">{transp.transporta?.cnpjCpf || '-'}</span>
                    </div>

                    {/* LINHA 2 */}
                    <div className="col-span-5 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">ENDEREÇO</span>
                      <span className="font-semibold text-[7.5px] uppercase">{transp.transporta?.xEnder || '-'}</span>
                    </div>
                    <div className="col-span-3 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">MUNICÍPIO</span>
                      <span className="font-semibold text-[7.5px] uppercase">{transp.transporta?.xMun || '-'}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">UF</span>
                      <span className="font-semibold text-[7.5px]">{transp.transporta?.uf || '-'}</span>
                    </div>
                    <div className="col-span-3 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">INSCRIÇÃO ESTADUAL</span>
                      <span className="font-semibold text-[7.5px]">{transp.transporta?.ie || '-'}</span>
                    </div>

                    {/* LINHA 3 - VOLUMES */}
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">QUANTIDADE</span>
                      <span className="font-semibold text-[8px] font-mono">{totalQVol !== null && totalQVol > 0 ? totalQVol : '-'}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">ESPÉCIE</span>
                      <span className="font-semibold text-[8px] uppercase">{especieText || '-'}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">MARCA</span>
                      <span className="font-semibold text-[8px] uppercase">{marcaText || '-'}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">NUMERAÇÃO</span>
                      <span className="font-semibold text-[8px]">{numVolText || '-'}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">PESO BRUTO (KG)</span>
                      <span className="font-semibold text-[8px] font-mono">{totalPesoB !== null && totalPesoB > 0 ? formatNumber(totalPesoB, 3) : '-'}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="text-[6.5px] font-bold uppercase block text-[#475569]">PESO LÍQUIDO (KG)</span>
                      <span className="font-semibold text-[8px] font-mono">{totalPesoL !== null && totalPesoL > 0 ? formatNumber(totalPesoL, 3) : '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ---------------- DADOS DOS PRODUTOS / SERVIÇOS ---------------- */}
            <div className="mb-1">
              <div className="bg-[#e2e8f0] border border-black border-b-0 px-1 py-0.5 font-bold text-[7.5px] uppercase flex justify-between items-center">
                <span>DADOS DO PRODUTO / SERVIÇO</span>
                {totalPages > 1 && (
                  <span className="text-[#475569] font-mono">
                    EXIBINDO ITENS DE {pageItems[0]?.nItem} A {pageItems[pageItems.length - 1]?.nItem} (TOTAL {doc.produtos.length})
                  </span>
                )}
              </div>
              <div className="border border-black">
                <table className="w-full text-left border-collapse text-[7.5px]">
                  <thead>
                    <tr className="bg-[#f1f5f9] border-b border-black font-bold uppercase text-[6.5px] text-center divide-x divide-black">
                      <th className="p-0.5 w-[7%]">CÓDIGO</th>
                      <th className="p-0.5 w-[33%] text-left">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                      <th className="p-0.5 w-[7%]">NCM/SH</th>
                      <th className="p-0.5 w-[5%]">CST</th>
                      <th className="p-0.5 w-[5%]">CFOP</th>
                      <th className="p-0.5 w-[4%]">UNID</th>
                      <th className="p-0.5 w-[6%]">QTD</th>
                      <th className="p-0.5 w-[7%]">V.UNIT</th>
                      <th className="p-0.5 w-[8%]">V.TOTAL</th>
                      <th className="p-0.5 w-[7%]">BC ICMS</th>
                      <th className="p-0.5 w-[6%]">V.ICMS</th>
                      <th className="p-0.5 w-[5%]">V.IPI</th>
                      <th className="p-0.5 w-[4%]">ALÍQ. ICMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-mono">
                    {pageItems.map((item) => (
                      <tr key={item.nItem} className="divide-x divide-black hover:bg-[#f8fafc]">
                        <td className="p-0.5 text-[7px] text-center">{item.cProd}</td>
                        <td className="p-0.5 font-sans font-bold uppercase leading-tight text-[7.5px]">{item.xProd}</td>
                        <td className="p-0.5 text-center text-[7px]">{item.NCM || '-'}</td>
                        <td className="p-0.5 text-center text-[7px]">{item.icms.CST_CSOSN || '00'}</td>
                        <td className="p-0.5 text-center text-[7px]">{item.CFOP || '5102'}</td>
                        <td className="p-0.5 text-center font-bold">{item.uCom}</td>
                        <td className="p-0.5 text-right">{formatNumber(item.qCom, 2)}</td>
                        <td className="p-0.5 text-right">{formatNumber(item.vUnCom, 2)}</td>
                        <td className="p-0.5 text-right font-bold text-black">{formatNumber(item.vProd, 2)}</td>
                        <td className="p-0.5 text-right">{formatNumber(item.icms.vBC || 0, 2)}</td>
                        <td className="p-0.5 text-right">{formatNumber(item.icms.vICMS || 0, 2)}</td>
                        <td className="p-0.5 text-right">{formatNumber(item.ipi.vIPI || 0, 2)}</td>
                        <td className="p-0.5 text-center">{item.icms.pICMS ? `${item.icms.pICMS}%` : '0%'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ---------------- QR CODE (NFC-e) ---------------- */}
            {isNFCe && doc.qrcodeUrl && (
              <div className="border border-black p-2 text-center mb-1">
                <p className="text-[7.5px] font-bold uppercase mb-1">Consulte via Leitor de QR Code</p>
                <QrCodeCanvas value={doc.qrcodeUrl} size={100} />
                <p className="text-[7px] font-mono mt-1 break-all text-[#475569]">{doc.qrcodeUrl}</p>
              </div>
            )}

            {/* ---------------- DADOS ADICIONAIS (LAST PAGE ONLY) ---------------- */}
            {isLastPage && (
              <div className="mb-1">
                <div className="bg-[#e2e8f0] border border-black border-b-0 px-1 py-0.5 font-bold text-[7.5px] uppercase">
                  DADOS ADICIONAIS
                </div>
                <div className="border border-black grid grid-cols-12 divide-x divide-black min-h-[55px]">
                  <div className="col-span-8 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">INFORMAÇÕES COMPLEMENTARES</span>
                    <p className="text-[7.5px] leading-tight whitespace-pre-line text-[#0f172a] uppercase">
                      {doc.infAdic.infCpl || 'SEM INFORMAÇÕES COMPLEMENTARES INFORMADAS NO XML.'}
                    </p>
                  </div>
                  <div className="col-span-4 p-1">
                    <span className="text-[6.5px] font-bold uppercase block text-[#475569]">RESERVADO AO FISCO</span>
                    <p className="text-[7.5px] leading-tight whitespace-pre-line text-[#1e293b]">
                      {doc.infAdic.infAdFisco || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- CANHOTO (STUB) - BOTTOM OPTION ---------------- */}
            {isLastPage && customization.showCanhoto && customization.canhotoPosition === 'bottom' && !isNFCe && (
              <div className="mt-4 border border-black p-1 text-[8.5px]">
                <div className="text-center text-[7.5px] tracking-widest text-[#64748b] uppercase border-b border-dashed border-black pb-0.5 mb-1 font-mono">
                  - - - - - - - - - - - - - - - - - - - - CORTE NA LINHA PONTILHADA - - - - - - - - - - - - - - - - - - - -
                </div>
                <div className="flex divide-x divide-black pt-1">
                  <div className="w-[82%] pr-2">
                    <p className="font-bold leading-tight uppercase text-[8px]">
                      RECEBEMOS DE {emit.xNome} OS PRODUTOS / SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex-1 border-t border-black pt-0.5">
                        <span className="font-bold block text-[7.5px] text-[#334155]">DATA DE RECEBIMENTO</span>
                      </div>
                      <div className="flex-[2] border-t border-black pt-0.5">
                        <span className="font-bold block text-[7.5px] text-[#334155]">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-[18%] pl-2 text-center flex flex-col justify-center bg-[#f8fafc]">
                    <span className="font-extrabold text-[12px] leading-tight">NF-e</span>
                    <span className="font-bold text-[9.5px]">Nº {doc.numero}</span>
                    <span className="font-bold text-[9px]">SÉRIE {doc.serie}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE NUMBER FOOTER */}
            <div className="absolute bottom-2 left-4 right-4 text-[7.5px] font-mono font-bold text-[#64748b] flex justify-between border-t border-slate-200 pt-1">
              <span>Neves Leitor & DANFE</span>
              <span>PÁGINA {pageNum} DE {totalPages}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
