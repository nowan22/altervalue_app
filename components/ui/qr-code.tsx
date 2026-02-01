'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
  downloadFileName?: string;
}

export function QRCode({
  value,
  size = 200,
  className,
  showDownload = true,
  downloadFileName = 'qrcode',
}: QRCodeProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Use free QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=png&margin=10`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${downloadFileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  if (!value) {
    return null;
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div 
        className="relative bg-white rounded-xl p-3 shadow-lg"
        style={{ width: size + 24, height: size + 24 }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted-foreground">
            Erreur de génération
          </div>
        ) : (
          <Image
            src={qrCodeUrl}
            alt="QR Code"
            width={size}
            height={size}
            className={cn(
              'transition-opacity duration-300',
              loading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            unoptimized // External URL
          />
        )}
      </div>
      
      {showDownload && !error && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Télécharger PNG
        </Button>
      )}
    </div>
  );
}
