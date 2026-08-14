import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarCheck, Clock } from 'lucide-react';

export function NotificationBanner({ overdueCount, dueTodayCount, eventsToday }) {
  if (overdueCount === 0 && dueTodayCount === 0 && eventsToday === 0) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        {overdueCount > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-3.5">
            <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {overdueCount} {overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
              </p>
              <p className="text-xs text-red-600">Requer atenção imediata</p>
            </div>
          </div>
        )}
        {dueTodayCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
            <div className="p-2 bg-amber-100 rounded-xl"><Clock className="w-4 h-4 text-amber-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {dueTodayCount} {dueTodayCount === 1 ? 'tarefa vence' : 'tarefas vencem'} hoje
              </p>
              <p className="text-xs text-amber-600">Não perca o prazo</p>
            </div>
          </div>
        )}
        {eventsToday > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
            <div className="p-2 bg-blue-100 rounded-xl"><CalendarCheck className="w-4 h-4 text-blue-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">
                {eventsToday} {eventsToday === 1 ? 'evento' : 'eventos'} hoje
              </p>
              <p className="text-xs text-blue-600">Confira sua agenda</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
