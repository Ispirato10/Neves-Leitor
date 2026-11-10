import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { FiscalDocument, DanfeCustomization } from '../types/nfe';
import { DanfeView } from '../components/DanfeView';

const getHtml2Pdf = () => {
  return (html2pdf as any).default || html2pdf;
};

function convertOklchToRgb(match: string): string {
  try {
    const inner = match.replace(/^oklch\(/i, '').replace(/\)$/, '').trim();
    const parts = inner.split(/[\s/]+/);
    const lightnessStr = parts[0] || '0.5';
    let lightness = 0.5;
    if (lightnessStr.endsWith('%')) {
      lightness = parseFloat(lightnessStr) / 100;
    } else {
      lightness = parseFloat(lightnessStr);
    }

    if (isNaN(lightness)) lightness = 0.5;

    let r = 0, g = 0, b = 0;
    if (lightness >= 0.95) {
      r = 248; g = 250; b = 252; // #f8fafc
    } else if (lightness >= 0.88) {
      r = 241; g = 245; b = 249; // #f1f5f9
    } else if (lightness >= 0.80) {
      r = 226; g = 232; b = 240; // #e2e8f0
    } else if (lightness >= 0.65) {
      r = 203; g = 213; b = 225; // #cbd5e1
    } else if (lightness >= 0.45) {
      r = 100; g = 116; b = 139; // #64748b
    } else if (lightness >= 0.25) {
      r = 51; g = 65; b = 85; // #334155
    } else {
      r = 15; g = 23; b = 42; // #0f172a
    }

    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return 'rgb(0, 0, 0)';
  }
}

function sanitizeOklchInDocument(clonedDoc: Document): void {
  try {
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
        styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/gi, (match) => convertOklchToRgb(match));
      }
    });

    try {
      const sheets = clonedDoc.styleSheets;
      for (let i = 0; i < sheets.length; i++) {
        try {
          const rules = sheets[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            const ruleText = rules[j].cssText;
            if (ruleText && ruleText.includes('oklch')) {
              if (ruleText.includes('--tw-') || ruleText.includes(':root')) {
                (sheets[i] as any).deleteRule(j);
                j--;
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    const allNodes = clonedDoc.querySelectorAll('*');
    allNodes.forEach((node) => {
      const el = node as HTMLElement;
      if (el.getAttribute) {
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && inlineStyle.includes('oklch')) {
          const cleaned = inlineStyle.replace(/oklch\([^)]+\)/gi, (match) => convertOklchToRgb(match));
          el.setAttribute('style', cleaned);
        }
      }
    });
  } catch (err) {
    console.warn('Warning during oklch CSS sanitization:', err);
  }
}

export async function generatePdfBlobForDocument(
  doc: FiscalDocument,
  customization?: DanfeCustomization
): Promise<Blob> {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '0';
  tempContainer.style.top = '0';
  tempContainer.style.width = '210mm';
  tempContainer.style.opacity = '0';
  tempContainer.style.pointerEvents = 'none';
  tempContainer.style.zIndex = '-9999';
  tempContainer.style.backgroundColor = '#ffffff';
  document.body.appendChild(tempContainer);

  const root = createRoot(tempContainer);
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
      idToTarget: `pdf-blob-target-${doc.id}`,
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 400));
  const targetEl = document.getElementById(`pdf-blob-target-${doc.id}`) || tempContainer;

  const opt = {
    margin: 0,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      letterRendering: true,
      onclone: (clonedDoc: Document) => {
        sanitizeOklchInDocument(clonedDoc);
      },
    },
    jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
  };

  try {
    const worker = getHtml2Pdf();
    const pdfBlob = await worker().from(targetEl).set(opt).outputPdf('blob');

    try {
      root.unmount();
    } catch (e) {}
    document.body.removeChild(tempContainer);

    return pdfBlob;
  } catch (err) {
    try {
      root.unmount();
    } catch (e) {}
    document.body.removeChild(tempContainer);
    throw err;
  }
}

export async function downloadDanfePdf(
  doc: FiscalDocument,
  elementId?: string,
  customization?: DanfeCustomization
): Promise<void> {
  let tempContainer: HTMLElement | null = null;
  let root: any = null;

  try {
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
        idToTarget: `pdf-download-target-${doc.id}`,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 400));
    const targetEl = document.getElementById(`pdf-download-target-${doc.id}`) || tempContainer;

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
        onclone: (clonedDoc: Document) => {
          sanitizeOklchInDocument(clonedDoc);
        },
      },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
    };

    const worker = getHtml2Pdf();
    await worker().from(targetEl).set(opt).save();

    try {
      root.unmount();
    } catch (e) {}
    if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
  } catch (error: any) {
    if (root) {
      try {
        root.unmount();
      } catch (e) {}
    }
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    console.error('Erro detalhado ao baixar PDF da DANFE com html2pdf:', error);
    alert(`Ocorreu uma falha ao gerar o PDF: ${error?.message || error}`);
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
