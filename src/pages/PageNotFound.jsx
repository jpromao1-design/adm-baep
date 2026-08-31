import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function PageNotFound() {
  return (
    <div className="page-container min-h-[70dvh] flex flex-col items-center justify-center">
      <EmptyState
        icon={Home}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
      />
      <Link to="/" className="mt-2 text-sm font-semibold text-primary hover:underline focus-ring rounded px-2 py-1">
        Voltar ao início
      </Link>
    </div>
  );
}
