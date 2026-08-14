import React from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-[70dvh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">Página não encontrada.</p>
      <Link to="/" className="mt-4 text-sm font-semibold text-primary">
        Voltar ao início
      </Link>
    </div>
  );
}
