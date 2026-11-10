import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { FiscalDocument } from '../types/nfe';

export async function generatePdfBlobFromElement(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento DANFE não encontrado no DOM.');
  }

  // Preserve width during canvas capture
  const originalWidth = element.style.width;
  element.style.width = '210mm';

  // High-resolution canvas capture for crisp vector text rendering
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1240,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 0,
  });

  element.style.width = originalWidth;

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  while (heightLeft >= 3) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  return pdf.output('blob');
}

export async function downloadDanfePdf(doc: FiscalDocument, elementId: string = 'danfe-document-canvas'): Promise<void> {
  try {
    const targetId = document.getElementById('danfe-native-preview-element')
      ? 'danfe-native-preview-element'
      : (document.getElementById(elementId) ? elementId : 'danfe-native-preview-element');

    const blob = await generatePdfBlobFromElement(targetId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanChave = doc.chave.replace(/\D/g, '');
    link.download = `DANFE_${doc.docType}_N${doc.numero}_${cleanChave.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao gerar PDF da DANFE:', error);
    alert('Erro ao gerar PDF. Certifique-se de que a nota está visível na tela.');
  }
}

export async function downloadMultipleDanfesZip(
  docs: FiscalDocument[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (docs.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('DANFEs_PDF_A4') || zip;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (onProgress) onProgress(i + 1, docs.length);

    try {
      const targetId = 'danfe-native-preview-element';
      const blob = await generatePdfBlobFromElement(targetId);

      const cleanChave = doc.chave.replace(/\D/g, '');
      const fileName = `DANFE_${doc.docType}_N${doc.numero}_${cleanChave.slice(-8)}.pdf`;
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
