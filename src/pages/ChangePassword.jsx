import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { Input, Label } from '@/components/ui/input';
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
      toast({ title: 'Senha atualizada' });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível alterar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={forced ? 'min-h-dvh flex items-center justify-center px-4 py-8' : 'max-w-lg mx-auto px-4 pt-6 pb-4'}>
      <form onSubmit={submit} className="w-full bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Alterar senha</h1>
              <p className="text-xs text-muted-foreground">
                {forced ? 'Troque a senha inicial antes de continuar.' : 'Atualize sua senha de acesso.'}
              </p>
            </div>
          </div>
          {forced && (
            <button type="button" onClick={() => signOut()} className="text-xs font-semibold text-muted-foreground hover:text-destructive">
              <span className="inline-flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Sair</span>
            </button>
          )}
        </div>

        {forced && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Primeiro acesso com senha padrão. Defina uma senha pessoal para liberar o sistema.
          </p>
        )}

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          <Label>Senha atual</Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Nova senha</Label>
          <Input
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
              {strength.issues[0] && (
                <p className="text-[11px] text-rose-600">{strength.issues[0]}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label>Confirmar nova senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <ul className="text-[11px] text-muted-foreground space-y-1">
          <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Mínimo de 8 caracteres, com letra e número.</li>
          <li>A senha é gravada com hash no Authentication do Supabase.</li>
        </ul>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}
