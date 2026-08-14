import React, { useState } from 'react';
import { ListTodo } from 'lucide-react';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : err.message);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Adm BAEP</h1>
            <p className="text-xs text-muted-foreground">8º BAEP · acesso restrito</p>
          </div>
        </div>

        {(error || authError?.type === 'user_not_registered') && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
            {authError?.type === 'user_not_registered'
              ? 'Este e-mail não está autorizado. Solicite inclusão na seção.'
              : error}
          </p>
        )}

        <div className="space-y-1">
          <Label>E-mail</Label>
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Senha</Label>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
