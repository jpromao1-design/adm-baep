import React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex w-full min-h-[88px] rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }) {
  return <label className={cn('text-xs font-semibold text-muted-foreground', className)} {...props} />;
}
