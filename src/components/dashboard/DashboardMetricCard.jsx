import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: {
    icon: 'text-primary bg-primary/10',
    active: 'border-primary/25',
  },
  info: {
    icon: 'text-info bg-info/10',
    active: 'border-info/25',
  },
  success: {
    icon: 'text-success bg-success/10',
    active: 'border-success/25',
  },
  destructive: {
    icon: 'text-destructive bg-destructive/10',
    active: 'border-destructive/30',
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
        'group flex flex-col justify-between h-[7rem] sm:h-[7.25rem] bg-card rounded-xl p-3',
        'border transition-all active:scale-[0.98] focus-ring',
        showEmphasis ? styles.active : 'border-border/50',
        'hover:bg-muted/20'
      )}
    >
      <div className={cn('inline-flex w-8 h-8 items-center justify-center rounded-full', styles.icon)}>
        <Icon className="w-4 h-4 stroke-[2]" aria-hidden="true" />
      </div>
      <div>
        <p
          className={cn(
            'text-[1.625rem] sm:text-[1.75rem] leading-none font-bold tabular-nums tracking-tight',
            showEmphasis && variant === 'destructive' ? 'text-destructive' : 'text-foreground'
          )}
        >
          {value ?? 0}
        </p>
        <p className="text-[13px] font-medium text-muted-foreground mt-1 leading-tight">{label}</p>
      </div>
    </Link>
  );
}
