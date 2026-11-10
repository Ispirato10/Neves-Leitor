export type DocType = 'NFE' | 'NFCE' | 'CTE' | 'MDFE' | 'NFSE';

export interface Endereco {
  xLgr?: string;
  nro?: string;
  xCpl?: string;
  xBairro?: string;
  cMun?: string;
  xMun?: string;
  uf?: string;
  cep?: string;
  fone?: string;
  cPais?: string;
  xPais?: string;
}

export interface Emitente {
  cnpjCpf: string;
  xNome: string;
  xFant?: string;
  ie?: string;
  ieST?: string;
  crt?: string;
  ender: Endereco;
}

export interface Destinatario {
  cnpjCpf: string;
  xNome: string;
  ie?: string;
  email?: string;
  ender: Endereco;
}

export interface ImpostoICMS {
  orig?: string;
  CST_CSOSN?: string;
  vBC?: number;
  pICMS?: number;
  vICMS?: number;
  vBCST?: number;
  pICST?: number;
  vICMSST?: number;
  pRedBC?: number;
  vICMSDeson?: number;
}

export interface ImpostoIPI {
  cEnq?: string;
  CST?: string;
  vBC?: number;
  pIPI?: number;
  vIPI?: number;
}

export interface ImpostoPIS {
  CST?: string;
  vBC?: number;
  pPIS?: number;
  vPIS?: number;
}

export interface ImpostoCOFINS {
  CST?: string;
  vBC?: number;
  pCOFINS?: number;
  vCOFINS?: number;
}

export interface ProdutoItem {
  nItem: number;
  cProd: string;
  cEAN?: string;
  xProd: string;
  NCM?: string;
  CEST?: string;
  CFOP?: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEANTrib?: string;
  uTrib?: string;
  qTrib?: number;
  vUnTrib?: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vOutro?: number;
  indTot?: string;
  icms: ImpostoICMS;
  ipi: ImpostoIPI;
  pis: ImpostoPIS;
  cofins: ImpostoCOFINS;
}

export interface TotaisNota {
  vBC: number;
  vICMS: number;
  vICMSDeson: number;
  vFCP: number;
  vBCST: number;
  vST: number;
  vFCPST: number;
  vFCPSTRet: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vII: number;
  vIPI: number;
  vIPIDevol: number;
  vPIS: number;
  vCOFINS: number;
  vOutro: number;
  vNF: number;
  vTotTrib: number;
}

export interface Transportadora {
  cnpjCpf?: string;
  xNome?: string;
  ie?: string;
  xEnder?: string;
  xMun?: string;
  uf?: string;
}

export interface Veiculo {
  placa?: string;
  uf?: string;
  rntc?: string;
}

export interface Volume {
  qVol?: number;
  esp?: string;
  marca?: string;
  nVol?: string;
  pesoL?: number;
  pesoB?: number;
}

export interface Transporte {
  modFrete: string;
  modFreteTexto: string;
  transporta?: Transportadora;
  veicTransp?: Veiculo;
  vol?: Volume[];
}

export interface Duplicata {
  nDup: string;
  dVenc: string;
  vDup: number;
}

export interface Fatura {
  nFat?: string;
  vOrig?: number;
  vDesc?: number;
  vLiq?: number;
}

export interface Cobranca {
  fat?: Fatura;
  dup: Duplicata[];
  pagamentos?: Array<{ tPag: string; tPagTexto: string; vPag: number }>;
}

export interface InformacoesAdicionais {
  infAdFisco?: string;
  infCpl?: string;
}

export interface ProtocoloAutorizacao {
  tpAmb: string;
  verAplic: string;
  chNFe: string;
  dhRecbto: string;
  nProt: string;
  digVal?: string;
  cStat: string;
  xMotivo: string;
}

export interface FiscalDocument {
  id: string;
  filename: string;
  xmlRaw: string;
  docType: DocType;
  chave: string;
  numero: string;
  serie: string;
  modelo: string;
  natOp: string;
  dhEmi: string;
  dhSaiEnt?: string;
  tpNF: number; // 0 = Entrada, 1 = Saída
  tpImp?: number; // 1 = Retrato, 2 = Paisagem
  emitente: Emitente;
  destinatario: Destinatario;
  produtos: ProdutoItem[];
  totais: TotaisNota;
  transporte: Transporte;
  cobranca: Cobranca;
  infAdic: InformacoesAdicionais;
  protocolo?: ProtocoloAutorizacao;
  qrcodeUrl?: string;
  uploadedAt: string;
  status: 'Autorizada' | 'Cancelada' | 'Denegada' | 'Pendente';
}

export interface DanfeCustomization {
  showCanhoto: boolean;
  canhotoPosition: 'top' | 'bottom';
  customLogoUrl?: string;
  compactMode: boolean;
  showIBPT: boolean;
  fontSize: 'xs' | 'sm' | 'base';
}
