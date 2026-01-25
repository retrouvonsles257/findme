/**
 * =====================================================
 * RETROUVONSLES - Firebase Analytics Service
 * =====================================================
 * Event tracking and user analytics
 */

import {
  logEvent as firebaseLogEvent,
  setUserProperties,
  setUserId,
  Analytics,
} from 'firebase/analytics';
import { getFirebaseServices, isServiceAvailable, ANALYTICS_EVENTS, AnalyticsEventName } from './firebaseConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  userId?: string;
  userRole?: string;
  accountCreatedDate?: string;
  lastLoginDate?: string;
  organization?: string;
  country?: string;
  language?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface PageViewParams {
  pageTitle?: string;
  pageLocation?: string;
  pagePath?: string;
  referrer?: string;
}

export interface ConversionParams {
  conversionId: string;
  conversionValue?: number;
  conversionCurrency?: string;
  conversionType: string;
}

export interface SearchParams {
  searchTerm: string;
  searchCategory?: string;
  searchResults?: number;
  searchTime?: number;
}

export interface TimingParams {
  timingCategory: string;
  timingName: string;
  timingValue: number;
  timingLabel?: string;
}

// ============================================
// ANALYTICS SERVICE CLASS
// ============================================

class FirebaseAnalyticsService {
  private analytics: Analytics | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize analytics
   */
  private initialize(): void {
    if (!isServiceAvailable('analytics')) {
      console.warn('Firebase Analytics is not available in this environment');
      return;
    }

    const services = getFirebaseServices();
    this.analytics = services.analytics;
    this.isInitialized = !!this.analytics;
  }

  /**
   * Check if analytics is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.analytics;
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    if (!this.analytics) {
      console.warn('Analytics not available');
      return;
    }

    try {
      setUserId(this.analytics, userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.analytics) {
      console.warn('Analytics not available');
      return;
    }

    try {
      const cleanProperties: UserProperties = {};
      
      Object.entries(properties).forEach(([key, value]) => {
        // Firebase Analytics has limits on property names and values
        if (value !== undefined && value !== null) {
          cleanProperties[key] = value;
        }
      });

      setUserProperties(this.analytics, cleanProperties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }

  /**
   * Log custom event
   */
  logEvent(
    eventName: AnalyticsEventName | string,
    eventParams?: AnalyticsEventParams
  ): void {
    if (!this.analytics) {
      console.warn('Analytics not available');
      return;
    }

    try {
      const params = this.sanitizeParams(eventParams);
      firebaseLogEvent(this.analytics, eventName, params);
    } catch (error) {
      console.error(`Error logging event ${eventName}:`, error);
    }
  }

