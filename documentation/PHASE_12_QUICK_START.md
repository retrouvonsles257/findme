# RETROUVONSLES - PHASE 12 QUICK START GUIDE

## 🚀 GET STARTED IN 5 MINUTES

---

## 1️⃣ Installation (Already Done ✅)

Dependencies installed:
```bash
npm install i18next react-i18next i18next-browser-languagedetector --legacy-peer-deps
```

---

## 2️⃣ Wrap Your App (NEXT STEP)

**File:** `src/App.tsx` or `src/main.tsx`

```typescript
import { I18nProvider } from './contexts';

function App() {
  return (
    <I18nProvider>
      {/* Your app components */}
    </I18nProvider>
  );
}

export default App;
```

---

## 3️⃣ Add Language Switcher

**File:** `src/components/layout/Header.tsx`

```typescript
import { LanguageSwitcher } from '../common';

export const Header = () => {
  return (
    <header>
      <h1>RETROUVONSLES</h1>
      <nav>{/* Navigation items */}</nav>
      <LanguageSwitcher variant="dropdown" />
    </header>
  );
};
```

---

## 4️⃣ Use Translations in Components

**Before:**
```typescript
export const LoginPage = () => {
  return (
    <div>
      <h1>Login</h1>
      <input placeholder="Email" />
      <button>Sign In</button>
    </div>
  );
};
```

**After:**
```typescript
import { useI18n } from '../hooks';

export const LoginPage = () => {
  const { t } = useI18n('auth');
  
  return (
    <div>
      <h1>{t('login.title')}</h1>
      <input placeholder={t('login.email_label')} />
      <button>{t('login.sign_in')}</button>
    </div>
  );
};
```

---

## 5️⃣ Test It Works!

```typescript
import { useI18n } from '../hooks';

export const TestComponent = () => {
  const { language, changeLanguage, t } = useI18n();
  
  return (
    <div>
      <p>Current language: {language}</p>
      <p>Hello: {t('common:hello')}</p>
      <button onClick={() => changeLanguage('fr')}>
        Switch to French
      </button>
    </div>
  );
};
```

---

## 📚 Namespace Quick Reference

### Common Usage
```typescript
const { t } = useI18n('auth');
t('login.title')           // From auth namespace
```

### Alternative: Namespace Function
```typescript
const { tNamespace } = useI18n();
tNamespace('auth', 'login.title')     // Same result
tNamespace('dossiers', 'create.title') // Different namespace
```

### All Available Namespaces
```
✅ common       - UI labels, pagination, time
✅ auth         - Authentication (login, register, 2FA)
✅ navigation   - Menu items, navigation
✅ forms        - Form labels, validation
✅ dossiers     - Missing persons cases
✅ signalements - Reports & sightings
✅ alertes      - Alert management
✅ users        - User management & roles
✅ success      - Success messages
✅ errors       - Error messages
✅ validation   - Field validation messages
```

---

## 🎨 Language Switcher Variants

### Dropdown (Recommended for header)
```typescript
<LanguageSwitcher variant="dropdown" showFlag showName />
```

### Buttons (Good for settings page)
```typescript
<LanguageSwitcher variant="buttons" showFlag={true} showName={true} />
```

### Inline (Good for footer)
```typescript
<LanguageSwitcher variant="inline" showFlag={true} showName={true} />
```

---

## 🌍 Supported Languages

| Code | Language | Flag |
|------|----------|------|
| `en` | English | 🇬🇧 |
| `fr` | French | 🇫🇷 |

### Getting Current Language
```typescript
const { language } = useI18n();
console.log(language); // 'en' or 'fr'
```

### Changing Language
```typescript
const { changeLanguage } = useI18n();
await changeLanguage('fr');
```

---

## 💾 Language Persistence

Language preference is automatically saved to localStorage:

```typescript
// Automatically saved to localStorage:
localStorage.getItem('language') // 'en' or 'fr'
```

Language will persist across page reloads and browser sessions.

---

## 🔧 Common Patterns

### Pattern 1: Simple Translation
```typescript
const { t } = useI18n();
<h1>{t('common:welcome')}</h1>
```

### Pattern 2: With Variables
```typescript
const { tNamespace } = useI18n();
tNamespace('common', 'pagination.showing', {
  current: 1,
  total: 10,
  count: 100
})
// Output: "Showing 1 - 10 of 100 entries"
```

