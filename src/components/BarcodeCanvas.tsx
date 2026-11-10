import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeProps {
  value: string;
  height?: number;
  width?: number;
  displayValue?: boolean;
}

export const Code128Barcode: React.FC<BarcodeProps> = ({
  value,
  height = 40,
  width = 1.2,
  displayValue = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length === 44) {
          JsBarcode(svgRef.current, cleanValue, {
            format: 'CODE128',
            height,
            width,
            displayValue,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000',
          });
        }
      } catch (err) {
        console.error('Erro ao gerar código de barras:', err);
      }
    }
  }, [value, height, width, displayValue]);

  return <svg ref={svgRef} className="w-full h-auto max-h-[55px]" />;
};

interface QRCodeProps {
  value: string;
  size?: number;
}

export const QrCodeCanvas: React.FC<QRCodeProps> = ({ value, size = 110 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Erro ao gerar QR Code:', error);
        }
      );
    }
  }, [value, size]);

  return <canvas ref={canvasRef} className="mx-auto border border-slate-300 rounded-sm" />;
};
