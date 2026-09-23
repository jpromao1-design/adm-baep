import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { requestNotificationPermission } from '@/lib/notifications';

export function NotificationCenter({ tasks = [] }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const rows = await listNotifications();
      setItems(rows);
    } catch (err) {
      setItems([]);
      toast({
        title: 'Não foi possível carregar notificações',
        description: err?.message,
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!user?.id) return undefined;

    // Strict Mode remonta o efeito; reusar o mesmo nome devolve canal já subscribed
    // e .on() após subscribe() quebra o ErrorBoundary.
    const topicPrefix = `notifications-${user.id}`;
    for (const existing of supabase.getChannels()) {
      if (existing.topic?.includes(topicPrefix)) {
        void supabase.removeChannel(existing);
      }
    }

    let channel;
    try {
      channel = supabase
        .channel(`${topicPrefix}-${Math.random().toString(36).slice(2, 9)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setItems((prev) => [payload.new, ...prev].slice(0, 40));
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(payload.new.title, { body: payload.new.body || '', tag: payload.new.id });
              } catch {
                /* ignore */
              }
            }
          }
        )
        .subscribe();
    } catch {
      return undefined;
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  const unread = items.filter((n) => !n.read_at).length;

  // Fallback deadline count when DB empty (compat)
  const deadlineHints = !items.length && Array.isArray(tasks) ? 0 : 0;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificações"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) reload();
        }}
        className={cn(
          'relative p-2 rounded-xl transition-colors min-h-11 min-w-11 flex items-center justify-center',
          open ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <Bell className="w-5 h-5" />
        {(unread > 0 || deadlineHints > 0) && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
            {unread || deadlineHints}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-12 w-[min(22rem,calc(100vw-1.5rem))] bg-card border border-border rounded-2xl z-50 overflow-hidden shadow-elevated"
            role="menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Notificações</span>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      await markAllNotificationsRead();
                      await reload();
                    }}
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                  </Button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted" aria-label="Fechar">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando…</p>}
              {!loading && items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 px-4">Nenhuma notificação no momento.</p>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40',
                    !n.read_at && 'bg-primary/[0.04]'
                  )}
                  onClick={async () => {
                    if (!n.read_at) await markNotificationRead(n.id);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                    else await reload();
                  }}
                >
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString('pt-BR') : ''}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
