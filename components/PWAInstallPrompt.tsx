import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // For iOS we might show a hint after some time, or just show it immediately
      // But usually we rely on user manually sharing. We can show a hint if we want.
      // For now, let's keep it simple and only handle standard beforeinstallprompt
      // or show a specific iOS instruction if needed.
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible && !isIOS) return null;
  
  // If installed (standalone), don't show anything
  if (window.matchMedia('(display-mode: standalone)').matches) return null;

  // Render logic for iOS instructions could be added here, but for now focusing on Android/Desktop install prompt
  if (isIOS) {
    // Simple iOS hint could be added here if requested, skipping for now to focus on the "Install" button functionality
    return null; 
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between z-50 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Download size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">安装应用</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">获得更好的全屏体验</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>
        <button 
          onClick={handleInstallClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          安装
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
