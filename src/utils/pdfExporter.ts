import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { FiscalDocument, DanfeCustomization } from '../types/nfe';
import { DanfeView } from '../components/DanfeView';

export async function generatePdfBlobForDocument(
  doc: FiscalDocument,
  customization?: DanfeCustomization
): Promise<Blob> {
  const existingElement = document.getElementById('danfe-native-preview-element');
  let targetEl = existingElement;
  let tempContainer: HTMLElement | null = null;
  let root: any = null;

  if (!targetEl) {
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.backgroundColor = '#ffffff';
    document.body.appendChild(tempContainer);

    root = createRoot(tempContainer);
    root.render(
      React.createElement(DanfeView, {
        doc,
        customization: customization || {
          showCanhoto: true,
          canhotoPosition: 'top',
          compactMode: false,
          showIBPT: true,
          fontSize: 'sm',
        },
        idToTarget: `temp-danfe-inner-${doc.id}`,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 350));
    targetEl = document.getElementById(`temp-danfe-inner-${doc.id}`) || tempContainer;
  }

  const opt = {
    margin: 0,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
  };

  const pdfBlob = await html2pdf().from(targetEl).set(opt).outputPdf('blob');

  if (root && tempContainer) {
    try {
      root.unmount();
    } catch (e) {}
    document.body.removeChild(tempContainer);
  } else if (tempContainer) {
    document.body.removeChild(tempContainer);
  }

  return pdfBlob;
}

export async function downloadDanfePdf(
  doc: FiscalDocument,
  elementId?: string,
  customization?: DanfeCustomization
): Promise<void> {
  try {
    const existingElement = document.getElementById('danfe-native-preview-element');
    let targetEl = existingElement;
    let tempContainer: HTMLElement | null = null;
    let root: any = null;

    if (!targetEl) {
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.opacity = '0';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.zIndex = '-9999';
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);

      root = createRoot(tempContainer);
      root.render(
        React.createElement(DanfeView, {
          doc,
          customization: customization || {
            showCanhoto: true,
            canhotoPosition: 'top',
            compactMode: false,
            showIBPT: true,
            fontSize: 'sm',
          },
          idToTarget: `temp-danfe-inner-${doc.id}`,
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 350));
      targetEl = document.getElementById(`temp-danfe-inner-${doc.id}`) || tempContainer;
    }

    const cleanChave = doc.chave.replace(/\D/g, '');
    const cleanNumero = doc.numero.replace(/\D/g, '') || '0';
    const filename = `DANFE_${doc.docType}_N${cleanNumero}_${cleanChave.slice(-8)}.pdf`;

    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
    };

    await html2pdf().from(targetEl).set(opt).save();

    if (root && tempContainer) {
      try {
        root.unmount();
      } catch (e) {}
      document.body.removeChild(tempContainer);
    } else if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('Erro ao baixar PDF da DANFE com html2pdf:', error);
    alert('Ocorreu uma falha ao gerar o PDF. Por favor tente novamente.');
  }
}

export async function downloadMultipleDanfesZip(
  docs: FiscalDocument[],
  onProgress?: (current: number, total: number) => void,
  customization?: DanfeCustomization
): Promise<void> {
  if (docs.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('DANFEs_PDF_A4') || zip;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (onProgress) onProgress(i + 1, docs.length);

    try {
      const blob = await generatePdfBlobForDocument(doc, customization);
      const cleanChave = doc.chave.replace(/\D/g, '');
      const cleanNumero = doc.numero.replace(/\D/g, '') || '0';
      const fileName = `DANFE_${doc.docType}_N${cleanNumero}_${cleanChave.slice(-8)}.pdf`;
      folder.file(fileName, blob);
    } catch (err) {
      console.error(`Erro ao adicionar ${doc.filename} ao ZIP:`, err);
    }
  }

  const csvContent = generateCsvString(docs);
  zip.file('Sumario_Notas_Fiscais.csv', csvContent);

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DANFEs_PDF_A4_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCsvString(docs: FiscalDocument[]): string {
  const headers = [
    'Chave de Acesso',
    'Tipo Documento',
    'Modelo',
    'Número',
    'Série',
    'Data Emissão',
    'Emitente (CNPJ/CPF)',
    'Emitente (Razão Social)',
    'Destinatário (CNPJ/CPF)',
    'Destinatário (Razão Social)',
    'Valor Total R$',
    'Valor ICMS R$',
    'Valor IPI R$',
    'Status',
  ];

  const rows = docs.map((doc) => [
    `"${doc.chave}"`,
    `"${doc.docType}"`,
    `"${doc.modelo}"`,
    `"${doc.numero}"`,
    `"${doc.serie}"`,
    `"${doc.dhEmi}"`,
    `"${doc.emitente.cnpjCpf}"`,
    `"${doc.emitente.xNome.replace(/"/g, '""')}"`,
    `"${doc.destinatario.cnpjCpf}"`,
    `"${doc.destinatario.xNome.replace(/"/g, '""')}"`,
    `"${doc.totais.vNF.toFixed(2)}"`,
    `"${doc.totais.vICMS.toFixed(2)}"`,
    `"${doc.totais.vIPI.toFixed(2)}"`,
    `"${doc.status}"`,
  ]);

  const csvBody = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  return '\uFEFF' + csvBody;
}

export function exportDocsToCsv(docs: FiscalDocument[]): void {
  const csvContent = generateCsvString(docs);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_Notas_Fiscais_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadXmlFile(doc: FiscalDocument): void {
  const blob = new Blob([doc.xmlRaw], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.filename || `NFe_${doc.chave}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
