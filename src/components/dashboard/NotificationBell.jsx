import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, Calendar, CalendarCheck, Clock, X } from 'lucide-react';
import { addDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { daysUntil, formatDate, getTaskDate } from '@/lib/dates';
import { getAuxiliar } from '@/lib/sections';
import { expandRecurringTasks } from '@/lib/recurrence';
import { isTaskDone } from '@/lib/task-status';

export function NotificationBell({ tasks = [] }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem('notif-read-ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const ref = useRef(null);

  const notifications = useMemo(() => {
    const today = startOfDay(new Date());
    const expanded = expandRecurringTasks(tasks, addDays(today, -30), addDays(today, 1));
    return expanded
      .filter((t) => {
        if (isTaskDone(t) || t.status === 'concluido') return false;
        const diff = daysUntil(getTaskDate(t));
        return diff === 0 || diff === 1 || (diff !== null && diff < 0);
      })
      .sort((a, b) => new Date(getTaskDate(a)) - new Date(getTaskDate(b)));
  }, [tasks]);

  const unreadNotifications = notifications.filter((t) => !readIds.has(`${t.id}-${t._occurrenceDate || 'base'}`));
  const overdueUnreadCount = unreadNotifications.filter((t) => daysUntil(getTaskDate(t)) < 0).length;
  const totalCount = unreadNotifications.length;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const getItemInfo = (task) => {
    const diff = daysUntil(getTaskDate(task));
    if (diff < 0) return { label: 'Atrasada', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
    if (diff === 0) return { label: 'Vence hoje', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'Vence amanhã', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' };
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Alertas de prazo"
        onClick={() => {
          if (!open && notifications.length > 0) {
            const next = new Set(readIds);
            notifications.forEach((t) => next.add(`${t.id}-${t._occurrenceDate || 'base'}`));
            setReadIds(next);
            localStorage.setItem('notif-read-ids', JSON.stringify([...next].slice(-300)));
          }
          setOpen((o) => !o);
        }}
        className={cn(
          'relative p-2 rounded-xl transition-colors min-h-11 min-w-11 flex items-center justify-center',
          open ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1',
              overdueUnreadCount > 0 ? 'bg-red-500' : 'bg-amber-500'
            )}
          >
            {totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] bg-card border border-border rounded-2xl z-50 overflow-hidden"
            role="menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Alertas de Prazo</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CalendarCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo para hoje ou amanhã</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.map((task) => {
                  const info = getItemInfo(task);
                  const Icon = info.icon;
                  return (
                    <div key={`${task.id}-${task._occurrenceDate || 'base'}`} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-1.5 rounded-lg mt-0.5', info.bg)}>
                          <Icon className={cn('w-3.5 h-3.5', info.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn('text-xs font-semibold', info.color)}>{info.label}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(getTaskDate(task))}</span>
                          </div>
                          {getAuxiliar(task) && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{getAuxiliar(task)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
