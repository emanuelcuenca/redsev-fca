
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para gestionar la lógica de instalación de la PWA.
 * Detecta el evento beforeinstallprompt y el estado de instalación.
 */
export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detectar si es iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));

    // Capturar el evento de instalación (Android/Desktop)
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar cuando se completa la instalación
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return { 
    canInstall: !!installPrompt, 
    isInstalled, 
    isIos, 
    handleInstallClick 
  };
}
