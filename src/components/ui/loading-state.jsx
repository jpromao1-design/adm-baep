import React from 'react';
import { PageSkeleton } from './skeleton';

export function LoadingState({ label = 'Carregando…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-4" role="status">
      <div
        className="w-9 h-9 border-[3px] border-muted border-t-primary rounded-full animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="page-container pt-6">
      <PageSkeleton />
    </div>
  );
}
