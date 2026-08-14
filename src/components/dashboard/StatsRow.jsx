import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';

const STATS = [
  { key: 'total', label: 'Abertas', icon: ListTodo, bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/15', filter: 'open' },
  { key: 'in_progress', label: 'Andamento', icon: Clock, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', filter: 'in_progress' },
  { key: 'done', label: 'Concluídas', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', filter: 'done' },
  { key: 'overdue', label: 'Atrasadas', icon: AlertTriangle, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', filter: 'overdue' },
];

export function StatsRow({ counts }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => navigate(`/tasks?filter=${stat.filter}`)}
          className={`bg-card rounded-2xl p-3 md:p-4 border ${stat.border} text-center cursor-pointer hover:scale-[1.03] transition-all duration-200 active:scale-[0.96]`}
        >
          <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-2.5`}>
            <stat.icon className={`w-4 h-4 ${stat.text} stroke-2`} />
          </div>
          <p className="text-2xl md:text-3xl font-black text-foreground leading-none">{counts[stat.key] || 0}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground font-semibold mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
