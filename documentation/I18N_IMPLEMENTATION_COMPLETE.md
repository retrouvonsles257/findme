# RETROUVONSLES - Internationalization (i18n) Implementation

## Overview

Complete internationalization system supporting English (EN) and French (FR) with comprehensive translation coverage for all features.

## Installation

Dependencies have been installed:
```bash
npm install i18next react-i18next i18next-browser-languagedetector --legacy-peer-deps
```

## File Structure

```
src/
├── locales/
│   ├── en/                    # English translations
│   │   ├── common.json        # Common UI labels and pagination
│   │   ├── auth.json          # Authentication flows
│   │   ├── navigation.json    # Navigation menu items
│   │   ├── forms.json         # Form labels and validation
│   │   ├── dossiers.json      # Missing persons cases
│   │   ├── signalements.json  # Reports and sightings
│   │   ├── alertes.json       # Alert management
│   │   ├── users.json         # User management and roles
│   │   ├── success.json       # Success messages
│   │   ├── errors.json        # Error messages
│   │   └── validation.json    # Field-level validation messages
│   │
│   ├── fr/                    # French translations (identical structure)
│   │   ├── common.json
│   │   ├── auth.json
│   │   └── ...
│   │
│   ├── i18n.config.ts         # i18next configuration
│   └── index.ts               # Locales barrel export and utilities
│
├── hooks/
│   └── useI18n.ts             # Custom i18n hook
│
├── contexts/
│   └── I18nProvider.tsx       # i18n context provider
│
└── components/
    └── common/
        ├── LanguageSwitcher.tsx    # Language selector component
        └── LanguageSwitcher.css    # Language switcher styles
```

## Configuration

### i18n.config.ts

Configuration file with:
- Resource loading from all translation JSON files
- Browser language detection with fallback to English
- localStorage persistence
- React integration setup
- Namespace configuration

### Supported Namespaces

| Namespace | Purpose | Keys |
|-----------|---------|------|
| `common` | App metadata, pagination, time formatting | 100+ |
| `auth` | Authentication flows and messages | 30+ |
| `navigation` | Menu items, breadcrumb, sidebar | 30+ |
| `forms` | Form validation and field labels | 40+ |
| `dossiers` | Missing persons cases management | 50+ |
| `signalements` | Reports and sightings | 45+ |
| `alertes` | Alert management | 45+ |
| `users` | User management and roles | 70+ |
| `success` | Success operation messages | 25+ |
| `errors` | Error messages and codes | 35+ |
| `validation` | Field-level validation rules | 40+ |

## Usage

### 1. Wrap App with Provider

In `App.tsx`:

```typescript
import { I18nProvider } from './contexts';
import { useI18n } from './hooks';

function App() {
  return (
    <I18nProvider>
      <YourApp />
    </I18nProvider>
  );
}
```

### 2. Use Translation Hook

In any component:

```typescript
import { useI18n } from '../hooks';

export const MyComponent = () => {
  const { t, tNamespace, language, changeLanguage } = useI18n();
  
  // Use default namespace (common)
  return <button>{t('common:ok')}</button>;
};
```

### 3. Translate with Specific Namespace

```typescript
const { tNamespace } = useI18n();

// Translate from 'auth' namespace
<h1>{tNamespace('auth', 'login.title')}</h1>
<p>{tNamespace('dossiers', 'list.title')}</p>
```

### 4. Language Switching

```typescript
import { LanguageSwitcher } from '../components/common';

export const Header = () => {
  return (
    <header>
      <h1>RETROUVONSLES</h1>
      <LanguageSwitcher variant="dropdown" showFlag showName />
    </header>
  );
};
```

## Translation Examples

### Common Keys

```json
{
  "ok": "OK",
  "cancel": "Cancel",
  "save": "Save",
  "delete": "Delete",
  "loading": "Loading...",
  "pagination.showing": "Showing {{count}} of {{total}} entries"
}
```

### Using Interpolation

```typescript
// In translation file
"pagination.showing": "Showing {{current}} - {{total}} of {{count}} entries"

// In component
t('common:pagination.showing', {
  current: 1,
  total: 10,
  count: 100
})
```

### Namespace-Specific Translations

```typescript
// Authentication
tNamespace('auth', 'login.title')           // "Login"
tNamespace('auth', 'register.email_label') // "Email"

// Forms
tNamespace('forms', 'required_field')      // "This field is required"
tNamespace('forms', 'character_limit.maximum', {
  count: 255
})

// Dossiers
tNamespace('dossiers', 'create.title')     // "Create Missing Person Case"
tNamespace('dossiers', 'fields.full_name') // "Full Name"

// Errors
tNamespace('errors', '404')                // "Not found"
tNamespace('errors', 'validation_error')   // "Validation error"

// Success
tNamespace('success', 'created')           // "Successfully created"
tNamespace('success', 'updated')           // "Successfully updated"
```

