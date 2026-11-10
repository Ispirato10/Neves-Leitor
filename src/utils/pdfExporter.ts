import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { FiscalDocument, DanfeCustomization } from '../types/nfe';
import { DanfeView } from '../components/DanfeView';

const getHtml2Pdf = () => {
  return (html2pdf as any).default || html2pdf;
};

function applyComputedStyles(source: HTMLElement, target: HTMLElement): void {
  try {
    const computed = window.getComputedStyle(source);
    
    const bg = computed.backgroundColor;
    const color = computed.color;
    const fontSize = computed.fontSize;
    const fontWeight = computed.fontWeight;
    const textAlign = computed.textAlign;
    const borderTop = computed.borderTop;
    const borderRight = computed.borderRight;
    const borderBottom = computed.borderBottom;
    const borderLeft = computed.borderLeft;
    const paddingTop = computed.paddingTop;
    const paddingRight = computed.paddingRight;
    const paddingBottom = computed.paddingBottom;
    const paddingLeft = computed.paddingLeft;
    const width = computed.width;

    if (bg && !bg.includes('oklch') && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      target.style.backgroundColor = bg;
    }
    if (color && !color.includes('oklch')) {
      target.style.color = color;
    }
    if (fontSize) target.style.fontSize = fontSize;
    if (fontWeight) target.style.fontWeight = fontWeight;
    if (textAlign) target.style.textAlign = textAlign;
    if (borderTop && !borderTop.includes('oklch')) target.style.borderTop = borderTop;
    if (borderRight && !borderRight.includes('oklch')) target.style.borderRight = borderRight;
    if (borderBottom && !borderBottom.includes('oklch')) target.style.borderBottom = borderBottom;
    if (borderLeft && !borderLeft.includes('oklch')) target.style.borderLeft = borderLeft;

    target.style.paddingTop = paddingTop;
    target.style.paddingRight = paddingRight;
    target.style.paddingBottom = paddingBottom;
    target.style.paddingLeft = paddingLeft;
    target.style.width = width;
    target.style.boxSizing = 'border-box';
  } catch (err) {
    // ignore
  }
}

function createPristineInlineElement(sourceElement: HTMLElement): HTMLElement {
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  
  const sourceNodes = sourceElement.querySelectorAll('*');
  const cloneNodes = clone.querySelectorAll('*');

  applyComputedStyles(sourceElement, clone);

  const count = Math.min(sourceNodes.length, cloneNodes.length);
  for (let i = 0; i < count; i++) {
    applyComputedStyles(sourceNodes[i] as HTMLElement, cloneNodes[i] as HTMLElement);
  }

  // Also convert canvas elements to image data URLs
  const sourceCanvases = sourceElement.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');
  for (let i = 0; i < Math.min(sourceCanvases.length, cloneCanvases.length); i++) {
    try {
      const dataUrl = sourceCanvases[i].toDataURL('image/png');
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width = `${sourceCanvases[i].width}px`;
      img.style.height = `${sourceCanvases[i].height}px`;
      img.style.display = 'block';
      img.className = sourceCanvases[i].className;
      cloneCanvases[i].parentNode?.replaceChild(img, cloneCanvases[i]);
    } catch (e) {}
  }

  return clone;
}

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
        idToTarget: `pdf-blob-target-${doc.id}`,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 400));
    targetEl = document.getElementById(`pdf-blob-target-${doc.id}`) || tempContainer;
  }

  const pristineElement = createPristineInlineElement(targetEl);
  pristineElement.style.position = 'fixed';
  pristineElement.style.left = '-9999px';
  pristineElement.style.top = '0';
  pristineElement.style.width = '210mm';
  document.body.appendChild(pristineElement);

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

  try {
    const worker = getHtml2Pdf();
    const pdfBlob = await worker().from(pristineElement).set(opt).outputPdf('blob');

    document.body.removeChild(pristineElement);
    if (root && tempContainer) {
      try {
        root.unmount();
      } catch (e) {}
      document.body.removeChild(tempContainer);
    } else if (tempContainer) {
      document.body.removeChild(tempContainer);
    }

    return pdfBlob;
  } catch (err) {
    if (pristineElement.parentNode) document.body.removeChild(pristineElement);
    if (root && tempContainer) {
      try {
        root.unmount();
      } catch (e) {}
      document.body.removeChild(tempContainer);
    } else if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
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
  let pristineElement: HTMLElement | null = null;

  try {
    const existingElement = document.getElementById('danfe-native-preview-element');
    let targetEl = existingElement;

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
          idToTarget: `pdf-download-target-${doc.id}`,
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 400));
      targetEl = document.getElementById(`pdf-download-target-${doc.id}`) || tempContainer;
    }

    pristineElement = createPristineInlineElement(targetEl);
    pristineElement.style.position = 'fixed';
    pristineElement.style.left = '-9999px';
    pristineElement.style.top = '0';
    pristineElement.style.width = '210mm';
    document.body.appendChild(pristineElement);

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

    const worker = getHtml2Pdf();
    await worker().from(pristineElement).set(opt).save();

    if (pristineElement && pristineElement.parentNode) {
      document.body.removeChild(pristineElement);
    }
    if (root) {
      try {
        root.unmount();
      } catch (e) {}
    }
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
  } catch (error: any) {
    if (pristineElement && pristineElement.parentNode) {
      document.body.removeChild(pristineElement);
    }
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
