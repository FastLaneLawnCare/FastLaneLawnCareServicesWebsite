import React, { useState, useEffect } from 'react';
import { X, Download } from '@phosphor-icons/react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user hasn't dismissed the banner before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 border-2 border-black bg-white p-4 shadow-lg"
      data-testid="pwa-install-banner"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100"
        data-testid="dismiss-install-banner"
      >
        <X size={20} weight="bold" />
      </button>
      
      <div className="flex items-start gap-3 mr-6">
        <div className="mt-1">
          <Download size={24} weight="bold" />
        </div>
        <div>
          <h3 className="font-bold uppercase text-sm mb-1">Install Fast Lane App</h3>
          <p className="text-sm text-[#71717A] mb-3">
            Add to your home screen for quick access and offline use
          </p>
          <button
            onClick={handleInstall}
            data-testid="install-pwa-button"
            className="w-full py-2 px-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
