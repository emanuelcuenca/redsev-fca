
'use client';

import { useState, useEffect } from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente que muestra una invitación para instalar la aplicación.
 * Soporta lógica para Android (instalación directa) e iOS (instrucciones manuales).
 */
export function PwaInstallPrompt() {
  const { canInstall, isInstalled, isIos, handleInstallClick } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Mostrar solo si no está instalado, no ha sido descartado y es instalable o es iOS
    if (!isInstalled && !dismissed && (canInstall || isIos)) {
      const timer = setTimeout(() => setIsVisible(true), 3000); // Aparece tras 3 segundos
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isInstalled, isIos, dismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-md mx-auto bg-primary text-white p-5 rounded-[2rem] shadow-2xl shadow-primary/40 border border-white/10 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-white text-primary p-3 rounded-2xl shadow-inner shrink-0">
            <Download className="w-6 h-6" />
          </div>
          
          <div className="flex-1 pr-6">
            <h4 className="font-headline font-bold uppercase text-xs tracking-tight mb-1">
              Instalar REDSEV FCA
            </h4>
            <p className="text-[11px] leading-snug opacity-90 font-medium">
              {isIos 
                ? "Agregá la app a tu inicio para un acceso rápido y sin conexión."
                : "Descargá la aplicación institucional para una mejor experiencia móvil."}
            </p>
            
            <div className="mt-4">
              {isIos ? (
                <div className="flex flex-col gap-2 bg-black/10 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-primary text-[8px]">1</span>
                    Tocá el botón <Share className="w-3.5 h-3.5 mx-0.5" /> compartir
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-primary text-[8px]">2</span>
                    Elegí <PlusSquare className="w-3.5 h-3.5 mx-0.5" /> "Añadir a inicio"
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleInstallClick}
                  className="bg-white text-primary hover:bg-white/90 rounded-xl h-10 w-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-black/10"
                >
                  Instalar ahora
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
