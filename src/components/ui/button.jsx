import React from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-foreground hover:bg-secondary/80 border border-border',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/15 border border-destructive/20',
  danger: 'bg-destructive text-white hover:opacity-90',
};

const sizes = {
  sm: 'px-3 py-2 text-xs rounded-xl min-h-10',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-11',
  lg: 'px-5 py-3 text-sm rounded-2xl min-h-12',
  icon: 'p-2.5 rounded-xl min-h-11 min-w-11 inline-flex items-center justify-center',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
