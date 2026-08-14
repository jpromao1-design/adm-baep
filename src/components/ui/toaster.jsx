import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);
let pushToast = () => {};

export function toast(payload) {
  pushToast(payload);
}

export function Toaster() {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((payload) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, ...payload }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  pushToast = add;

  return (
    <ToastContext.Provider value={{ add, dismiss }}>
      <div className="fixed bottom-24 md:bottom-6 right-4 z-[80] space-y-2 w-[min(100%-2rem,22rem)]">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={cn(
                'rounded-2xl border px-4 py-3 bg-card text-sm shadow-lg',
                item.tone === 'danger' ? 'border-rose-200' : 'border-border'
              )}
            >
              <p className="font-semibold text-foreground">{item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
