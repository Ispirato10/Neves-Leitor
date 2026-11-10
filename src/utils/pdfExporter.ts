import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { FiscalDocument, DanfeCustomization } from '../types/nfe';
import { DanfeView } from '../components/DanfeView';

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

    let alpha = 1;
    if (parts.length >= 4) {
      const alphaStr = parts[parts.length - 1];
      if (alphaStr.endsWith('%')) alpha = parseFloat(alphaStr) / 100;
      else alpha = parseFloat(alphaStr);
    }

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

    if (alpha < 1 && !isNaN(alpha)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return 'rgb(0, 0, 0)';
  }
}

function sanitizeOklchInDocument(clonedDoc: Document): void {
  try {
    // 1. Sanitize all <style> tag content
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
        styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/gi, (match) => convertOklchToRgb(match));
      }
    });

    // 2. Sanitize all inline styles on elements
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
    console.warn('Warning during oklch CSS sanitization for html2canvas:', err);
  }
}

export async function captureCanvasFromElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const originalTransform = element.style.transform;
  const originalWidth = element.style.width;

  element.style.transform = 'none';
  element.style.width = '210mm';

  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1240,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 0,
    onclone: (clonedDoc: Document) => {
      sanitizeOklchInDocument(clonedDoc);
    },
  });

  element.style.transform = originalTransform;
  element.style.width = originalWidth;

  return canvas;
}

export async function generatePdfBlobForDocument(
  doc: FiscalDocument,
  customization?: DanfeCustomization
): Promise<Blob> {
  // 1. Check if the DANFE element is currently rendered on screen in the viewer modal
  const existingElement = document.getElementById('danfe-native-preview-element');
  const zoomWrapper = document.getElementById('danfe-zoom-wrapper');

  if (existingElement) {
    // Temporarily reset modal zoom transform during capture so html2canvas gets true 100% resolution
    const originalTransform = zoomWrapper ? zoomWrapper.style.transform : '';
    if (zoomWrapper) {
      zoomWrapper.style.transform = 'none';
    }

    const pageSheets = Array.from(existingElement.querySelectorAll('.danfe-page-sheet')) as HTMLElement[];

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    if (pageSheets.length > 0) {
      for (let i = 0; i < pageSheets.length; i++) {
        if (i > 0) pdf.addPage('a4', 'portrait');
        const pageCanvas = await captureCanvasFromElement(pageSheets[i]);
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    } else {
      const canvas = await captureCanvasFromElement(existingElement as HTMLElement);
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    // Restore zoom transform on modal viewport
    if (zoomWrapper) {
      zoomWrapper.style.transform = originalTransform;
    }

    return pdf.output('blob');
  }

  // 2. Fallback: Dynamically mount a temporary DOM element if viewer modal is closed
  const tempContainer = document.createElement('div');
  tempContainer.id = `temp-danfe-mount-${Date.now()}`;
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
      idToTarget: `temp-danfe-inner-${doc.id}`,
    })
  );

  // Short pause to allow Barcode canvas and QR Code canvas to finish drawing
  await new Promise((resolve) => setTimeout(resolve, 300));

  const innerElement = document.getElementById(`temp-danfe-inner-${doc.id}`) || tempContainer;
  const pageSheets = Array.from(innerElement.querySelectorAll('.danfe-page-sheet')) as HTMLElement[];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  if (pageSheets.length > 0) {
    for (let i = 0; i < pageSheets.length; i++) {
      if (i > 0) pdf.addPage('a4', 'portrait');
      const pageSheet = pageSheets[i];
      const pageCanvas = await captureCanvasFromElement(pageSheet);
      const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
  } else {
    const canvas = await captureCanvasFromElement(innerElement as HTMLElement);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  // Clean up temporary mount
  root.unmount();
  document.body.removeChild(tempContainer);

  return pdf.output('blob');
}

export async function downloadDanfePdf(
  doc: FiscalDocument,
  elementId?: string,
  customization?: DanfeCustomization
): Promise<void> {
  try {
    const blob = await generatePdfBlobForDocument(doc, customization);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanChave = doc.chave.replace(/\D/g, '');
    const cleanNumero = doc.numero.replace(/\D/g, '') || '0';
    link.download = `DANFE_${doc.docType}_N${cleanNumero}_${cleanChave.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar PDF da DANFE:', error);
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

  // Create Summary CSV inside Zip
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
  return '\uFEFF' + csvBody; // UTF-8 BOM for Excel
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
