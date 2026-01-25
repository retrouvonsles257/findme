# i18n Integration Examples

## How to Use Translations in Your Components

### Example 1: Operator Dashboard Component

```typescript
import { useTranslation } from 'react-i18next';
import styles from './OperatorDashboard.module.css';

export function OperatorDashboard() {
  const { t } = useTranslation('operator');
  
  return (
    <div className={styles.container}>
      <h1>{t('dashboardTitle')}</h1>
      <p>{t('dashboardSubtitle')}</p>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.label}>{t('statistics.totalDossiers')}</span>
          <span className={styles.value}>42</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.label}>{t('statistics.dossiersEnCours')}</span>
          <span className={styles.value}>15</span>
        </div>
      </div>
      
      <div className={styles.actions}>
        <button>{t('quickActions.createNewFile')}</button>
        <button>{t('quickActions.enterData')}</button>
      </div>
    </div>
  );
}
```

### Example 2: Moderator Validation Component

```typescript
import { useTranslation } from 'react-i18next';

export function SignalementValidation() {
  const { t } = useTranslation('moderator');
  const [decision, setDecision] = useState('');
  
  return (
    <form>
      <h2>{t('validationTitle')}</h2>
      
      <div>
        <label>{t('validationForm.decision')}</label>
        <select value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="">{t('validationForm.approve')}</option>
          <option value="reject">{t('validationForm.reject')}</option>
          <option value="clarify">{t('validationForm.needsClarification')}</option>
        </select>
      </div>
      
      <div>
        <label>{t('validationForm.confidence')}</label>
        <input type="number" min="0" max="100" />
      </div>
      
      <div>
        <label>{t('validationForm.reason')}</label>
        <textarea></textarea>
      </div>
    </form>
  );
}
```

### Example 3: Authority Dashboard Component

```typescript
import { useTranslation } from 'react-i18next';

export function AuthorityDashboard() {
  const { t } = useTranslation('authority');
  
  return (
    <div>
      <h1>{t('dashboardTitle')}</h1>
      
      <div className="menu">
        <button>{t('menu.alertes')}</button>
        <button>{t('menu.coordination')}</button>
        <button>{t('menu.dossiers')}</button>
        <button>{t('menu.analysis')}</button>
      </div>
      
      <div className="stats">
        <StatCard label={t('statistics.activeDossiers')} value={25} />
        <StatCard label={t('statistics.totalDossiers')} value={150} />
        <StatCard label={t('statistics.foundCases')} value={45} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}
```

## Translation Key Paths

### For Operator Pages:
```
t('operator:dashboardTitle')
t('operator:statistics.totalDossiers')
t('operator:myDossiers.filters.search')
t('operator:createDossier.successMessage')
```

### For Moderator Pages:
```
t('moderator:dashboardTitle')
t('moderator:statistics.totalSignalements')
t('moderator:validationForm.decision')
t('moderator:photoActions.approve')
t('moderator:charts.statusDistribution')
```

### For Authority Pages:
```
t('authority:dashboardTitle')
t('authority:statistics.activeDossiers')
t('authority:menu.coordination')
t('authority:analysis.predictions')
t('authority:investigation.caseStatus')
```

## Using Translations in Navigation

### Update Navigation Components:

```typescript
import { useTranslation } from 'react-i18next';

export function OperatorSidebar() {
  const { t } = useTranslation('operator');
  
  return (
    <nav>
      <a href="/operator">{t('dashboard')}</a>
      <a href="/operator/my-dossiers">{t('myDossiers')}</a>
      <a href="/operator/create">{t('createDossier')}</a>
      <a href="/operator/data-entry">{t('dataEntry')}</a>
    </nav>
  );
}
```

## Language Switching

```typescript
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  return (
    <div>
      <button onClick={() => i18n.changeLanguage('fr')}>
        Français
      </button>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <p>Current language: {i18n.language}</p>
    </div>
  );
}
```

## Nested Translations Example

When accessing nested keys:

```typescript
const { t } = useTranslation('operator');

// Access nested key
<span>{t('statistics.dossiersEnCours')}</span>

// Access deeply nested key
<span>{t('myDossiers.filters.search')}</span>

// Or using dot notation directly
<span>{t('operator:statistics.dossiersEnCours')}</span>
```

## Complete Translation File Example

```json
{
  "operator": {
    "dashboard": "Tableau de bord",
    "dashboardTitle": "Tableau de bord opérateur",
    "statistics": {
      "totalDossiers": "Total dossiers",
      "dossiersEnCours": "En cours",
      "dossiersRetrouvés": "Retrouvés"
    },
    "quickActions": {
      "createNewFile": "Créer un nouveau dossier",
      "enterData": "Saisir les données"
    }
  }
}
```

## Using in TypeScript Components

```typescript
import { useTranslation } from 'react-i18next';
import { FC } from 'react';

interface DossierListProps {
  dossiers: IDossier[];
}

const OperatorDossierList: FC<DossierListProps> = ({ dossiers }) => {
  const { t } = useTranslation('operator');
  
  return (
    <div>
      <h2>{t('myDossiersTitle')}</h2>
      <p>{t('myDossiersSubtitle')}</p>
      
      {dossiers.length === 0 ? (
        <p>{t('noDossiersFound')}</p>
      ) : (
        <ul>
          {dossiers.map(dossier => (
            <li key={dossier.id}>{dossier.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OperatorDossierList;
```

## Common Patterns

### Pattern 1: Labels and Values
```typescript
<label>{t('operator:filters.status')}</label>
```

### Pattern 2: Button Labels
```typescript
<button>{t('operator:quickActions.createNewFile')}</button>
```

### Pattern 3: Form Fields
```typescript
<input placeholder={t('operator:myDossiers.filters.search')} />
```

### Pattern 4: Messages
```typescript
{success && <p>{t('operator:successMessage')}</p>}
```

### Pattern 5: Empty States
```typescript
{items.length === 0 && <p>{t('operator:noDossiers')}</p>}
```

## Testing Translations

```typescript
import { useTranslation } from 'react-i18next';

export function TranslationTest() {
  const { t, i18n } = useTranslation(['operator', 'moderator', 'authority']);
  
  return (
    <div>
      <h2>Current Language: {i18n.language}</h2>
      
      <section>
        <h3>Operator</h3>
        <p>{t('operator:dashboardTitle')}</p>
      </section>
      
      <section>
        <h3>Moderator</h3>
        <p>{t('moderator:dashboardTitle')}</p>
      </section>
      
      <section>
        <h3>Authority</h3>
        <p>{t('authority:dashboardTitle')}</p>
      </section>
      
      <button onClick={() => i18n.changeLanguage('fr')}>FR</button>
      <button onClick={() => i18n.changeLanguage('en')}>EN</button>
    </div>
  );
}
```

## Next Steps for Implementation

1. **Update all page components** to use translation keys instead of hardcoded text
2. **Replace hardcoded strings** in templates with `t()` calls
3. **Test language switching** to ensure all text translates correctly
4. **Add missing translations** for dynamic content as needed
5. **Consider adding** additional languages (Spanish, Arabic, etc.) in future phases
