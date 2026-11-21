import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language, t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/30 bg-[#151522] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60 hover:bg-[#1E1E30] transition-colors whitespace-nowrap shrink-0 ${
          variant === 'full' ? 'w-full' : ''
        }`}
      >
        <Download className="w-3.5 h-3.5 text-[#A855F7]" />
        {t.common.installApp}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/30 bg-[#151522] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60 transition-colors whitespace-nowrap shrink-0 ${
            variant === 'full' ? 'w-full' : ''
          }`}
        >
          <Download className="w-3.5 h-3.5 text-[#A855F7]" />
          {t.common.installApp}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[#F8FAFC]">
                  {language === 'fr' ? 'Installer sur iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#10101C] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                {language === 'fr'
                  ? '1. Appuyez sur le bouton Partager dans Safari. 2. Sélectionnez « Sur l’écran d’accueil ».'
                  : '1. Tap the Share button in the Safari toolbar. 2. Scroll down and tap Add to Home Screen.'}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-medium text-white hover:bg-[#7C3AED] transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg border border-amber-500/40 bg-[#151522] px-3.5 py-2 text-xs font-medium text-amber-200 shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>
        {language === 'fr'
          ? 'Hors ligne — Fonctionnalités réseau limitées.'
          : 'Offline — Network features are temporarily paused.'}
      </span>
    </div>
  );
};
