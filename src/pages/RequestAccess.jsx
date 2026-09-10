import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { submitAccessRequest } from '@/api/users';
import { toast } from '@/components/ui/toaster';

export default function RequestAccess() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    unit: '',
    roleRequested: '',
    justification: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await submitAccessRequest(form);
      toast({
        title: 'Solicitação enviada',
        description: 'O administrador será notificado. Aguarde a análise.',
        tone: 'success',
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível enviar a solicitação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 shadow-elevated"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Solicitar acesso</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preencha os dados. A solicitação ficará pendente até análise do administrador.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input id="fullName" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="req-email">E-mail</Label>
          <Input id="req-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="unit">Unidade / Seção</Label>
            <Input id="unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="Ex.: P1" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Função / Cargo</Label>
          <Input id="role" value={form.roleRequested} onChange={(e) => set('roleRequested', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="justification">Justificativa</Label>
          <Textarea
            id="justification"
            value={form.justification}
            onChange={(e) => set('justification', e.target.value)}
            placeholder="Motivo do acesso ao sistema"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Link to="/login" className="inline-flex">
            <Button type="button" variant="outline">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="ml-auto">
            {saving ? 'Enviando…' : 'Enviar solicitação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
