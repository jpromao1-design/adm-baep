import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/components/ui/toaster';
import { useAuth } from '@/lib/AuthContext';
import { evaluatePassword } from '@/lib/password';

export default function ChangePassword({ forced = false }) {
  const { user, signOut, changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const strength = useMemo(
    () => evaluatePassword(newPassword, { currentPassword }),
    [newPassword, currentPassword]
  );

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }
    if (!strength.valid) {
      setError(strength.issues[0]);
      return;
    }
    setSaving(true);
    try {
      await changePassword({
        email: user.email,
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast({ title: 'Senha atualizada', tone: 'success' });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível alterar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={forced ? 'min-h-dvh flex items-center justify-center px-4 py-8' : 'page-container'}>
      <form
        onSubmit={submit}
        className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-4 shadow-card"
        aria-labelledby="change-password-title"
      >
        {!forced && (
          <PageHeader title="Alterar senha" subtitle="Atualize sua senha de acesso" />
        )}

        {forced && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 id="change-password-title" className="text-lg font-bold">
                  Alterar senha
                </h1>
                <p className="text-xs text-muted-foreground">Troque a senha inicial antes de continuar.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" type="button" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        )}

        {forced && (
          <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-xl px-3 py-2" role="status">
            Primeiro acesso com senha padrão. Defina uma senha pessoal para liberar o sistema.
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="current-password">Senha atual</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {newPassword && (
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-muted-foreground">Força da senha</span>
                <span>{strength.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${strength.tone} transition-all`}
                  style={{ width: `${Math.max(strength.score, 1) * 25}%` }}
                />
              </div>
              {strength.issues[0] && <p className="text-[11px] text-destructive">{strength.issues[0]}</p>}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <ul className="text-[11px] text-muted-foreground space-y-1">
          <li className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Mínimo de 8 caracteres, com letra e número.
          </li>
        </ul>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    </div>
  );
}