### Pattern 3: Multiple Namespaces
```typescript
const { tNamespace } = useI18n();

return (
  <form>
    <h1>{tNamespace('dossiers', 'create.title')}</h1>
    <label>{tNamespace('forms', 'required_field')}</label>
    <input />
    <button>{t('common:save')}</button>
  </form>
);
```

### Pattern 4: Conditional Translations
```typescript
const { language, t } = useI18n();

return (
  <div>
    {language === 'en' && <EnglishContent />}
    {language === 'fr' && <FrenchContent />}
  </div>
);
```

---

## 🐛 Troubleshooting

### Language not changing?
1. Ensure app is wrapped with `I18nProvider`
2. Check language code is 'en' or 'fr'
3. Check browser console for errors

### Translation key not found?
1. Check namespace exists (common, auth, navigation, etc.)
2. Check key exists in JSON file
3. Check JSON file syntax

### Type errors?
1. Import hooks from '../hooks'
2. Check import path is correct
3. Verify namespace is valid

---

## 📖 Full Documentation

For detailed information, see:
- `I18N_IMPLEMENTATION_COMPLETE.md` - Complete guide
- `PHASE_12_FINAL_STATISTICS.md` - Implementation stats
- `PHASE_12_COMPLETION_SUMMARY.md` - Features & summary

---

## ✅ Checklist for Integration

- [ ] Install I18nProvider around your app
- [ ] Add LanguageSwitcher to header/footer
- [ ] Replace hardcoded strings (start with 1 page)
- [ ] Test language switching
- [ ] Test persistence (reload page)
- [ ] Test mobile responsive switcher
- [ ] Test dark mode support
- [ ] Verify all pages translated
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

---

## 🎯 Next Steps

### 1. Start Small
- [ ] Integrate I18nProvider (5 min)
- [ ] Add LanguageSwitcher (5 min)
- [ ] Test one page (10 min)

### 2. Expand Coverage
- [ ] Translate authentication pages (30 min)
- [ ] Translate navigation (15 min)
- [ ] Translate forms (30 min)

### 3. Complete Migration
- [ ] Translate all pages
- [ ] Test all features
- [ ] Deploy to production

---

## 💡 Pro Tips

1. **Use tNamespace for consistency:**
   ```typescript
   // Bad
   t('dossiers:create.title')
   
   // Good
   const { tNamespace } = useI18n();
   tNamespace('dossiers', 'create.title')
   ```

2. **Keep component namespaces consistent:**
   ```typescript
   // In dossiers components
   const { t } = useI18n('dossiers');
   
   // In auth components
   const { t } = useI18n('auth');
   ```

3. **Use proper key naming:**
   ```
   ✅ login.title
   ✅ login.email_label
   ✅ login.error.invalid_credentials
   
   ❌ loginTitle
   ❌ login_email_label
   ❌ LoginErrorInvalidCredentials
   ```

4. **Organize translations logically:**
   ```json
   {
     "create": { ... },
     "list": { ... },
     "detail": { ... },
     "fields": { ... },
     "status": { ... },
     "actions": { ... }
   }
   ```

---

## 📞 Quick Help

### API Reference
```typescript
// Get from useI18n hook
const {
  t,                      // Translate with default namespace
  tNamespace,            // Translate specific namespace
  language,              // Current language ('en' | 'fr')
  changeLanguage,        // Change language
  availableLanguages,    // List of languages
  isLanguageSupported,   // Check if language exists
  isReady                // Is i18n initialized?
} = useI18n(namespace?);
```

### Component Props
```typescript
<LanguageSwitcher
  variant="dropdown"     // 'dropdown' | 'buttons' | 'inline'
  showFlag={true}       // Show flag emoji
  showName={true}       // Show language name
  className=""          // Custom CSS class
  onLanguageChange={() => {}}  // Callback
/>
```

### Utilities
```typescript
import {
  getCurrentLanguage,
  changeLanguage,
  getLanguageName,
  getLanguageFlag,
  getLanguageConfig,
  getAvailableLanguages
} from '../locales';
```

---

## 🎉 You're Ready!

All components are installed and ready to use. Follow the 5-step guide above to integrate internationalization into your application.

**Status:** ✅ READY TO INTEGRATE

Start with Step 2️⃣ above to wrap your app with I18nProvider!

---

**Last Updated:** January 17, 2025
**Phase:** 12 - Internationalization
**Status:** Complete ✅
