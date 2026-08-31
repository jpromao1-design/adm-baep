import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, Clock } from 'lucide-react';
import { AlertBanner } from '@/components/ui/alert-banner';

export function NotificationBanner({ overdueCount, dueTodayCount, eventsToday }) {
  if (overdueCount === 0 && dueTodayCount === 0 && eventsToday === 0) return null;

  return (
    <div className="space-y-2">
      {overdueCount > 0 && (
        <Link to="/tasks?filter=overdue" className="block focus-ring rounded-2xl">
          <AlertBanner
            tone="danger"
            icon={AlertTriangle}
            title={`${overdueCount} ${overdueCount === 1 ? 'tarefa vencida' : 'tarefas vencidas'}`}
            description="Requer atenção imediata — toque para ver a lista"
          />
        </Link>
      )}
      {dueTodayCount > 0 && (
        <Link to="/tasks?filter=today" className="block focus-ring rounded-2xl">
          <AlertBanner
            tone="warning"
            icon={Clock}
            title={`${dueTodayCount} ${dueTodayCount === 1 ? 'tarefa vence' : 'tarefas vencem'} hoje`}
            description="Confira os prazos do dia"
          />
        </Link>
      )}
      {eventsToday > 0 && (
        <Link to="/calendar" className="block focus-ring rounded-2xl">
          <AlertBanner
            tone="info"
            icon={CalendarCheck}
            title={`${eventsToday} ${eventsToday === 1 ? 'evento' : 'eventos'} hoje`}
            description="Abrir agenda do dia"
          />
        </Link>
      )}
    </div>
  );
}
