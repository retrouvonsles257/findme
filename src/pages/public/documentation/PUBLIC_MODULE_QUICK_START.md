# PUBLIC MODULE - QUICK START GUIDE

## Démarrage rapide pour développeurs

### 1. Fichiers clés à connaître

```
src/pages/public/
├── HomePage.tsx                    # Page d'accueil (cœur du module)
├── SearchPage.tsx                  # Recherche avancée
├── DisparitionsPage.tsx            # Liste des cas
├── DossierDetailPage.tsx           # Détails d'un cas
├── MapPage.tsx                     # Carte (placeholder)
├── AboutPage.tsx                   # À propos
├── ContactPage.tsx                 # Contact + formulaire
├── DonatePage.tsx                  # Donations
├── HowItWorksPage.tsx              # Fonctionnement
├── PreventingPage.tsx              # Prévention
└── index.ts                        # Exports centralisés
```

### 2. Variables d'environnement

```env
# .env.local
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Importer une page

```typescript
// Méthode 1: Import direct
import HomePage from '@/pages/public/HomePage';

// Méthode 2: Import depuis index.ts
import { HomePage, SearchPage } from '@/pages/public';
```

### 4. Ajouter une route

```typescript
// src/routes/public.routes.tsx
import { HomePage, SearchPage, DisparitionsPage, ... } from '@/pages/public';

