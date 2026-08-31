import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { DashboardMetricCard } from './DashboardMetricCard';
import { TaskIOBar } from '@/components/tasks/TaskIOBar';

const STATS = [
  { key: 'total', label: 'Abertas', icon: ListTodo, variant: 'primary', filter: 'open' },
  { key: 'in_progress', label: 'Em andamento', icon: Clock, variant: 'info', filter: 'in_progress' },
  { key: 'done', label: 'Concluídas', icon: CheckCircle2, variant: 'success', filter: 'done' },
  { key: 'overdue', label: 'Atrasadas', icon: AlertTriangle, variant: 'destructive', filter: 'overdue', emphasize: true },
];

export function StatsRow({ counts }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
      {STATS.map((stat) => (
        <DashboardMetricCard
          key={stat.key}
          icon={stat.icon}
          label={stat.label}
          value={counts[stat.key] || 0}
          variant={stat.variant}
          filter={stat.filter}
          emphasize={stat.emphasize}
        />
      ))}
    </div>
  );
}

export function StatsRowDesktopIO({ tasks, onImport }) {
  return <TaskIOBar tasks={tasks} onImport={onImport} />;
}
