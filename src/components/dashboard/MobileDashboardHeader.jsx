import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { DashboardActionsSheet } from './DashboardActionsSheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export function MobileDashboardHeader({ tasks, onImport }) {
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const now = new Date();

  const dateLong = format(now, "EEEE, d 'de' MMMM", { locale: ptBR });
  const dateCompact = format(now, "EEE, d 'de' MMM", { locale: ptBR });

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/60 -mx-4 px-4 pt-3 pb-3 mb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.375rem] font-bold tracking-tight text-foreground leading-tight">Dashboard</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5 capitalize truncate min-[360px]:hidden">{dateCompact}</p>
            <p className="text-[13px] text-muted-foreground mt-0.5 capitalize truncate hidden min-[360px]:block">{dateLong}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 -mr-1">
            <NotificationBell tasks={tasks} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu do dashboard"
              aria-haspopup="dialog"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <DashboardActionsSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tasks={tasks}
        onImport={onImport}
        onSignOut={signOut}
      />
    </>
  );
}
