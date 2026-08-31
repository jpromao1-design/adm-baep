import React from 'react';
import { cn } from '@/lib/utils';

const tones = {
  info: 'bg-info/10 border-info/20 text-info',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  danger: 'bg-destructive/10 border-destructive/20 text-destructive',
  success: 'bg-success/10 border-success/20 text-success',
};

export function AlertBanner({ tone = 'info', icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4',
        tones[tone],
        className
      )}
      role="status"
    >
      {Icon && (
        <div className="p-2 rounded-xl bg-card/60 shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs mt-0.5 opacity-90">{description}</p>}
      </div>
      {action}
    </div>
  );
}
