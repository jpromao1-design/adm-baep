import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function SectionHeader({ id, title, count, linkTo, linkLabel = 'Ver todas' }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <h2 id={id} className="text-base font-semibold text-foreground truncate">
          {title}
        </h2>
        {count != null && count > 0 && (
          <span className="shrink-0 bg-muted text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums">
            {count}
          </span>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="shrink-0 text-xs font-semibold text-primary hover:underline focus-ring rounded px-1"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
