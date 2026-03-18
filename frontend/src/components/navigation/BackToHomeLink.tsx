import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

type BackToHomeLinkProps = {
  to?: string;
  label?: string;
  variant?: 'inline' | 'floating';
  className?: string;
};

export default function BackToHomeLink({
  to = '/',
  label = 'Home',
  variant = 'inline',
  className,
}: BackToHomeLinkProps) {
  return (
    <Link
      to={to}
      aria-label="Back to homepage"
      title="Back to homepage"
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]',
        'dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white dark:focus-visible:ring-offset-slate-900',
        'sm:w-auto sm:px-3',
        variant === 'floating' && 'fixed left-4 top-4 z-50',
        className
      )}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span className="hidden text-sm font-semibold sm:inline">{label}</span>
    </Link>
  );
}

