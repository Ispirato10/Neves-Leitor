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

function sanitizeStyleValue(val: string): string {
  if (!val) return val;
  if (val.includes('oklch') || val.includes('lab(') || val.includes('lch(')) {
    if (val.includes('oklch')) {
      return val.replace(/oklch\([^)]+\)/gi, (match) => convertOklchToRgb(match));
    }
    return val.replace(/(oklch|lab|lch|color)\([^)]+\)/gi, 'rgb(0, 0, 0)');
  }
  return val;
}

function applyComputedStyles(source: HTMLElement, target: HTMLElement): void {
  try {
    const computed = window.getComputedStyle(source);
    
    const propsToCopy = [
      'backgroundColor', 'color',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
      'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
      'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
      'textAlign', 'verticalAlign', 'textTransform',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'display', 'flexDirection', 'justifyContent', 'alignItems', 'flexWrap', 'flex', 'gap',
      'gridTemplateColumns', 'gridTemplateRows',
      'boxSizing', 'overflow'
    ];

    for (const prop of propsToCopy) {
      const val = (computed as any)[prop];
      if (val) {
        const sanitized = sanitizeStyleValue(val);
        (target.style as any)[prop] = sanitized;
      }
    }

    let bg = computed.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      target.style.backgroundColor = sanitizeStyleValue(bg);
    }
    let col = computed.color;
    if (col) {
      target.style.color = sanitizeStyleValue(col);
    }

    target.style.boxSizing = 'border-box';
    target.style.opacity = '1';
    target.style.visibility = 'visible';
  } catch (err) {
    // ignore
  }
}

function createPristineInlineElement(sourceElement: HTMLElement): HTMLElement {
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  
  clone.style.opacity = '1';
  clone.style.visibility = 'visible';
  clone.style.display = 'block';
  clone.style.backgroundColor = '#ffffff';
  clone.style.width = '210mm';
  clone.style.height = 'auto';

  const sourceNodes = sourceElement.querySelectorAll('*');
  const cloneNodes = clone.querySelectorAll('*');

  applyComputedStyles(sourceElement, clone);

  const count = Math.min(sourceNodes.length, cloneNodes.length);
  for (let i = 0; i < count; i++) {
    applyComputedStyles(sourceNodes[i] as HTMLElement, cloneNodes[i] as HTMLElement);
    (cloneNodes[i] as HTMLElement).style.opacity = '1';
    (cloneNodes[i] as HTMLElement).style.visibility = 'visible';
  }

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
      onclone: (clonedDoc: Document) => {
        const styleEls = clonedDoc.querySelectorAll('style');
        styleEls.forEach((st) => {
          if (st.textContent && st.textContent.includes('oklch')) {
            st.textContent = st.textContent.replace(/oklch\([^)]+\)/gi, 'rgb(0,0,0)');
          }
        });
      },
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
        onclone: (clonedDoc: Document) => {
          const styleEls = clonedDoc.querySelectorAll('style');
          styleEls.forEach((st) => {
            if (st.textContent && st.textContent.includes('oklch')) {
              st.textContent = st.textContent.replace(/oklch\([^)]+\)/gi, 'rgb(0,0,0)');
            }
          });
        },
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
