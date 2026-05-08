/**
 * =====================================================
 * RETROUVONSLES - Types pour les Notifications
 * =====================================================
 */

// ============================================
// NOTIFICATION BASIQUE
// ============================================

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
}

// ============================================
// PAYLOAD FIREBASE MESSAGE
// ============================================

export interface NotificationDataPayload {
  [key: string]: string;
}

export interface FCMNotificationPayload {
  title?: string;
  body?: string;
  image?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  color?: string;
  sound?: string;
  clickAction?: string;
  bodyLocKey?: string;
  bodyLocArgs?: string[];
  titleLocKey?: string;
  titleLocArgs?: string[];
}

export interface FCMMessagePayload {
  notification?: FCMNotificationPayload;
  data?: NotificationDataPayload;
}

// ============================================
// NOTIFICATION RETROUVONSLES
// ============================================

export type NotificationCategory =
  | 'alerte'
  | 'personne_trouvee'
  | 'filiation'
  | 'ia_analysis'
  | 'organisation'
  | 'signalement'
  | 'campagne'
  | 'donation'
  | 'system';

export interface RetrouvonsLesNotification extends Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  timestamp: Date;
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  // Metadata
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  actionLabel?: string;

  // FCM specific
  fcmMessageId?: string;

  // Geolocation (pour les alertes géographiques)
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  id: string;
  userId: string;

  // Canaux
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;

  // Types de notifications
  alertNotifications: boolean;
  personneFound: boolean;
  filiationMatches: boolean;
  iaAnalysisResults: boolean;
  organisationUpdates: boolean;
  signalementNotifications: boolean;
  campaignUpdates: boolean;
  donationNotifications: boolean;
  systemUpdates: boolean;

  // Timing
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  quietHoursEnabled: boolean;

  // Geolocation
  enableGeofenceAlerts: boolean;
  notificationRadiusKm: number;

  // Frequency
  dailyDigestEnabled: boolean;
  dailyDigestTime?: string;
  weeklyReportEnabled: boolean;
  weeklyReportDay?: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// NOTIFICATION CENTRE
// ============================================

export interface NotificationCentre {
  id: string;
  userId: string;
  notifications: RetrouvonsLesNotification[];
  unreadCount: number;
  lastReadAt?: Date;
}

// ============================================
// NOTIFICATION SETTINGS
// ============================================

export interface NotificationSettingsUI {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  geofenceEnabled: boolean;
}

// ============================================
// NOTIFICATION ACTION
// ============================================

export interface NotificationAction {
  label: string;
  action: string;
  url?: string;
}

// ============================================
// NOTIFICATION RESPONSE
// ============================================

export interface NotificationResponse {
  id: string;
  notificationId: string;
  userId: string;
  action: 'opened' | 'dismissed' | 'actioned';
  actionType?: string;
  timestamp: Date;
}

// ============================================
// NOTIFICATION STATS
// ============================================

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalDismissed: number;
  openRate: number; // percentage
  dismissRate: number; // percentage
  avgTimeToOpen?: number; // milliseconds
}
