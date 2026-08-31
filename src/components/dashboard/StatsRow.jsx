import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
  { key: 'total', label: 'Abertas', icon: ListTodo, variant: 'primary', filter: 'open' },
  { key: 'in_progress', label: 'Em andamento', icon: Clock, variant: 'info', filter: 'in_progress' },
  { key: 'done', label: 'Concluídas', icon: CheckCircle2, variant: 'success', filter: 'done' },
  { key: 'overdue', label: 'Atrasadas', icon: AlertTriangle, variant: 'destructive', filter: 'overdue' },
];

const variantStyles = {
  primary: 'border-primary/15 bg-primary/5 hover:bg-primary/10',
  info: 'border-info/20 bg-info/5 hover:bg-info/10',
  success: 'border-success/20 bg-success/5 hover:bg-success/10',
  destructive: 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10',
};

const iconStyles = {
  primary: 'text-primary bg-primary/10',
  info: 'text-info bg-info/10',
  success: 'text-success bg-success/10',
  destructive: 'text-destructive bg-destructive/10',
};

export function StatsRow({ counts }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            to={`/tasks?filter=${stat.filter}`}
            className={cn(
              'block bg-card rounded-2xl p-4 border shadow-card transition-all hover:shadow-elevated focus-ring',
              variantStyles[stat.variant]
            )}
          >
            <div className={cn('inline-flex p-2 rounded-xl mb-3', iconStyles[stat.variant])}>
              <stat.icon className="w-4 h-4 stroke-2" aria-hidden="true" />
            </div>
            <p className="text-2xl lg:text-3xl font-black text-foreground leading-none tabular-nums">
              {counts[stat.key] || 0}
            </p>
            <p className="text-xs text-muted-foreground font-semibold mt-1.5">{stat.label}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
