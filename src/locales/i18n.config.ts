/**
 * =====================================================
 * RETROUVONSLES - i18n Configuration
 * Internationalization setup with i18next
 * =====================================================
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import commonEn from './en/common.json';
import authEn from './en/auth.json';
import navigationEn from './en/navigation.json';
import formsEn from './en/forms.json';
import dossiersEn from './en/dossiers.json';
import signaiementsEn from './en/signalements.json';
import alertesEn from './en/alertes.json';
import usersEn from './en/users.json';
import successEn from './en/success.json';
import errorsEn from './en/errors.json';
import validationEn from './en/validation.json';
import citizenEn from './en/citizen.json';
import profileEn from './en/profile.json';
import adminEn from './en/admin.json';
import operatorEn from './en/operator.json';
import moderatorEn from './en/moderator.json';
import authorityEn from './en/authority.json';
import superAdminEn from './en/super_admin.json';
import ngoEn from './en/ngo.json';
import publicEn from './en/public.json';

import commonFr from './fr/common.json';
import authFr from './fr/auth.json';
import navigationFr from './fr/navigation.json';
import formsFr from './fr/forms.json';
import dossiersFr from './fr/dossiers.json';
import signaiementsFr from './fr/signalements.json';
import alertesFr from './fr/alertes.json';
import usersFr from './fr/users.json';
import successFr from './fr/success.json';
import errorsFr from './fr/errors.json';
import validationFr from './fr/validation.json';
import citizenFr from './fr/citizen.json';
import profileFr from './fr/profile.json';
import adminFr from './fr/admin.json';
import operatorFr from './fr/operator.json';
import moderatorFr from './fr/moderator.json';
import authorityFr from './fr/authority.json';
import superAdminFr from './fr/super_admin.json';
import ngoFr from './fr/ngo.json';
import publicFr from './fr/public.json';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    navigation: navigationEn,
    forms: formsEn,
    dossiers: dossiersEn,
    signalements: signaiementsEn,
    alertes: alertesEn,
    users: usersEn,
    success: successEn,
    errors: errorsEn,
    validation: validationEn,
    citizen: citizenEn,
    profile: profileEn,
    admin: adminEn,
    operator: operatorEn,
    moderator: moderatorEn,
    authority: authorityEn,
    super_admin: superAdminEn,
    ngo: ngoEn,
    public: publicEn,
  },
  fr: {
    common: commonFr,
    auth: authFr,
    navigation: navigationFr,
    forms: formsFr,
    dossiers: dossiersFr,
    signalements: signaiementsFr,
    alertes: alertesFr,
    users: usersFr,
    success: successFr,
    errors: errorsFr,
    validation: validationFr,
    citizen: citizenFr,
    profile: profileFr,
    admin: adminFr,
    operator: operatorFr,
    moderator: moderatorFr,
    authority: authorityFr,
    super_admin: superAdminFr,
    ngo: ngoFr,
    public: publicFr,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'navigation', 'forms', 'dossiers', 'signalements', 'alertes', 'users', 'success', 'errors', 'validation', 'citizen', 'profile', 'admin', 'operator', 'moderator', 'authority', 'super_admin', 'ngo', 'public'],
    
    keySeparator: false,
    nsSeparator: '.',
    
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
