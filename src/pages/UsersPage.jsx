import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Check, KeyRound, Plus, Search, Shield, UserX, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  approveAccessRequest,
  forcePasswordChange,
  listAccessRequests,
  listAllowedUsers,
  listProfiles,
  rejectAccessRequest,
  sendPasswordResetEmail,
  setUserActive,
  upsertUser,
} from '@/api/users';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from '@/components/ui/toaster';
import { getRoleLabel } from '@/lib/permissions';
import { formatDate } from '@/lib/dates';

export default function UsersPage() {
  const { isAdmin, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'requests' ? 'requests' : 'users';

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [allowed, setAllowed] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ email: '', displayName: '', role: 'auxiliar', phone: '', unit: '', active: true });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, a, r] = await Promise.all([listProfiles(), listAllowedUsers(), listAccessRequests()]);
      setProfiles(p);
      setAllowed(a);
      setRequests(r);
    } catch (err) {
      toast({ title: 'Falha ao carregar usuários', description: err.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);

  const pendingCount = requests.filter((r) => r.status === 'PENDENTE').length;

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      if (statusFilter === 'active' && p.active === false) return false;
      if (statusFilter === 'inactive' && p.active !== false) return false;
      if (!q) return true;
      return (
        p.email?.toLowerCase().includes(q) ||
        p.display_name?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q)
      );
    });
  }, [profiles, query, roleFilter, statusFilter]);

  const orphanAllowed = useMemo(() => {
    const emails = new Set(profiles.map((p) => p.email?.toLowerCase()));
    return allowed.filter((a) => !emails.has(a.email?.toLowerCase()));
  }, [allowed, profiles]);

  if (!isAdmin) return <Navigate to="/" replace />;
  if (loading) return <PageLoadingState />;

  const saveUser = async () => {
    setSaving(true);
    try {
      await upsertUser(form);
      toast({ title: 'Usuário salvo', tone: 'success' });
      setFormOpen(false);
      await reload();
    } catch (err) {
      toast({ title: 'Não foi possível salvar', description: err.message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container space-y-4">
      <PageHeader
        title="Gestão de usuários"
        subtitle="Perfis, permissões e solicitações de acesso"
        actions={
          <Button
            onClick={() => {
              setForm({ email: '', displayName: '', role: 'auxiliar', phone: '', unit: '', active: true });
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Novo usuário
          </Button>
        }
      />

      <div className="flex gap-2">
        <Button
          variant={tab === 'users' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSearchParams({})}
        >
          Usuários
        </Button>
        <Button
          variant={tab === 'requests' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSearchParams({ tab: 'requests' })}
        >
          Solicitações
          {pendingCount > 0 && <Badge variant="warning">{pendingCount}</Badge>}
        </Button>
      </div>

      {tab === 'users' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar por nome, e-mail ou unidade…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:w-40">
              <option value="all">Todos os perfis</option>
              <option value="admin">Administrador</option>
              <option value="auxiliar">Auxiliar</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-36">
              <option value="all">Todos status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredProfiles.map((u) => (
              <div key={u.id} className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{u.display_name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>{getRoleLabel(u.role)}</Badge>
                      <Badge variant={u.active === false ? 'destructive' : 'success'}>
                        {u.active === false ? 'Inativo' : 'Ativo'}
                      </Badge>
                      {u.unit && <Badge variant="info">{u.unit}</Badge>}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Criado: {u.created_at ? formatDate(String(u.created_at).slice(0, 10)) : '—'}
                  {u.last_login_at ? ` · Último acesso: ${new Date(u.last_login_at).toLocaleString('pt-BR')}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        email: u.email,
                        displayName: u.display_name || '',
                        role: u.role || 'auxiliar',
                        phone: u.phone || '',
                        unit: u.unit || '',
                        active: u.active !== false,
                      });
                      setFormOpen(true);
                    }}
                  >
                    <Shield className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={u.id === profile?.id}
                    onClick={async () => {
                      try {
                        await setUserActive(u.id, u.active === false);
                        toast({ title: u.active === false ? 'Usuário ativado' : 'Usuário inativado', tone: 'success' });
                        await reload();
                      } catch (err) {
                        toast({ title: 'Falha', description: err.message, tone: 'danger' });
                      }
                    }}
                  >
                    <UserX className="w-3.5 h-3.5" /> {u.active === false ? 'Ativar' : 'Inativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await forcePasswordChange(u.id);
                        await sendPasswordResetEmail(u.email);
                        toast({
                          title: 'Redefinição iniciada',
                          description: 'Flag marcada e e-mail de recuperação enviado.',
                          tone: 'success',
                        });
                      } catch (err) {
                        toast({ title: 'Falha na redefinição', description: err.message, tone: 'danger' });
                      }
                    }}
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Redefinir senha
                  </Button>
                </div>
              </div>
            ))}
            {filteredProfiles.length === 0 && (
              <EmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros ou autorize um novo e-mail." />
            )}
          </div>

          {orphanAllowed.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Autorizados sem login ainda</h2>
              {orphanAllowed.map((a) => (
                <div key={a.email} className="bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm">
                  <p className="font-medium">{a.display_name || a.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.email} · {getRoleLabel(a.role)} — crie o usuário em Authentication → Users (senha inicial 123mudar).
                  </p>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {tab === 'requests' && (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="bg-card border border-border/60 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
                <Badge
                  variant={
                    r.status === 'PENDENTE' ? 'warning' : r.status === 'APROVADO' ? 'success' : 'destructive'
                  }
                >
                  {r.status}
                </Badge>
              </div>
              {(r.phone || r.unit || r.role_requested) && (
                <p className="text-xs text-muted-foreground">
                  {[r.phone, r.unit, r.role_requested].filter(Boolean).join(' · ')}
                </p>
              )}
              {r.justification && <p className="text-sm">{r.justification}</p>}
              {r.status === 'PENDENTE' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await approveAccessRequest(r.id, 'auxiliar');
                        toast({
                          title: 'Solicitação aprovada',
                          description: 'E-mail autorizado. Crie o usuário no Auth do Supabase com senha 123mudar.',
                          tone: 'success',
                        });
                        await reload();
                      } catch (err) {
                        toast({ title: 'Falha', description: err.message, tone: 'danger' });
                      }
                    }}
                  >
                    <Check className="w-3.5 h-3.5" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await rejectAccessRequest(r.id);
                        toast({ title: 'Solicitação rejeitada', tone: 'success' });
                        await reload();
                      } catch (err) {
                        toast({ title: 'Falha', description: err.message, tone: 'danger' });
                      }
                    }}
                  >
                    <X className="w-3.5 h-3.5" /> Rejeitar
                  </Button>
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <EmptyState title="Nenhuma solicitação" description="Quando alguém solicitar acesso, aparecerá aqui." />
          )}
        </div>
      )}

      <ModalShell
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Usuário autorizado"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => void saveUser()}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="auxiliar">Auxiliar</option>
                <option value="admin">Administrador</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <p className="text-xs text-muted-foreground">
            A autorização libera o e-mail na allowlist. Se ainda não houver login, crie o usuário em Authentication →
            Users com senha inicial <strong>123mudar</strong>.
          </p>
        </div>
      </ModalShell>
    </div>
  );
}
