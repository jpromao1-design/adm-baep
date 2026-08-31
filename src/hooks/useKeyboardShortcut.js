import { useEffect } from 'react';

export function useKeyboardShortcut(key, handler, { enabled = true, meta = false } = {}) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (meta && !e.metaKey && !e.ctrlKey) return;
      if (!meta && e.key !== key) return;
      e.preventDefault();
      handler(e);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, enabled, meta]);
}
