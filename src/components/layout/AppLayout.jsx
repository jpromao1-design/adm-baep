import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { getRouteMeta } from '@/lib/route-meta';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Início' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { path: '/calendar', icon: CalendarDays, label: 'Agenda' },
  { path: '/search', icon: Search, label: 'Busca' },
];

const SIDEBAR_KEY = 'adm-baep-sidebar-collapsed';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1');
  const [moreOpen, setMoreOpen] = useState(false);
  const meta = getRouteMeta(location.pathname);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useKeyboardShortcut('/', () => navigate('/search'), { enabled: location.pathname !== '/search' });

  const sidebarWidth = collapsed ? 'md:pl-[var(--sidebar-collapsed)]' : 'md:pl-[var(--sidebar-width)]';

  return (
    <div className="min-h-dvh bg-background">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Adm BAEP</p>
            <h1 className="text-base font-bold truncate">{meta.title}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="touch-target rounded-xl hover:bg-muted text-muted-foreground"
            aria-label="Mais opções"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className={cn('pb-28 md:pb-8 transition-[padding] duration-200', sidebarWidth)}>
        <Outlet />
      </main>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 bottom-0 bg-card border-r border-border flex-col z-40 transition-[width] duration-200',
          collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]'
        )}
      >
        <div className={cn('border-b border-border flex items-center', collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-6 gap-3')}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate">Adm BAEP</h1>
              <p className="text-[11px] text-muted-foreground">8º BAEP · Gestão</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl text-sm font-medium transition-colors focus-ring min-h-11',
                  collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'stroke-[2.5]')} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-5 space-y-1">
          <Link
            to="/tasks?new=true"
            title={collapsed ? 'Nova tarefa' : undefined}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity focus-ring',
              collapsed && 'px-0'
            )}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {!collapsed && 'Nova Tarefa'}
          </Link>
          <Link
            to="/alterar-senha"
            title={collapsed ? 'Alterar senha' : undefined}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-ring',
              collapsed && 'px-0',
              location.pathname === '/alterar-senha' && 'bg-muted text-foreground'
            )}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            {!collapsed && 'Alterar senha'}
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            title={collapsed ? 'Sair' : undefined}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors focus-ring',
              collapsed && 'px-0'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sair'}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted focus-ring"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        aria-label="Navegação principal"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-elevated">
          <div className="flex items-end justify-around px-1 py-1">
            {NAV_ITEMS.slice(0, 2).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl min-w-[56px] min-h-11 focus-ring',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn('w-9 h-9 flex items-center justify-center rounded-xl', isActive && 'bg-primary/10')}>
                    <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                  </div>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/tasks?new=true"
              className="flex items-center justify-center w-12 h-12 -mt-5 mb-0.5 bg-primary text-primary-foreground rounded-2xl shadow-elevated active:scale-95 transition-transform focus-ring"
              aria-label="Nova tarefa"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </Link>
            {NAV_ITEMS.slice(2).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl min-w-[56px] min-h-11 focus-ring',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn('w-9 h-9 flex items-center justify-center rounded-xl', isActive && 'bg-primary/10')}>
                    <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                  </div>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile "Mais" drawer */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setMoreOpen(false)} aria-label="Fechar" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border p-5 space-y-1"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Mais opções</h2>
              <button type="button" onClick={() => setMoreOpen(false)} className="touch-target rounded-xl hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Link
              to="/alterar-senha"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted min-h-11"
            >
              <KeyRound className="w-5 h-5 text-muted-foreground" /> Alterar senha
            </Link>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/5 text-destructive min-h-11"
            >
              <LogOut className="w-5 h-5" /> Sair
            </button>
            <p className="text-[11px] text-muted-foreground text-center pt-3">
              Atalho: pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd> para buscar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