  /**
   * Log page view
   */
  logPageView(params: PageViewParams): void {
    this.logEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page_title: params.pageTitle,
      page_location: params.pageLocation,
      page_path: params.pagePath,
      referrer: params.referrer,
    });
  }

  /**
   * Log scroll depth
   */
  logScrollDepth(depth: number, maxDepth?: number): void {
    this.logEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, {
      scroll_depth: depth,
      max_scroll_depth: maxDepth || 100,
    });
  }

  /**
   * Log time on page
   */
  logTimeOnPage(pageName: string, timeInSeconds: number): void {
    this.logEvent(ANALYTICS_EVENTS.TIME_ON_PAGE, {
      page_name: pageName,
      time_seconds: timeInSeconds,
    });
  }

  /**
   * Log button click
   */
  logButtonClick(buttonName: string, category?: string, label?: string): void {
    this.logEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
      button_name: buttonName,
      button_category: category || 'general',
      button_label: label,
    });
  }

  /**
   * Log form start
   */
  logFormStart(formName: string, category?: string): void {
    this.logEvent(ANALYTICS_EVENTS.FORM_START, {
      form_name: formName,
      form_category: category || 'general',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log form submission
   */
  logFormSubmit(
    formName: string,
    submissionTime?: number,
    category?: string
  ): void {
    this.logEvent(ANALYTICS_EVENTS.FORM_SUBMIT, {
      form_name: formName,
      form_category: category || 'general',
      submission_time: submissionTime || 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log form abandon
   */
  logFormAbandon(formName: string, fieldsCompleted?: number, category?: string): void {
    this.logEvent(ANALYTICS_EVENTS.FORM_ABANDON, {
      form_name: formName,
      form_category: category || 'general',
      fields_completed: fieldsCompleted || 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log search
   */
  logSearch(params: SearchParams): void {
    this.logEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      search_term: params.searchTerm,
      search_category: params.searchCategory || 'general',
      search_results: params.searchResults || 0,
      search_time_ms: params.searchTime || 0,
    });
  }

  /**
   * Log search result click
   */
  logSearchResultClick(searchTerm: string, resultTitle: string, position?: number): void {
    this.logEvent(ANALYTICS_EVENTS.SEARCH_RESULT_CLICKED, {
      search_term: searchTerm,
      result_title: resultTitle,
      result_position: position || 0,
    });
  }

  /**
   * Log filter application
   */
  logFilterApplied(filterType: string, filterValue: string, resultCount?: number): void {
    this.logEvent(ANALYTICS_EVENTS.FILTER_APPLIED, {
      filter_type: filterType,
      filter_value: filterValue,
      result_count: resultCount || 0,
    });
  }

  /**
   * Log content view
   */
  logContentView(
    contentType: string,
    contentId: string,
    contentTitle?: string
  ): void {
    this.logEvent(ANALYTICS_EVENTS.CONTENT_VIEWED, {
      content_type: contentType,
      content_id: contentId,
      content_title: contentTitle || '',
    });
  }

  /**
   * Log content share
   */
  logContentShare(
    contentType: string,
    contentId: string,
    shareMethod?: string
  ): void {
    this.logEvent(ANALYTICS_EVENTS.CONTENT_SHARED, {
      content_type: contentType,
      content_id: contentId,
      share_method: shareMethod || 'other',
    });
  }

  /**
   * Log content report
   */
  logContentReport(
    contentType: string,
    contentId: string,
    reportReason?: string
  ): void {
    this.logEvent(ANALYTICS_EVENTS.CONTENT_REPORTED, {
      content_type: contentType,
      content_id: contentId,
      report_reason: reportReason || 'other',
    });
  }

  /**
   * Log user login
   */
  logUserLogin(method?: string): void {
    this.logEvent(ANALYTICS_EVENTS.USER_LOGIN, {
      login_method: method || 'email',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log user signup
   */
  logUserSignup(method?: string): void {
    this.logEvent(ANALYTICS_EVENTS.USER_SIGNUP, {
      signup_method: method || 'email',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log user logout
   */
  logUserLogout(): void {
    this.logEvent(ANALYTICS_EVENTS.USER_LOGOUT, {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log user profile update
   */
  logUserProfileUpdate(updateType?: string): void {
    this.logEvent(ANALYTICS_EVENTS.USER_PROFILE_UPDATED, {
      update_type: updateType || 'general',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log personne creation
   */
  logPersonneCreated(personneId: string, createdBy?: string): void {
    this.logEvent(ANALYTICS_EVENTS.PERSONNE_CREATED, {
      personne_id: personneId,
      created_by: createdBy || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log personne update
   */
  logPersonneUpdated(personneId: string, updateType?: string): void {
    this.logEvent(ANALYTICS_EVENTS.PERSONNE_UPDATED, {
      personne_id: personneId,
      update_type: updateType || 'general',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log personne found
   */
  logPersonneFound(personneId: string, foundBy?: string): void {
    this.logEvent(ANALYTICS_EVENTS.PERSONNE_FOUND, {
      personne_id: personneId,
      found_by: foundBy || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log personne photo added
   */
  logPersonnePhotoAdded(personneId: string, photoType?: string): void {
    this.logEvent(ANALYTICS_EVENTS.PERSONNE_PHOTO_ADDED, {
      personne_id: personneId,
      photo_type: photoType || 'portrait',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log dossier created
   */
  logDossierCreated(dossierId: string, personneCount?: number): void {
    this.logEvent(ANALYTICS_EVENTS.DOSSIER_CREATED, {
      dossier_id: dossierId,
      personne_count: personneCount || 1,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log dossier updated
   */
  logDossierUpdated(dossierId: string, updateType?: string): void {
    this.logEvent(ANALYTICS_EVENTS.DOSSIER_UPDATED, {
      dossier_id: dossierId,
      update_type: updateType || 'general',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log dossier shared
   */
  logDossierShared(dossierId: string, sharedWith?: string): void {
    this.logEvent(ANALYTICS_EVENTS.DOSSIER_SHARED, {
      dossier_id: dossierId,
      shared_with: sharedWith || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log signalement created
   */
  logSignalementCreated(signalementId: string, type?: string): void {
    this.logEvent(ANALYTICS_EVENTS.SIGNALEMENT_CREATED, {
      signalement_id: signalementId,
      signalement_type: type || 'sighting',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log signalement verified
   */
  logSignalementVerified(signalementId: string): void {
    this.logEvent(ANALYTICS_EVENTS.SIGNALEMENT_VERIFIED, {
      signalement_id: signalementId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log signalement rejected
   */
  logSignalementRejected(signalementId: string, reason?: string): void {
    this.logEvent(ANALYTICS_EVENTS.SIGNALEMENT_REJECTED, {
      signalement_id: signalementId,
      rejection_reason: reason || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log error
   */
  logError(errorMessage: string, errorCode?: string, context?: string): void {
    this.logEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: errorMessage,
      error_code: errorCode || 'unknown',
      error_context: context || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log API error
   */
  logApiError(endpoint: string, statusCode: number, errorMessage?: string): void {
    this.logEvent(ANALYTICS_EVENTS.API_ERROR, {
      api_endpoint: endpoint,
      http_status: statusCode,
      error_message: errorMessage || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log network error
   */
  logNetworkError(errorMessage: string, endpoint?: string): void {
    this.logEvent(ANALYTICS_EVENTS.NETWORK_ERROR, {
      error_message: errorMessage,
      api_endpoint: endpoint || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log timing
   */
  logTiming(params: TimingParams): void {
    this.logEvent('timing_complete', {
      timing_category: params.timingCategory,
      timing_name: params.timingName,
      value: params.timingValue,
      timing_label: params.timingLabel || '',
    });
  }

  /**
   * Log conversion
   */
  logConversion(params: ConversionParams): void {
    this.logEvent('conversion_complete', {
      conversion_id: params.conversionId,
      conversion_value: params.conversionValue || 0,
      currency: params.conversionCurrency || 'USD',
      conversion_type: params.conversionType,
    });
  }

  /**
   * Log exception
   */
  logException(description: string, fatal: boolean = false): void {
    this.logEvent('exception', {
      description: description,
      fatal: fatal,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sanitize parameters (Firebase has strict requirements)
   */
  private sanitizeParams(params?: AnalyticsEventParams): Record<string, any> {
    if (!params) return {};

    const sanitized: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Firebase Analytics parameter name limit is 32 characters
      const sanitizedKey = key.substring(0, 32);

      // Firebase Analytics value limits vary by type
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = value.substring(0, 100); // Max 100 chars
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = Number(value);
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      }
    });

    return sanitized;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const firebaseAnalyticsService = new FirebaseAnalyticsService();

// ============================================
// EXPORTS
// ============================================

export default firebaseAnalyticsService;
