import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

export type ToastApi = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);
