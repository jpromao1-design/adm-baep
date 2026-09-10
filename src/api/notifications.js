import { supabase } from './supabaseClient';

export async function listNotifications({ limit = 40 } = {}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function markNotificationRead(id) {
  const { error } = await supabase.rpc('mark_notification_read', { p_id: id });
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw new Error(error.message);
}

export async function notifyUser({ userId, title, body, type = 'info', link = null, meta = {} }) {
  const { data, error } = await supabase.rpc('notify_user', {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_type: type,
    p_link: link,
    p_meta: meta,
  });
  if (error) throw new Error(error.message);
  return data;
}
