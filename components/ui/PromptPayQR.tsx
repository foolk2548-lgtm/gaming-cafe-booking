'use client';

import { useEffect, useRef } from 'react';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';

interface PromptPayQRProps {
  amount: number;
  size?: number;
}

export default function PromptPayQR({ amount, size = 220 }: PromptPayQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phoneId = process.env.NEXT_PUBLIC_PROMPTPAY_ID || '0612013936';

  useEffect(() => {
    if (!canvasRef.current) return;

    // Use the official promptpay-qr library to generate a valid EMVCo QR payload
    const payload = generatePayload(phoneId, { amount });

    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  }, [amount, phoneId, size]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
