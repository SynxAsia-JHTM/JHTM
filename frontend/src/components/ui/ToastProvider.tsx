import React, { useCallback, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ToastContext, type ToastApi, type ToastItem, type ToastVariant } from './toastContext';

function createId() {
  const maybeCrypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = createId();
      setToasts((prev) => [{ id, title, message, variant }, ...prev].slice(0, 3));
      window.setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border bg-white px-4 py-3 shadow-lg',
              t.variant === 'success' && 'border-emerald-200',
              t.variant === 'error' && 'border-red-200',
              t.variant === 'info' && 'border-slate-200'
            )}
            role="status"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{t.title}</p>
              {t.message ? <p className="mt-0.5 text-sm text-slate-600">{t.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Dismiss notification"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