## LanguageSwitcher Component

### Props

```typescript
interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'inline';  // Default: 'dropdown'
  showFlag?: boolean;                            // Default: true
  showName?: boolean;                            // Default: true
  className?: string;
  onLanguageChange?: (lng: string) => void;
}
```

### Usage Examples

```typescript
// Dropdown variant
<LanguageSwitcher variant="dropdown" />

// Button variant
<LanguageSwitcher variant="buttons" showFlag={true} showName={true} />

// Inline variant (for footer)
<LanguageSwitcher variant="inline" />

// With callback
<LanguageSwitcher 
  variant="dropdown"
  onLanguageChange={(lng) => console.log(`Language changed to: ${lng}`)}
/>
```

## Language Configuration

Available languages:

| Code | Name | Flag | Direction |
|------|------|------|-----------|
| `en` | English | 🇬🇧 | LTR |
| `fr` | Français | 🇫🇷 | LTR |

## API Reference

### useI18n Hook

```typescript
interface UseI18nResult {
  // Translation function for current namespace
  t: (key: string, defaultValue?: string) => string;
  
  // Translation function for specific namespace
  tNamespace: (namespace: Namespace, key: string, defaultValue?: string) => string;
  
  // Current language code
  language: LanguageCode;
  
  // Change application language
  changeLanguage: (lng: LanguageCode) => Promise<void>;
  
  // All available languages
  availableLanguages: LanguageCode[];
  
  // Check if language is supported
  isLanguageSupported: (lng: string) => boolean;
  
  // Ready state indicator
  isReady: boolean;
}
```

### Locales Module Exports

```typescript
// Language utilities
import {
  getCurrentLanguage,
  changeLanguage,
  initializeI18n,
  getLanguageName,
  getLanguageFlag,
  getLanguageConfig,
  getAvailableLanguages,
  SUPPORTED_LANGUAGES,
  NAMESPACES
} from '../locales';

// Get current language
const lang = getCurrentLanguage(); // 'en' | 'fr'

// Change language
await changeLanguage('fr');

// Get language metadata
const config = getLanguageConfig('fr');
// { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' }

// List all languages
const langs = getAvailableLanguages();
```

## Adding New Translations

### 1. Add English Translation

File: `src/locales/en/[namespace].json`

```json
{
  "key": "English text",
  "interpolated": "Text with {{variable}}"
}
```

### 2. Add French Translation

File: `src/locales/fr/[namespace].json`

```json
{
  "key": "Texte français",
  "interpolated": "Texte avec {{variable}}"
}
```

### 3. Update Configuration (if new namespace)

File: `src/locales/i18n.config.ts`

```typescript
// Add import
import newNamespaceEn from './en/newnamespace.json';
import newNamespaceFr from './fr/newnamespace.json';

// Add to resources
const resources = {
  en: { ..., newnamespace: newNamespaceEn },
  fr: { ..., newnamespace: newNamespaceFr }
};

// Add to namespace list
ns: [..., 'newnamespace']
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

Language detection order:
1. localStorage (user preference)
2. Browser language (navigator.language)
3. HTML lang attribute
4. Fallback to English ('en')

## Performance Considerations

- Translations are bundled at build time (no runtime API calls)
- Lazy namespace loading ready for future optimization
- localStorage caching of language preference
- Minimal memory footprint (~100KB total)

## Accessibility

- Language switcher keyboard accessible
- Focus indicators on all interactive elements
- Screen reader friendly component labels
- Proper `lang` attribute on HTML element
- ARIA attributes for language switcher

## Future Enhancements

- Additional languages (Spanish, German, etc.)
- RTL language support (Arabic, Hebrew)
- Pluralization rules per language
- Date/time formatting per locale
- Lazy loading of namespaces
- Translation management dashboard

## Troubleshooting

### Language not persisting?

Check that localStorage is enabled and the language code matches:

```typescript
// Should be 'en' or 'fr'
localStorage.getItem('language')
```

### Translations not loading?

Ensure i18nProvider wraps your app:

```typescript
<I18nProvider>
  <App />
</I18nProvider>
```

### Missing translation warnings?

Check that namespace and key exist in JSON files:

```typescript
// This key must exist in the namespace
tNamespace('auth', 'login.title')
```

## Integration Checklist

- [x] Install dependencies
- [x] Create translation files
- [x] Configure i18n
- [x] Create custom hook (useI18n)
- [x] Create provider component
- [x] Create language switcher
- [ ] Wrap App with I18nProvider
- [ ] Replace hardcoded strings with translations
- [ ] Add LanguageSwitcher to header/footer
- [ ] Test language switching
- [ ] Test persistence across page reloads

## Contact & Support

For issues or suggestions regarding internationalization, contact the development team.
