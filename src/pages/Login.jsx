import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo } from 'lucide-react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { sendPasswordResetEmail } from '@/api/users';
import { toast } from '@/components/ui/toaster';

export default function Login() {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : err.message);
  };

  const sendReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Informe o e-mail para recuperar a senha.');
      return;
    }
    setResetSending(true);
    try {
      await sendPasswordResetEmail(email.trim());
      toast({
        title: 'E-mail enviado',
        description: 'Se o e-mail estiver cadastrado, você receberá o link de redefinição.',
        tone: 'success',
      });
      setResetMode(false);
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <form
        onSubmit={resetMode ? sendReset : submit}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-elevated"
        aria-labelledby="login-title"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 id="login-title" className="text-lg font-bold">
              Adm BAEP
            </h1>
            <p className="text-xs text-muted-foreground">8º BAEP · acesso restrito</p>
          </div>
        </div>

        {(error || authError?.type === 'user_not_registered' || authError?.type === 'user_inactive') && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">
            {authError?.type === 'user_not_registered'
              ? 'Este e-mail não está autorizado. Solicite acesso abaixo.'
              : authError?.type === 'user_inactive'
                ? authError.message
                : error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {!resetMode && (
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        <Button type="submit" disabled={loading || resetSending} className="w-full">
          {resetMode ? (resetSending ? 'Enviando…' : 'Enviar link de recuperação') : loading ? 'Entrando…' : 'Entrar'}
        </Button>

        <div className="flex flex-col gap-2 text-center text-sm">
          <button
            type="button"
            className="text-primary font-semibold hover:underline"
            onClick={() => {
              setResetMode((v) => !v);
              setError('');
            }}
          >
            {resetMode ? 'Voltar ao login' : 'Esqueci minha senha'}
          </button>
          <Link to="/solicitar-acesso" className="text-muted-foreground hover:text-foreground font-medium">
            Solicitar acesso
          </Link>
        </div>
      </form>
    </div>
  );
}
