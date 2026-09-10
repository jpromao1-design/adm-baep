import { supabase } from './supabaseClient';

export async function submitAccessRequest(payload) {
  const { data, error } = await supabase.rpc('submit_access_request', {
    p_full_name: payload.fullName,
    p_email: payload.email,
    p_phone: payload.phone || null,
    p_unit: payload.unit || null,
    p_role_requested: payload.roleRequested || null,
    p_justification: payload.justification || null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listAccessRequests(status = null) {
  let q = supabase.from('access_requests').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function approveAccessRequest(id, role = 'auxiliar', notes = null) {
  const { error } = await supabase.rpc('approve_access_request', {
    p_request_id: id,
    p_role: role,
    p_notes: notes,
  });
  if (error) throw new Error(error.message);
}

export async function rejectAccessRequest(id, notes = null) {
  const { error } = await supabase.rpc('reject_access_request', {
    p_request_id: id,
    p_notes: notes,
  });
  if (error) throw new Error(error.message);
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, active, phone, unit, last_login_at, must_change_password, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listAllowedUsers() {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('email, role, display_name, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function upsertUser(payload) {
  const { error } = await supabase.rpc('admin_upsert_user', {
    p_email: payload.email,
    p_display_name: payload.displayName,
    p_role: payload.role || 'auxiliar',
    p_phone: payload.phone || null,
    p_unit: payload.unit || null,
    p_active: payload.active !== false,
  });
  if (error) throw new Error(error.message);
}

export async function setUserActive(userId, active) {
  const { error } = await supabase.rpc('admin_set_user_active', {
    p_user_id: userId,
    p_active: active,
  });
  if (error) throw new Error(error.message);
}

export async function forcePasswordChange(userId) {
  const { error } = await supabase.rpc('admin_force_password_change', { p_user_id: userId });
  if (error) throw new Error(error.message);
}

export async function sendPasswordResetEmail(email) {
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL || '/'}login`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function touchLastLogin() {
  await supabase.rpc('touch_last_login').catch(() => {});
}