export const publicRoutes = [
  { path: '/', element: <HomePage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/disparitions', element: <DisparitionsPage /> },
  { path: '/disparitions/:id', element: <DossierDetailPage /> },
  { path: '/map', element: <MapPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/donate', element: <DonatePage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/preventing', element: <PreventingPage /> },
];
```

### 5. Utiliser les traductions

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <p>{t('disparitions.results_count', { count: 42 })}</p>
    </>
  );
}
```

### 6. Utiliser Supabase

```typescript
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: err } = await supabase
        .from('dossiers')
        .select('*')
        .order('date_creation', { ascending: false });

      if (err) throw err;
      setData(result);
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.nom}</li>
      ))}
    </ul>
  );
}
```

### 7. Pattern: Recherche avec filtres

```typescript
const [search, setSearch] = useState('');
const [statusFilter, setStatusFilter] = useState('');

const loadData = useCallback(async () => {
  try {
    let query = supabase.from('dossiers').select('*');

    // Filtre status
    if (statusFilter) {
      query = query.eq('statut', statusFilter);
    }

    // Recherche texte (case-insensitive)
    if (search) {
      query = query.ilike('nom', `%${search}%`);
    }

    // Tri
    query = query.order('date_creation', { ascending: false });

    const { data, error: err } = await query;
    if (err) throw err;
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [search, statusFilter]);
```

### 8. Pattern: Pagination

```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 12;

const totalPages = Math.ceil(data.length / itemsPerPage);
const startIdx = (currentPage - 1) * itemsPerPage;
const endIdx = startIdx + itemsPerPage;
const paginatedData = data.slice(startIdx, endIdx);

const handleNextPage = () => {
  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
  }
};

const handlePrevPage = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
  }
};
```

### 9. Pattern: Formulaire

```typescript
const [formData, setFormData] = useState({
  nom: '',
  email: '',
  message: '',
});

const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(false);

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value,
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from('contacts')
      .insert({
        ...formData,
        date_creation: new Date().toISOString(),
        statut: 'nouveau',
      });

    if (err) throw err;

    setSuccess(true);
    setFormData({ nom: '', email: '', message: '' });
    
    // Réinitialiser après 5 secondes
    setTimeout(() => setSuccess(false), 5000);
  } catch (err) {
    console.error('Error:', err);
    setError('Erreur lors de l\'envoi');
  } finally {
    setLoading(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    {success && <p className="success">Succès!</p>}
    {error && <p className="error">{error}</p>}

    <input
      name="nom"
      value={formData.nom}
      onChange={handleChange}
      required
    />
    <textarea
      name="message"
      value={formData.message}
      onChange={handleChange}
      required
    />

    <button type="submit" disabled={loading}>
      {loading ? 'Envoi...' : 'Envoyer'}
    </button>
  </form>
);
```

### 10. Styling: Ajouter du CSS

```typescript
// MyComponent.tsx
import styles from './MyComponent.module.css';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Titre</h1>
      <p className={styles.text}>Texte</p>
    </div>
  );
}

// MyComponent.module.css
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 2rem;
  color: #1e3c72;
  font-weight: 800;
  margin-bottom: 1rem;
}

.text {
  color: #555;
  line-height: 1.6;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .title {
    font-size: 1.5rem;
  }
}
```

### 11. Erreurs communes

#### Problème: "Module not found"
```typescript
// ❌ Incorrect
import { HomePage } from './HomePage';

// ✅ Correct
import { HomePage } from '@/pages/public';
// ou
import HomePage from '@/pages/public/HomePage';
```

#### Problème: Traductions manquantes
```typescript
// ❌ Résultat: "en.home.title is missing"
const { t } = useTranslation();
<h1>{t('home.title')}</h1>

// ✅ Vérifier que la clé existe dans public.json
// src/locales/fr/public.json
{
  "home": {
    "title": "Ensemble, Retrouvons-les"
  }
}
```

#### Problème: Supabase auth errors
```typescript
// ✅ Vérifier les env variables
console.log(process.env.REACT_APP_SUPABASE_URL);
console.log(process.env.REACT_APP_SUPABASE_ANON_KEY);

// ✅ Vérifier RLS policies sur Supabase Dashboard
```

#### Problème: Styles ne s'appliquent pas
```typescript
// ❌ Incorrect (CSS standard sans module)
<div className="container">

// ✅ Correct (CSS Module)
import styles from './MyComponent.module.css';
<div className={styles.container}>
```

### 12. Commandes utiles

```bash
# Build
npm run build

# Vérifier les types
npm run type-check

# Linter
npm run lint

# Dev server
npm start

# Chercher une page
grep -r "export.*Page" src/pages/public/

# Chercher une traduction
grep -r "home.title" src/locales/

# Compte les lignes
wc -l src/pages/public/*.tsx
```

### 13. Checklist: Créer une nouvelle page

- [ ] Créer `NewPage.tsx` dans `src/pages/public/`
- [ ] Créer `NewPage.module.css` pour le styling
- [ ] Importer `useTranslation` de `react-i18next`
- [ ] Importer les types/interfaces nécessaires
- [ ] Implémenter le composant React.FC
- [ ] Ajouter l'export dans `src/pages/public/index.ts`
- [ ] Ajouter les traductions dans `src/locales/fr/public.json`
- [ ] Ajouter les traductions dans `src/locales/en/public.json`
- [ ] Ajouter la route dans le router
- [ ] Tester sur mobile, tablette, desktop
- [ ] Vérifier les traductions FR/EN
- [ ] Tester les fonctionnalités
- [ ] Vérifier pas d'erreurs console

### 14. Déboguer avec React DevTools

```typescript
// Vérifier le state
const [data, setData] = useState([]);
// React DevTools shows: data = []

// Vérifier i18n
const { i18n } = useTranslation();
console.log(i18n.language); // 'fr' ou 'en'

// Vérifier Supabase
import { supabase } from '@/services/supabaseClient';
console.log(supabase); // Configuration
```

### 15. Performance Tips

```typescript
// ✅ Bon: Utiliser useCallback pour dépendances
const loadData = useCallback(async () => {
  // ...
}, [dependencies]);

// ✅ Bon: Pagination côté client
const paginatedData = data.slice(start, end);

// ✅ Bon: Lazy load images
<img loading="lazy" src={url} />

// ❌ Mauvais: Refetch à chaque render
useEffect(() => {
  loadData(); // Sans dépendances = refetch constant
}, []);

// ❌ Mauvais: Charger tous les éléments
const { data } = await supabase.from('dossiers').select('*');
// mieux: limiter avec .limit(100)
```

### 16. Resources

- [React Docs](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [Supabase Docs](https://supabase.com/docs)
- [i18next Docs](https://www.i18next.com)
- [CSS Modules](https://github.com/css-modules/css-modules)

---

**Besoin d'aide?**
- Consulter `PUBLIC_MODULE_DOCUMENTATION.md` pour la doc complète
- Consulter `PUBLIC_MODULE_VERIFICATION.md` pour les checklists
- Vérifier les fichiers existants comme exemples
