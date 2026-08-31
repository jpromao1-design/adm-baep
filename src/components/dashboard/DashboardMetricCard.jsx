import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: {
    icon: 'text-primary bg-primary/10',
    accent: 'group-hover:border-primary/25',
    active: 'border-primary/20',
  },
  info: {
    icon: 'text-info bg-info/10',
    accent: 'group-hover:border-info/25',
    active: 'border-info/20',
  },
  success: {
    icon: 'text-success bg-success/10',
    accent: 'group-hover:border-success/25',
    active: 'border-success/20',
  },
  destructive: {
    icon: 'text-destructive bg-destructive/10',
    accent: 'group-hover:border-destructive/25',
    active: 'border-destructive/20',
  },
};

export function DashboardMetricCard({ icon: Icon, label, value, variant = 'primary', filter, emphasize = false }) {
  const styles = VARIANTS[variant] || VARIANTS.primary;
  const isZero = !value || value === 0;
  const showEmphasis = emphasize && !isZero;

  return (
    <Link
      to={`/tasks?filter=${filter}`}
      className={cn(
        'group flex flex-col justify-between h-[7.25rem] bg-card rounded-xl p-3.5 border border-border/80',
        'transition-all active:scale-[0.98] focus-ring',
        showEmphasis ? styles.active : 'border-border/60',
        styles.accent,
        'hover:bg-muted/30'
      )}
    >
      <div className={cn('inline-flex w-8 h-8 items-center justify-center rounded-full', styles.icon)}>
        <Icon className="w-4 h-4 stroke-[2]" aria-hidden="true" />
      </div>
      <div>
        <p
          className={cn(
            'text-[1.75rem] leading-none font-bold tabular-nums tracking-tight',
            showEmphasis && variant === 'destructive' ? 'text-destructive' : 'text-foreground'
          )}
        >
          {value ?? 0}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-1 leading-tight">{label}</p>
      </div>
    </Link>
  );
}
