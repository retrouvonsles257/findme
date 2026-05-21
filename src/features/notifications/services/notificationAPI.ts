/**
 * =====================================================
 * RETROUVONSLES - Notification API Service
 * API wrapper for notification operations
 * Aligned with database schema (notification table)
 * =====================================================
 */

import { supabase } from '../../../config';
import type { INotification, NotificationFilter } from '../types';
import { resolveNotificationActionPath } from '../../../utils/resolveNotificationActionPath';

const db = { from: (table: string) => (supabase.from(table) as any) };

async function resolveNotificationUserId(explicitUserId?: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const authId = user?.id ?? null;
  if (authId && explicitUserId && authId !== explicitUserId) {
    console.warn('[notificationAPI] auth.uid ≠ userId Redux, utilisation de auth.uid()', {
      authId: `${authId.slice(0, 8)}…`,
      reduxId: `${explicitUserId.slice(0, 8)}…`,
    });
  }
  return authId || explicitUserId || null;
}

/**
 * Map database notification to INotification
 */
const mapDbToNotification = (n: any): INotification => {
  let action: { label: string; url: string } | undefined;
  try {
    const url = resolveNotificationActionPath(n, 'citizen');
    if (url) action = { label: 'Voir', url };
  } catch (e) {
    console.warn('[notificationAPI] resolveNotificationActionPath failed', e, n?.id);
  }

  const priorite = String(n.priorite || 'moyenne');
  const priority =
    priorite === 'haute' ? 'high' : priorite === 'basse' ? 'low' : ('medium' as const);

  const typeRaw = String(n.type_notification || 'autre');
  const uiType =
    typeRaw === 'nouvelle_alerte' || typeRaw === 'message_autorite'
      ? 'warning'
      : typeRaw === 'signalement_valide' || typeRaw === 'personne_retrouvee'
        ? 'success'
        : typeRaw === 'mise_a_jour_dossier'
          ? 'info'
          : 'info';

  const category =
    typeRaw === 'nouvelle_alerte'
      ? 'alert'
      : typeRaw === 'message_autorite'
        ? 'message'
        : typeRaw.includes('signalement')
          ? 'sighting'
          : typeRaw.includes('dossier')
            ? 'missing-person'
            : 'system';

  return {
    id: String(n.id),
    title: n.titre || '',
    message: n.message || n.message_court || '',
    type: uiType,
    category,
    priority,
    user_id: n.id_utilisateur,
    timestamp: new Date(n.date_creation || Date.now()),
    read: Boolean(n.lue),
    readAt: n.date_lecture ? new Date(n.date_lecture) : undefined,
    data:
      typeof n.donnees_supplementaires === 'object' && n.donnees_supplementaires != null
        ? n.donnees_supplementaires
        : undefined,
    action,
  };
};

/**
 * Create a new notification
 */
export const createNotification = async (
  notification: Omit<INotification, 'id' | 'timestamp'>
): Promise<INotification> => {
  const { data, error } = await db.from('notification').insert({
    titre: notification.title,
    message: notification.message,
    type_notification: notification.type || 'autre',
    canal: notification.category || 'in_app',
    priorite: notification.priority || 'moyenne',
    id_utilisateur: notification.user_id,
    lue: false,
    donnees_supplementaires: notification.data,
    url_action: notification.action?.url,
    date_creation: new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  return mapDbToNotification(data);
};

/**
 * Get all notifications for a user
 */
export const getNotifications = async (userId: string): Promise<INotification[]> => {
  const effectiveUserId = await resolveNotificationUserId(userId);
  if (!effectiveUserId) return [];

  const { data: rpcRows, error: rpcErr } = await (supabase as any).rpc('get_my_notifications', {
    p_limit: 200,
  });

  if (!rpcErr && Array.isArray(rpcRows)) {
    return rpcRows.map(mapDbToNotification);
  }

  if (rpcErr && !rpcErr.message?.includes('Could not find the function')) {
    console.warn('[notificationAPI] get_my_notifications RPC:', rpcErr.message);
  }

  const { data, error } = await db
    .from('notification')
    .select('*')
    .eq('id_utilisateur', effectiveUserId)
    .order('date_creation', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []).map(mapDbToNotification);
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const effectiveUserId = await resolveNotificationUserId(userId);
  if (!effectiveUserId) return 0;

  const { count, error } = await db
    .from('notification')
    .select('*', { count: 'exact', head: true })
    .eq('id_utilisateur', effectiveUserId)
    .eq('lue', false);

  if (error) throw error;
  return count || 0;
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (
  notificationId: string
): Promise<INotification | null> => {
  const { data, error } = await db
    .from('notification')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (error && error.code === 'PGRST116') {
    return null; // Not found
  }
  if (error) throw error;

  return mapDbToNotification(data);
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<INotification> => {
  const { data, error } = await db
    .from('notification')
    .update({ lue: true, date_lecture: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return mapDbToNotification(data);
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  const { error } = await db
    .from('notification')
    .update({ lue: true, date_lecture: new Date().toISOString() })
    .eq('id_utilisateur', userId)
    .eq('lue', false);

  if (error) throw error;
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { error } = await db
    .from('notification')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId: string): Promise<void> => {
  const { error } = await db
    .from('notification')
    .delete()
    .eq('id_utilisateur', userId);

  if (error) throw error;
};

/**
 * Filter notifications
 */
export const filterNotifications = async (
  userId: string,
  filter: NotificationFilter
): Promise<INotification[]> => {
  let query = db.from('notification').select('*').eq('id_utilisateur', userId);

  if (filter.types && filter.types.length > 0) {
    query = query.in('type_notification', filter.types);
  }

  if (filter.categories && filter.categories.length > 0) {
    query = query.in('canal', filter.categories);
  }

  if (filter.read !== undefined) {
    query = query.eq('lue', filter.read);
  }

  if (filter.priority) {
    query = query.eq('priorite', filter.priority);
  }

  if (filter.dateFrom) {
    query = query.gte('date_creation', filter.dateFrom.toISOString());
  }

  if (filter.dateTo) {
    query = query.lte('date_creation', filter.dateTo.toISOString());
  }

  const { data, error } = await query.order('date_creation', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToNotification);
};

/**
 * Get notifications by category
 */
export const getNotificationsByCategory = async (
  userId: string,
  category: string
): Promise<INotification[]> => {
  const { data, error } = await db
    .from('notification')
    .select('*')
    .eq('id_utilisateur', userId)
    .eq('canal', category)
    .order('date_creation', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToNotification);
};
