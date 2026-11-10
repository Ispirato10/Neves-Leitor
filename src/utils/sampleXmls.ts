export interface SampleXmlItem {
  id: string;
  name: string;
  type: string;
  description: string;
  xml: string;
}

export const SAMPLE_XMLS: SampleXmlItem[] = [
  {
    id: 'nfe_comercial_55',
    name: 'NF-e 4.00 (Venda de Mercadorias / Indústria)',
    type: 'NF-e (Modelo 55)',
    description: 'Nota Fiscal Eletrônica completa com 4 itens, impostos detalhados (ICMS, IPI, ST), transportadora e 3 duplicatas.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35230912345678000195550010000123451234567890" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>23456789</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>12345</nNF>
        <dhEmi>2026-10-15T14:30:00-03:00</dhEmi>
        <dhSaiEnt>2026-10-15T16:00:00-03:00</dhSaiEnt>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>0</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>4.00_v1.2</verProc>
      </ide>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>TECNOLOGIA E SISTEMAS DE AUTOMAÇÃO LTDA</xNome>
        <xFant>TECH AUTO SOLUÇÕES</xFant>
        <enderEmit>
          <xLgr>Avenida Paulista</xLgr>
          <nro>1000</nro>
          <xCpl>Conjunto 1402</xCpl>
          <xBairro>Bela Vista</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01310100</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1132004500</fone>
        </enderEmit>
        <IE>112233445566</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>98765432000110</CNPJ>
        <xNome>COMÉRCIO DE ELETROETRÔNICOS DO BRASIL S.A.</xNome>
        <enderDest>
          <xLgr>Rua Barão de Jaguara</xLgr>
          <nro>450</nro>
          <xCpl>Bloco B</xCpl>
          <xBairro>Centro</xBairro>
          <cMun>3509502</cMun>
          <xMun>Campinas</xMun>
          <UF>SP</UF>
          <CEP>13015001</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1937998800</fone>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>244555666777</IE>
        <email>fiscal@eletrobrasil.com.br</email>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>SRV-DELL-R750</cProd>
          <cEAN>7898912345012</cEAN>
          <xProd>SERVIDOR DELL POWEREDGE R750 INTEL XEON 64GB RAM 2x1TB SSD RACK 2U</xProd>
          <NCM>84715010</NCM>
          <CEST>2103300</CEST>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>14500.0000</vUnCom>
          <vProd>29000.00</vProd>
          <cEANTrib>7898912345012</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>2.0000</qTrib>
          <vUnTrib>14500.0000</vUnTrib>
          <vFrete>150.00</vFrete>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>3480.00</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>29150.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>5247.00</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPITrib>
              <CST>50</CST>
              <vBC>29000.00</vBC>
              <pIPI>10.00</pIPI>
              <vIPI>2900.00</vIPI>
            </IPITrib>
          </IPI>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>29150.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>480.98</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>29150.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>2215.40</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>SW-CISCO-C9200</cProd>
          <cEAN>7898912345029</cEAN>
          <xProd>SWITCH CISCO CATALYST 9200L 48 PORTAS POE+ 4x10G UPLINK MANAGED</xProd>
          <NCM>85176239</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>4.0000</qCom>
          <vUnCom>4200.0000</vUnCom>
          <vProd>16800.00</vProd>
          <cEANTrib>7898912345029</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>4.0000</qTrib>
          <vUnTrib>4200.0000</vUnTrib>
          <vFrete>80.00</vFrete>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>2016.00</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>16880.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>3038.40</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>16880.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>278.52</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>16880.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>1282.88</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="3">
        <prod>
          <cProd>NBK-APC-3000VA</cProd>
          <cEAN>7898912345036</cEAN>
          <xProd>NOBREAK APC SMART-UPS SENOIDAL 3000VA 2700W RACK/TORRE 120V</xProd>
          <NCM>85044040</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>6500.0000</vUnCom>
          <vProd>6500.00</vProd>
          <cEANTrib>7898912345036</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>1.0000</qTrib>
          <vUnTrib>6500.0000</vUnTrib>
          <vFrete>50.00</vFrete>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>780.00</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>6550.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>1179.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>6550.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>108.08</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>6550.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>497.80</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>52580.00</vBC>
          <vICMS>9464.40</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>52300.00</vProd>
          <vFrete>280.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>2900.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>867.58</vPIS>
          <vCOFINS>3996.08</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>55480.00</vNF>
          <vTotTrib>6276.00</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
        <transporta>
          <CNPJ>55444333000122</CNPJ>
          <xNome>EXPRESSO RÁPIDO CARGAS SP E MGI LTDA</xNome>
          <IE>3344556677</IE>
          <xEnder>Rua das Indústrias, 800</xEnder>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
        </transporta>
        <veicTransp>
          <placa>ABC4D56</placa>
          <UF>SP</UF>
          <RNTC>12345678</RNTC>
        </veicTransp>
        <vol>
          <qVol>7</qVol>
          <esp>CAIXAS</esp>
          <marca>TECH AUTO</marca>
          <nVol>001-007</nVol>
          <pesoL>85.400</pesoL>
          <pesoB>92.100</pesoB>
        </vol>
      </transp>
      <cobr>
        <fat>
          <nFat>FAT-12345</nFat>
          <vOrig>55480.00</vOrig>
          <vDesc>0.00</vDesc>
          <vLiq>55480.00</vLiq>
        </fat>
        <dup>
          <nDup>001/03</nDup>
          <dVenc>2026-11-15</dVenc>
          <vDup>18493.34</vDup>
        </dup>
        <dup>
          <nDup>002/03</nDup>
          <dVenc>2026-12-15</dVenc>
          <vDup>18493.33</vDup>
        </dup>
        <dup>
          <nDup>003/03</nDup>
          <dVenc>2027-01-15</dVenc>
          <vDup>18493.33</vDup>
        </dup>
      </cobr>
      <pag>
        <detPag>
          <tPag>15</tPag>
          <vPag>55480.00</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infAdFisco>ICMS RECOLHIDO POR ALÍQUOTA DE 18% CONFORME ART. 52 DO RICMS/SP.</infAdFisco>
        <infCpl>Valor aproximado dos tributos federais e estaduais: R$ 6.276,00 (11,31%) Fonte: IBPT. Pedido de Compra nº PC-2026-9941. Entrega das 08h às 17h na Portaria 2. Banco Bradesco Ag 1234-5 c/c 99887-1.</infCpl>
      </infAdic>
    </infNFe>
    <protNFe versao="4.00">
      <infProt>
        <tpAmb>1</tpAmb>
        <verAplic>SVRS2026_4.00</verAplic>
        <chNFe>35230912345678000195550010000123451234567890</chNFe>
        <dhRecbto>2026-10-15T14:31:05-03:00</dhRecbto>
        <nProt>135230099887766</nProt>
        <digVal>aBcDeFgHiJkLmNoPqRsTuVwXyZ123456</digVal>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso da NF-e</xMotivo>
      </infProt>
    </protNFe>
  </NFe>
</nfeProc>`,
  },
  {
    id: 'nfce_varejo_65',
    name: 'NFC-e (Consumidor Final Varejo)',
    type: 'NFC-e (Modelo 65)',
    description: 'Nota Fiscal de Consumidor Eletrônica emitida em supermercado/varejo com pagamento via PIX e Cartão de Crédito.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe42231045890123000144650010000088991234567891" versao="4.00">
      <ide>
        <cUF>42</cUF>
        <cNF>88991234</cNF>
        <natOp>VENDA A CONSUMIDOR FINAL</natOp>
        <mod>65</mod>
        <serie>1</serie>
        <nNF>8899</nNF>
        <dhEmi>2026-11-02T18:45:12-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>4205407</cMunFG>
        <tpImp>4</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>1</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>POS_RETAIL_v2.0</verProc>
      </ide>
      <emit>
        <CNPJ>45890123000144</CNPJ>
        <xNome>SUPERMERCADO E CONVENIÊNCIA BEIRA MAR LTDA</xNome>
        <xFant>BEIRA MAR SUPERMERCADOS</xFant>
        <enderEmit>
          <xLgr>Avenida Beira Mar Norte</xLgr>
          <nro>2500</nro>
          <xBairro>Agronômica</xBairro>
          <cMun>4205407</cMun>
          <xMun>Florianópolis</xMun>
          <UF>SC</UF>
          <CEP>88025500</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>4833221100</fone>
        </enderEmit>
        <IE>256789012</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CPF>11122233344</CPF>
        <xNome>CONSUMIDOR FINAL</xNome>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>78910001001</cProd>
          <cEAN>7891000100102</cEAN>
          <xProd>CAFÉ GOURMET TORRADO E MOÍDO ARÁBICA 500G</xProd>
          <NCM>09012100</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>28.9000</vUnCom>
          <vProd>57.80</vProd>
          <cEANTrib>7891000100102</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>2.0000</qTrib>
          <vUnTrib>28.9000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>9.82</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>57.80</vBC>
              <pICMS>17.00</pICMS>
              <vICMS>9.83</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>78910002005</cProd>
          <cEAN>7891000200508</cEAN>
          <xProd>ÁGUA MINERAL NATURAL SEM GÁS 500ML</xProd>
          <NCM>22011000</NCM>
          <CFOP>5405</CFOP>
          <uCom>UN</uCom>
          <qCom>6.0000</qCom>
          <vUnCom>3.5000</vUnCom>
          <vProd>21.00</vProd>
          <cEANTrib>7891000200508</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>6.0000</qTrib>
          <vUnTrib>3.5000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>3.57</vTotTrib>
          <ICMS>
            <ICMS60>
              <orig>0</orig>
              <CST>60</CST>
              <vBCSTRet>21.00</vBCSTRet>
              <vICMSSTRet>3.57</vICMSSTRet>
            </ICMS60>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>57.80</vBC>
          <vICMS>9.83</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>78.80</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>1.30</vPIS>
          <vCOFINS>5.98</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>78.80</vNF>
          <vTotTrib>13.39</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>17</tPag>
          <vPag>78.80</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Trib aprox R$: 4,20 Fed, 9,19 Est. Fonte: IBPT SC. Operador: Caixa 04 - Pedro. Obrigado pela preferência!</infCpl>
      </infAdic>
      <infNFeSupl>
        <qrCode>https://sat.sef.sc.gov.br/nfce/consulta?p=42231045890123000144650010000088991234567891|2|1|1|D8E9F0A1B2C3</qrCode>
      </infNFeSupl>
    </infNFe>
    <protNFe versao="4.00">
      <infProt>
        <tpAmb>1</tpAmb>
        <verAplic>SVRS_NFCe_2026</verAplic>
        <chNFe>42231045890123000144650010000088991234567891</chNFe>
        <dhRecbto>2026-11-02T18:45:15-03:00</dhRecbto>
        <nProt>342230011223344</nProt>
        <digVal>xYz987654321AbCdEfGhIjKlMnOp</digVal>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso da NFC-e</xMotivo>
      </infProt>
    </protNFe>
  </NFe>
</nfeProc>`,
  },
  {
    id: 'cte_transporte_57',
    name: 'CT-e (Conhecimento de Transporte Eletrônico)',
    type: 'CT-e (Modelo 57)',
    description: 'Documento fiscal de transporte rodoviário de cargas entre São Paulo/SP e Curitiba/PR.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<cteProc xmlns="http://www.portalfiscal.inf.br/cte" versao="3.00">
  <CTe>
    <infCte Id="CTe41230866555444000188570010000045661234567892" versao="3.00">
      <ide>
        <cUF>41</cUF>
        <cCT>45661234</cCT>
        <CFOP>6352</CFOP>
        <natOp>PRESTAÇÃO DE SERVIÇO DE TRANSPORTE A ESTABELECIMENTO INDUSTRIAL</natOp>
        <mod>57</mod>
        <serie>1</serie>
        <nCT>4566</nCT>
        <dhEmi>2026-08-20T10:15:00-03:00</dhEmi>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>2</cDV>
        <tpAmb>1</tpAmb>
        <tpCTe>0</tpCTe>
        <procEmi>0</procEmi>
        <verProc>TMS_EXPRESS_v3.0</verProc>
        <cMunEnv>3550308</cMunEnv>
        <xMunEnv>São Paulo</xMunEnv>
        <UFEnv>SP</UFEnv>
        <cMunIni>3550308</cMunIni>
        <xMunIni>São Paulo</xMunIni>
        <UFIni>SP</UFIni>
        <cMunFim>4106902</cMunFim>
        <xMunFim>Curitiba</xMunFim>
        <UFFim>PR</UFFim>
        <retRecep>0</retRecep>
      </ide>
      <emit>
        <CNPJ>66555444000188</CNPJ>
        <IE>9012345678</IE>
        <xNome>LOGÍSTICA E TRANSPORTES EXPRESSO NACIONAL S.A.</xNome>
        <xFant>EXPRESSO NACIONAL</xFant>
        <enderEmit>
          <xLgr>Rodovia Anhangüera</xLgr>
          <nro>KM 18</nro>
          <xBairro>Parque Anhangüera</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>05275000</CEP>
          <fone>1139008800</fone>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>77888999000155</CNPJ>
        <IE>101202303404</IE>
        <xNome>INDUSTRIAS METALÚRGICAS SUL BRASIL LTDA</xNome>
        <enderDest>
          <xLgr>Avenida das Indústrias</xLgr>
          <nro>3200</nro>
          <xBairro>CIC - Cidade Industrial</xBairro>
          <cMun>4106902</cMun>
          <xMun>Curitiba</xMun>
          <UF>PR</UF>
          <CEP>81350000</CEP>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>FRETE-RODO</cProd>
          <xProd>TRANSPORTE DE CARGA FRACIONADA CONFORME NF-E 12345</xProd>
          <NCM>00000000</NCM>
          <CFOP>6352</CFOP>
          <uCom>TON</uCom>
          <qCom>12.5000</qCom>
          <vUnCom>220.0000</vUnCom>
          <vProd>2750.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>2750.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>330.00</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>2750.00</vBC>
          <vICMS>330.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>2750.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>45.37</vPIS>
          <vCOFINS>209.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>2750.00</vNF>
          <vTotTrib>584.37</vTotTrib>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
        <veicTransp>
          <placa>MNO9P87</placa>
          <UF>PR</UF>
        </veicTransp>
        <vol>
          <qVol>12</qVol>
          <esp>PALETES</esp>
          <pesoL>12500.000</pesoL>
          <pesoB>12800.000</pesoB>
        </vol>
      </transp>
      <infAdic>
        <infCpl>CT-e referente ao transporte da NF-e nº 12345 da TECNOLOGIA E SISTEMAS DE AUTOMAÇÃO LTDA. Motorista: Carlos Eduardo Santos. Apólice de Seguro RCTR-C nº 998877 Tokio Marine.</infCpl>
      </infAdic>
    </infCte>
    <protCTe versao="3.00">
      <infProt>
        <tpAmb>1</tpAmb>
        <verAplic>SVRS_CTE_2026</verAplic>
        <chCTe>41230866555444000188570010000045661234567892</chCTe>
        <dhRecbto>2026-08-20T10:16:02-03:00</dhRecbto>
        <nProt>141230044556677</nProt>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso do CT-e</xMotivo>
      </infProt>
    </protCTe>
  </CTe>
</cteProc>`,
  },
];
