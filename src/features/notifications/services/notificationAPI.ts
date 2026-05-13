/**
 * =====================================================
 * RETROUVONSLES - Notification API Service
 * API wrapper for notification operations
 * Aligned with database schema (notification table)
 * =====================================================
 */

import { supabase } from '../../../config';
import type { INotification, NotificationFilter } from '../types';

const db = { from: (table: string) => (supabase.from(table) as any) };

/**
 * Map database notification to INotification
 */
const mapDbToNotification = (n: any): INotification => ({
  id: n.id,
  title: n.titre,
  message: n.message,
  type: n.type_notification,
  category: n.canal || 'in_app',
  priority: n.priorite || 'moyenne',
  user_id: n.id_utilisateur,
  timestamp: new Date(n.date_creation),
  read: n.lue,
  readAt: n.date_lecture ? new Date(n.date_lecture) : undefined,
  data: n.donnees_supplementaires,
  action: n.url_action ? { label: 'Voir', url: n.url_action } : undefined,
});

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
  const { data, error } = await db
    .from('notification')
    .select('*')
    .eq('id_utilisateur', userId)
    .order('date_creation', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToNotification);
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await db
    .from('notification')
    .select('*', { count: 'exact' })
    .eq('id_utilisateur', userId)
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
