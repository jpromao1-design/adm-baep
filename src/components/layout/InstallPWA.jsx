import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('pwa-install-dismissed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalone()) return undefined;
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIos() && !isStandalone()) setIosHint(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || isStandalone()) return null;
  if (!deferred && !iosHint) return null;

  const dismiss = () => {
    try {
      localStorage.setItem('pwa-install-dismissed', '1');
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <div className="fixed left-3 right-3 z-[90] bottom-24 md:bottom-6">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instalar como aplicativo</p>
          {deferred ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Abre em tela cheia, sem barra do navegador — não é atalho.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              No Safari: toque em <Share className="w-3 h-3 inline" /> Compartilhar e depois em
              <span className="font-semibold"> Adicionar à Tela de Início</span>.
            </p>
          )}
          {deferred && (
            <button
              type="button"
              className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              onClick={async () => {
                deferred.prompt();
                await deferred.userChoice;
                setDeferred(null);
                dismiss();
              }}
            >
              Instalar app
            </button>
          )}
        </div>
        <button type="button" onClick={dismiss} className="p-1 text-muted-foreground" aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
