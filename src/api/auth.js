import { supabase } from './supabaseClient';
import { evaluatePassword, isDefaultInitialPassword } from '@/lib/password';

export async function requirePasswordChange() {
  const { error } = await supabase.rpc('set_must_change_password', { p_required: true });
  if (error) throw error;
}

export async function completePasswordChange() {
  const { error } = await supabase.rpc('set_must_change_password', { p_required: false });
  if (error) throw error;
}

export async function changePassword({ email, currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword) throw new Error('Informe a senha atual.');
  if (newPassword !== confirmPassword) throw new Error('A confirmação não confere com a nova senha.');

  const strength = evaluatePassword(newPassword, { currentPassword });
  if (!strength.valid) throw new Error(strength.issues[0]);

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyError) {
    throw new Error(verifyError.message === 'Invalid login credentials' ? 'Senha atual incorreta.' : verifyError.message);
  }

  // A senha é enviada ao Auth do Supabase (GoTrue), que grava o hash bcrypt em auth.users.
  // O frontend nunca persiste senha em texto puro nem aplica hash local.
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) throw new Error(updateError.message);

  await completePasswordChange().catch(() => {
    // Flag persistida após migration-password-change.sql
  });
  return { ok: true };
}

export { isDefaultInitialPassword };
