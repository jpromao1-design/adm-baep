import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, KeyRound, LayoutDashboard, ListTodo, LogOut, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Início' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { path: '/calendar', icon: CalendarDays, label: 'Agenda' },
  { path: '/search', icon: Search, label: 'Busca' },
];

export function AppLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-dvh bg-background font-inter">
      <main className="pb-28 md:pb-8 md:pl-72">
        <div className="md:hidden flex items-center justify-end gap-1 px-4 pt-3">
          <Link
            to="/alterar-senha"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted min-h-11"
          >
            <KeyRound className="w-4 h-4" /> Senha
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 min-h-11"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
        <Outlet />
      </main>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex-col z-40">
        <div className="px-6 py-7 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Adm BAEP</h1>
              <p className="text-[11px] text-muted-foreground">8º BAEP · Gestão de tarefas</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 min-h-11',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-[18px] h-[18px]', isActive ? 'stroke-[2.5]' : 'stroke-2')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <Link
            to="/tasks?new=true"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Nova Tarefa
          </Link>
          <Link
            to="/alterar-senha"
            className={cn(
              'flex items-center justify-center gap-2 w-full py-3 mt-2 text-sm font-medium rounded-2xl transition-all',
              location.pathname === '/alterar-senha'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <KeyRound className="w-4 h-4" /> Alterar senha
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full py-3 mt-1 text-sm font-medium text-muted-foreground hover:text-destructive rounded-2xl hover:bg-destructive/5 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-3 mb-3 bg-card/95 backdrop-blur-2xl border border-border rounded-3xl">
          <div className="flex items-end justify-around px-1 py-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all min-w-[52px] min-h-11',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn('w-9 h-9 flex items-center justify-center rounded-xl', isActive ? 'bg-primary/10' : '')}>
                    <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                  </div>
                  <span className={cn('text-[10px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <Link
              to="/tasks?new=true"
              className="flex items-center justify-center w-12 h-12 -mt-4 mb-1 bg-primary text-primary-foreground rounded-2xl active:scale-95 transition-transform"
              aria-label="Nova tarefa"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
