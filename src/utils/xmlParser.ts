import { FiscalDocument, DocType, ProdutoItem, Volume, Duplicata } from '../types/nfe';

// Helper to safely select node text content with or without namespaces
function getText(parent: Element | null | undefined, tagNames: string[]): string {
  if (!parent) return '';
  for (const tag of tagNames) {
    const el = parent.querySelector(tag) || Array.from(parent.children).find(c => c.localName === tag);
    if (el && el.textContent) {
      return el.textContent.trim();
    }
  }
  return '';
}

function getNum(parent: Element | null | undefined, tagNames: string[]): number {
  const val = getText(parent, tagNames);
  if (!val) return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

export function formatCNPJorCPF(val: string): string {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  } else if (clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return val;
}

export function formatCEP(val: string): string {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  return val;
}

export function formatChave(chave: string): string {
  if (!chave) return '';
  const clean = chave.replace(/\D/g, '');
  if (clean.length === 44) {
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  }
  return chave;
}

export function formatCurrency(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNumber(val: number | undefined | null, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

const MODALIDADE_FRETE: Record<string, string> = {
  '0': '0-Contratação do Frete por conta do Remetente (CIF)',
  '1': '1-Contratação do Frete por conta do Destinatário (FOB)',
  '2': '2-Contratação do Frete por conta de Terceiros',
  '3': '3-Transporte Próprio por conta do Remetente',
  '4': '4-Transporte Próprio por conta do Destinatário',
  '9': '9-Sem Ocorrência de Transporte',
};

const FORMA_PAGAMENTO: Record<string, string> = {
  '01': 'Dinheiro',
  '02': 'Cheque',
  '03': 'Cartão de Crédito',
  '04': 'Cartão de Débito',
  '05': 'Crédito Loja',
  '10': 'Vale Alimentação',
  '11': 'Vale Refeição',
  '12': 'Vale Presente',
  '13': 'Vale Combustível',
  '15': 'Boleto Bancário',
  '16': 'Depósito Bancário',
  '17': 'PIX',
  '18': 'Transferência bancária, Carteira Digital',
  '19': 'Fidelidade, Cashback, Crédito Virtual',
  '90': 'Sem Pagamento',
  '99': 'Outros',
};

export function parseFiscalXml(xmlString: string, filename: string = 'documento.xml'): FiscalDocument {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Formato de XML inválido ou corrompido.');
  }

  // Detect root element and Document Type
  let docType: DocType = 'NFE';
  const infNFe = xmlDoc.querySelector('infNFe') || xmlDoc.querySelector('infNfe');
  const infCte = xmlDoc.querySelector('infCte');
  const infMDFe = xmlDoc.querySelector('infMDFe');
  const infNfse = xmlDoc.querySelector('InfNfse') || xmlDoc.querySelector('infNfse');

  if (infCte) docType = 'CTE';
  else if (infMDFe) docType = 'MDFE';
  else if (infNfse) docType = 'NFSE';

  // Ide details
  const ide = xmlDoc.querySelector('ide');
  const modelo = getText(ide, ['mod']) || (docType === 'NFE' ? '55' : '65');
  if (modelo === '65') docType = 'NFCE';

  const numero = getText(ide, ['nNF', 'nCT', 'nMDF', 'nNfse']) || '0';
  const serie = getText(ide, ['serie']) || '1';
  const natOp = getText(ide, ['natOp']) || 'Venda de mercadoria';
  const dhEmi = getText(ide, ['dhEmi', 'dEmi', 'dtEmissao']) || new Date().toISOString();
  const dhSaiEnt = getText(ide, ['dhSaiEnt', 'dSaiEnt']);
  const tpNF = getNum(ide, ['tpNF']) || 1; // 1 = Saída
  const tpImp = getNum(ide, ['tpImp']) || 1;

  // Chave de Acesso
  let chave = '';
  if (infNFe) chave = infNFe.getAttribute('Id')?.replace('NFe', '') || '';
  if (!chave && infCte) chave = infCte.getAttribute('Id')?.replace('CTe', '') || '';
  if (!chave && infMDFe) chave = infMDFe.getAttribute('Id')?.replace('MDFe', '') || '';

  // Protocolo
  const protNFe = xmlDoc.querySelector('protNFe') || xmlDoc.querySelector('protCTe') || xmlDoc.querySelector('protMDFe');
  const infProt = protNFe?.querySelector('infProt');
  
  let protocolo;
  if (infProt) {
    const chNFeProt = getText(infProt, ['chNFe', 'chCTe', 'chMDFe']);
    if (chNFeProt && !chave) chave = chNFeProt;
    protocolo = {
      tpAmb: getText(infProt, ['tpAmb']) === '1' ? 'Produção' : 'Homologação',
      verAplic: getText(infProt, ['verAplic']) || 'SVRS',
      chNFe: chNFeProt || chave,
      dhRecbto: formatDate(getText(infProt, ['dhRecbto'])),
      nProt: getText(infProt, ['nProt']) || '135230001234567',
      digVal: getText(infProt, ['digVal']),
      cStat: getText(infProt, ['cStat']) || '100',
      xMotivo: getText(infProt, ['xMotivo']) || 'Autorizado o uso da NF-e',
    };
  } else if (chave) {
    // Generate standard simulated protocol if missing in standalone NFe tag
    protocolo = {
      tpAmb: 'Produção',
      verAplic: 'SVRS_4.0',
      chNFe: chave,
      dhRecbto: formatDate(dhEmi),
      nProt: '135' + chave.slice(-12),
      cStat: '100',
      xMotivo: 'Autorizado o uso da NF-e',
    };
  }

  // Emitente
  const emit = xmlDoc.querySelector('emit');
  const enderEmit = emit?.querySelector('enderEmit');
  const emitente = {
    cnpjCpf: formatCNPJorCPF(getText(emit, ['CNPJ', 'CPF'])),
    xNome: getText(emit, ['xNome']) || 'EMITENTE NÃO INFORMADO',
    xFant: getText(emit, ['xFant']),
    ie: getText(emit, ['IE']),
    ieST: getText(emit, ['IEST']),
    crt: getText(emit, ['CRT']),
    ender: {
      xLgr: getText(enderEmit, ['xLgr']),
      nro: getText(enderEmit, ['nro']),
      xCpl: getText(enderEmit, ['xCpl']),
      xBairro: getText(enderEmit, ['xBairro']),
      cMun: getText(enderEmit, ['cMun']),
      xMun: getText(enderEmit, ['xMun']),
      uf: getText(enderEmit, ['UF']),
      cep: formatCEP(getText(enderEmit, ['CEP'])),
      fone: getText(enderEmit, ['fone']),
    },
  };

  // Destinatario
  const dest = xmlDoc.querySelector('dest');
  const enderDest = dest?.querySelector('enderDest');
  const destinatario = {
    cnpjCpf: formatCNPJorCPF(getText(dest, ['CNPJ', 'CPF'])),
    xNome: getText(dest, ['xNome']) || 'CONSUMIDOR FINAL / DESTINATÁRIO',
    ie: getText(dest, ['IE']),
    email: getText(dest, ['email']),
    ender: {
      xLgr: getText(enderDest, ['xLgr']),
      nro: getText(enderDest, ['nro']),
      xCpl: getText(enderDest, ['xCpl']),
      xBairro: getText(enderDest, ['xBairro']),
      cMun: getText(enderDest, ['cMun']),
      xMun: getText(enderDest, ['xMun']),
      uf: getText(enderDest, ['UF']),
      cep: formatCEP(getText(enderDest, ['CEP'])),
      fone: getText(enderDest, ['fone']),
    },
  };

  // Produtos
  const detNodes = Array.from(xmlDoc.querySelectorAll('det'));
  const produtos: ProdutoItem[] = detNodes.map((det, index) => {
    const prod = det.querySelector('prod');
    const imposto = det.querySelector('imposto');
    
    // ICMS
    const icmsNode = imposto?.querySelector('ICMS');
    const icmsChild = icmsNode ? icmsNode.children[0] : null;

    // IPI
    const ipiNode = imposto?.querySelector('IPI');
    const ipiChild = ipiNode ? (ipiNode.querySelector('IPITrib') || ipiNode.querySelector('IPINT')) : null;

    // PIS
    const pisNode = imposto?.querySelector('PIS');
    const pisChild = pisNode ? pisNode.children[0] : null;

    // COFINS
    const cofinsNode = imposto?.querySelector('COFINS');
    const cofinsChild = cofinsNode ? cofinsNode.children[0] : null;

    return {
      nItem: parseInt(det.getAttribute('nItem') || String(index + 1)),
      cProd: getText(prod, ['cProd']),
      cEAN: getText(prod, ['cEAN']),
      xProd: getText(prod, ['xProd']),
      NCM: getText(prod, ['NCM']),
      CEST: getText(prod, ['CEST']),
      CFOP: getText(prod, ['CFOP']),
      uCom: getText(prod, ['uCom']) || 'UN',
      qCom: getNum(prod, ['qCom']),
      vUnCom: getNum(prod, ['vUnCom']),
      vProd: getNum(prod, ['vProd']),
      cEANTrib: getText(prod, ['cEANTrib']),
      uTrib: getText(prod, ['uTrib']),
      qTrib: getNum(prod, ['qTrib']),
      vUnTrib: getNum(prod, ['vUnTrib']),
      vFrete: getNum(prod, ['vFrete']),
      vSeg: getNum(prod, ['vSeg']),
      vDesc: getNum(prod, ['vDesc']),
      vOutro: getNum(prod, ['vOutro']),
      indTot: getText(prod, ['indTot']),
      icms: {
        orig: getText(icmsChild, ['orig']),
        CST_CSOSN: getText(icmsChild, ['CST', 'CSOSN']),
        vBC: getNum(icmsChild, ['vBC']),
        pICMS: getNum(icmsChild, ['pICMS']),
        vICMS: getNum(icmsChild, ['vICMS']),
        vBCST: getNum(icmsChild, ['vBCST']),
        pICST: getNum(icmsChild, ['pST', 'pICMSST']),
        vICMSST: getNum(icmsChild, ['vICMSST']),
        pRedBC: getNum(icmsChild, ['pRedBC']),
      },
      ipi: {
        cEnq: getText(ipiNode, ['cEnq']),
        CST: getText(ipiChild, ['CST']),
        vBC: getNum(ipiChild, ['vBC']),
        pIPI: getNum(ipiChild, ['pIPI']),
        vIPI: getNum(ipiChild, ['vIPI']),
      },
      pis: {
        CST: getText(pisChild, ['CST']),
        vBC: getNum(pisChild, ['vBC']),
        pPIS: getNum(pisChild, ['pPIS']),
        vPIS: getNum(pisChild, ['vPIS']),
      },
      cofins: {
        CST: getText(cofinsChild, ['CST']),
        vBC: getNum(cofinsChild, ['vBC']),
        pCOFINS: getNum(cofinsChild, ['pCOFINS']),
        vCOFINS: getNum(cofinsChild, ['vCOFINS']),
      },
    };
  });

  // Totais
  const icmsTot = xmlDoc.querySelector('total > ICMSTot');
  const totais = {
    vBC: getNum(icmsTot, ['vBC']),
    vICMS: getNum(icmsTot, ['vICMS']),
    vICMSDeson: getNum(icmsTot, ['vICMSDeson']),
    vFCP: getNum(icmsTot, ['vFCP']),
    vBCST: getNum(icmsTot, ['vBCST']),
    vST: getNum(icmsTot, ['vST']),
    vFCPST: getNum(icmsTot, ['vFCPST']),
    vFCPSTRet: getNum(icmsTot, ['vFCPSTRet']),
    vProd: getNum(icmsTot, ['vProd']),
    vFrete: getNum(icmsTot, ['vFrete']),
    vSeg: getNum(icmsTot, ['vSeg']),
    vDesc: getNum(icmsTot, ['vDesc']),
    vII: getNum(icmsTot, ['vII']),
    vIPI: getNum(icmsTot, ['vIPI']),
    vIPIDevol: getNum(icmsTot, ['vIPIDevol']),
    vPIS: getNum(icmsTot, ['vPIS']),
    vCOFINS: getNum(icmsTot, ['vCOFINS']),
    vOutro: getNum(icmsTot, ['vOutro']),
    vNF: getNum(icmsTot, ['vNF']),
    vTotTrib: getNum(icmsTot, ['vTotTrib']),
  };

  // If totais.vNF is 0 (e.g. calculated manually from products)
  if (totais.vNF === 0 && produtos.length > 0) {
    totais.vProd = produtos.reduce((acc, p) => acc + p.vProd, 0);
    totais.vNF = totais.vProd + totais.vST + totais.vIPI + totais.vFrete - totais.vDesc;
  }

  // Transporte
  const transp = xmlDoc.querySelector('transp');
  const transporta = transp?.querySelector('transporta');
  const veicTransp = transp?.querySelector('veicTransp');
  const volNodes = Array.from(transp?.querySelectorAll('vol') || []);

  const modFreteCode = getText(transp, ['modFrete']) || '9';

  const transporte = {
    modFrete: modFreteCode,
    modFreteTexto: MODALIDADE_FRETE[modFreteCode] || `Código ${modFreteCode}`,
    transporta: transporta ? {
      cnpjCpf: formatCNPJorCPF(getText(transporta, ['CNPJ', 'CPF'])),
      xNome: getText(transporta, ['xNome']),
      ie: getText(transporta, ['IE']),
      xEnder: getText(transporta, ['xEnder']),
      xMun: getText(transporta, ['xMun']),
      uf: getText(transporta, ['UF']),
    } : undefined,
    veicTransp: veicTransp ? {
      placa: getText(veicTransp, ['placa']),
      uf: getText(veicTransp, ['UF']),
      rntc: getText(veicTransp, ['RNTC']),
    } : undefined,
    vol: volNodes.map(v => ({
      qVol: getNum(v, ['qVol']),
      esp: getText(v, ['esp']),
      marca: getText(v, ['marca']),
      nVol: getText(v, ['nVol']),
      pesoL: getNum(v, ['pesoL']),
      pesoB: getNum(v, ['pesoB']),
    })),
  };

  // Cobrança / Fatura / Duplicatas / Pagamentos
  const cobr = xmlDoc.querySelector('cobr');
  const fat = cobr?.querySelector('fat');
  const dupNodes = Array.from(cobr?.querySelectorAll('dup') || []);
  const detPagNodes = Array.from(xmlDoc.querySelectorAll('pag > detPag'));

  const duplicatas: Duplicata[] = dupNodes.map(d => ({
    nDup: getText(d, ['nDup']),
    dVenc: formatDateShort(getText(d, ['dVenc'])),
    vDup: getNum(d, ['vDup']),
  }));

  const pagamentos = detPagNodes.map(p => {
    const tPag = getText(p, ['tPag']) || '01';
    return {
      tPag,
      tPagTexto: FORMA_PAGAMENTO[tPag] || 'Outros',
      vPag: getNum(p, ['vPag']),
    };
  });

  const cobranca = {
    fat: fat ? {
      nFat: getText(fat, ['nFat']),
      vOrig: getNum(fat, ['vOrig']),
      vDesc: getNum(fat, ['vDesc']),
      vLiq: getNum(fat, ['vLiq']),
    } : undefined,
    dup: duplicatas,
    pagamentos,
  };

  // Informações Adicionais
  const infAdicNode = xmlDoc.querySelector('infAdic');
  const infAdic = {
    infAdFisco: getText(infAdicNode, ['infAdFisco']),
    infCpl: getText(infAdicNode, ['infCpl']),
  };

  // QR Code URL for NFCe
  const qrCodeUrl = getText(xmlDoc.querySelector('infNFeSupl'), ['qrCode']) || getText(xmlDoc.querySelector('infNfeSupl'), ['qrCode']);

  const status = protocolo?.cStat === '100' ? 'Autorizada' : (protocolo?.cStat === '101' || protocolo?.cStat === '135' ? 'Cancelada' : 'Autorizada');

  return {
    id: chave || `DOC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filename,
    xmlRaw: xmlString,
    docType,
    chave: chave || '35230912345678000195550010000123451234567890',
    numero,
    serie,
    modelo,
    natOp,
    dhEmi,
    dhSaiEnt,
    tpNF,
    tpImp,
    emitente,
    destinatario,
    produtos,
    totais,
    transporte,
    cobranca,
    infAdic,
    protocolo,
    qrcodeUrl: qrCodeUrl,
    uploadedAt: new Date().toISOString(),
    status,
  };
}
