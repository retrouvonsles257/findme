# Architecture Technique - Pages NGO

## 📦 Structure des Fichiers

```
src/pages/ngo/
├── DashboardPage.tsx          # Page d'accueil
├── CasesPage.tsx              # Gestion des cas
├── CampagnesPage.tsx          # Campagnes de sensibilisation
├── ResourcesPage.tsx          # Ressources et outils
├── PartnershipsPage.tsx       # Partenaires
├── DashboardPage.module.css
├── CasesPage.module.css
├── CampagnesPage.module.css
├── ResourcesPage.module.css
├── PartnershipsPage.module.css
├── index.ts                   # Exports
└── documentation/
    ├── NGO_PAGES_DOCUMENTATION.md
    └── TECHNICAL_ARCHITECTURE.md (ce fichier)
```

---

## 🏗️ Architecture Générale

### Pattern React Utilisé

Chaque page suit ce pattern:

```typescript
export const NGOPageComponent: React.FC = () => {
  // 1. Hooks et état Redux
  const navigate = useNavigate();
  const { t } = useI18n();
  const { hasPermission } = usePermissions();
  const currentUser = useAppSelector(selectCurrentUser);

  // 2. États locaux
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Fonction asynchrone mémorisée
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.from('table').select('*');
      if (err) throw err;
      setData(data || []);
    } catch (err) {
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 4. Effect pour authentification et chargement
  useEffect(() => {
    // Vérifier authentification
    if (!currentUser || (currentUser.role !== NomRole.ONG && currentUser.role !== 'ONG')) {
      navigate('/auth/login');
      return;
    }
    // Vérifier permissions
    if (!hasPermission('ngo:view_*')) {
      navigate('/auth/unauthorized');
      return;
    }
    // Charger données
    loadData();
  }, [currentUser, navigate, hasPermission, loadData]);

  // 5. Rendu
  if (loading) return <LoadingState />;
  return (
    <div>
      <HeaderNGO currentUser={currentUser} />
      <SidebarNGO currentUser={currentUser} />
      {/* Contenu */}
    </div>
  );
};
```

---

## 🔄 Cycle de Vie des Données

### 1. Initialisation
```
Component Mount
    ↓
useEffect triggered
    ↓
Check Authentication
    ↓
Check Permissions
    ↓
Call loadData()
```

### 2. Chargement des Données
```
loadData() called
    ↓
setLoading(true)
    ↓
Supabase Query
    ↓
Update State: setData(data)
    ↓
setLoading(false)
    ↓
Component Re-render
```

### 3. Affichage
```
if (loading) → Spinner
if (error) → Error Message
if (data.length === 0) → Empty State
else → Render Data
```

---

## 🗄️ Supabase Queries

### Pattern Général

```typescript
let query = supabase.from('table_name').select('*');

// Filtrage optionnel
if (filter !== 'all') {
  query = query.eq('column', filter);
}

// Recherche optionnelle
if (searchTerm) {
  query = query.or(`col1.ilike.%term%,col2.ilike.%term%`);
}

// Exécution et casting
const { data, error } = await (query.order('date', { ascending: false }) as any);
```

### Opérateurs Supabase Utilisés

| Opérateur | Usage | Exemple |
|-----------|-------|---------|
| `.select()` | Récupérer colonnes | `.select('id, nom, email')` |
| `.eq()` | Égalité | `.eq('statut', 'active')` |
| `.or()` | OU logique | `.or('nom.ilike...') |
| `.order()` | Tri | `.order('date', {ascending: false})` |
| `.limit()` | Limite | `.limit(100)` |
| `.ilike` | Recherche insensible à la casse | `nom.ilike.%search%` |

---

## 🎯 Gestion des États

### États Implémentés

```typescript
// État de chargement
const [loading, setLoading] = useState(true);

// État des données
const [data, setData] = useState<Type[]>([]);

// États de filtre
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('all');

// État de pagination
const [currentPage, setCurrentPage] = useState(1);

// État d'erreur
const [error, setError] = useState<string | null>(null);
```

### Transitions d'États

```
Initial: loading=true, data=[], error=null
    ↓
Loading: setLoading(true)
    ↓
Success: setData([...]), setLoading(false), error=null
    ↓
Error: setError(message), setLoading(false)
    ↓
Filtered: data filtered but not reloaded
    ↓
Paginated: show items startIdx to endIdx
```

---

## 🔐 Système de Permissions

### Vérification à Deux Niveaux

**Niveau 1: Rôle**
```typescript
if (!currentUser || (currentUser.role !== NomRole.ONG && currentUser.role !== 'ONG')) {
  navigate('/auth/login');
}
```

**Niveau 2: Permission Spécifique**
```typescript
if (!hasPermission('ngo:view_dashboard')) {
  navigate('/auth/unauthorized');
}
```

### Permissions Définies

```
ngo:view_dashboard     → Accès au dashboard
ngo:view_cases        → Lecture des cas
ngo:view_campaigns    → Lecture des campagnes
ngo:view_resources    → Accès aux ressources
ngo:view_partnerships → Lecture des partenariats
```

---

## 📊 Pagination

### Calcul de Pagination

```typescript
const itemsPerPage = 10; // Variable par page
const totalPages = Math.ceil(data.length / itemsPerPage);
const startIdx = (currentPage - 1) * itemsPerPage;
const paginatedData = data.slice(startIdx, startIdx + itemsPerPage);
```

### États de Pagination

- Current Page: 1 (initial)
- Total Pages: Calculated from data length
- Items Per Page: Fixed per page (8-10)

### Navigation

```typescript
// Précédent
onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
disabled={currentPage === 1}

// Suivant
onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
disabled={currentPage === totalPages}
```

---

## 🔍 Recherche et Filtrage

### Recherche Client-Side

```typescript
// Filtre après récupération des données
const filtered = data.filter((item) => {
  const searchLower = searchTerm.toLowerCase();
  return item.nom.includes(searchLower) || item.email.includes(searchLower);
});
```

**Note:** La recherche est également faite server-side lors du chargement des données avec `.or()`.

### Filtrage

```typescript
// Filtre server-side lors du chargement
if (statusFilter !== 'all') {
  query = query.eq('statut', statusFilter);
}

// Client-side si besoin
const filtered = data.filter(item => item.statut === statusFilter);
```

---

## 🎨 Système de Styling

### CSS Modules

Chaque page a son propre fichier CSS:
- `DashboardPage.module.css`
- `CasesPage.module.css`
- etc.

### Classes Communes

```typescript
import styles from './PageName.module.css';

<div className={styles.container}>
  <div className={styles.mainContent}>
    <div className={styles.header}>
      <h1>{t('key')}</h1>
      <p className={styles.subtitle}>{t('key')}</p>
    </div>
```

### Composants Stylisés

| Classe | Usage |
|--------|-------|
| `.container` | Wrapper principal |
| `.mainContent` | Zone de contenu |
| `.header` | En-tête de page |
| `.statsGrid` | Grille de statistiques |
| `.table` | Tableau |
| `.pagination` | Pagination |
| `.loadingContainer` | Loading spinner |
| `.errorMessage` | Message d'erreur |

---

## 🌐 Intégration i18n

### Setup

```typescript
import { useI18n } from '@/hooks';

const { t } = useI18n();
```

### Utilisation

```typescript
// Simple
<h1>{t('ngo.dashboardTitle')}</h1>

// Avec variables (si supporté)
<p>{t('ngo.searchPlaceholder')}</p>
```

### Structure des Traductions

```json
{
  "ngo": {
    "dashboardTitle": "Tableau de bord ONG",
    "casesTitle": "Gestion des cas",
    "searchCases": "Rechercher un cas..."
  }
}
```

---

## 🛡️ Gestion des Erreurs

### Stratégies Implémentées

```typescript
try {
  // 1. Try-Catch pour Supabase
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
} catch (err) {
  // 2. Afficher message i18n
  setError(t('common.errorLoadingData'));
  // 3. Consoler l'erreur complète pour debug
  console.error('Erreur:', err);
} finally {
  // 4. Toujours arrêter le loading
  setLoading(false);
}
```

### Messages d'Erreur

```typescript
// Error display
{error && (
  <div className={styles.errorMessage}>
    ⚠️ {error}
  </div>
)}
```

---

## 🧪 Patterns de Test

### Éléments Testables

1. **Authentification**
   ```typescript
   // Test: Redirect to login si no user
   ```

2. **Permissions**
   ```typescript
   // Test: Redirect to unauthorized si no permission
   ```

3. **Données Supabase**
   ```typescript
   // Test: Mock Supabase et vérifier setData()
   ```

4. **Recherche/Filtrage**
   ```typescript
   // Test: Vérifier que filtered.length <= data.length
   ```

5. **Pagination**
   ```typescript
   // Test: Vérifier totalPages = ceil(data.length / itemsPerPage)
   ```

---

## 📈 Performance Optimizations

### useCallback
```typescript
const loadData = useCallback(async () => {
  // Fonction mémorisée
  // Recréée seulement si dépendances changent
}, [searchTerm, statusFilter, t]);
```

### Avantages
- Évite les re-rendus inutiles
- Stabilise les dépendances useEffect
- Améliore performance avec React.memo()

### Limitation de Requêtes

```typescript
// Seul le chargement initial/filtré déclenche une requête
// La recherche client-side ne re-requête pas
```

---

## 🔄 Flux de Mise à Jour des Données

### Scénario 1: Changement de Filtre
```
User changes filter
    ↓
setStatusFilter(newValue)
    ↓
useEffect triggered (statusFilter in deps)
    ↓
loadData() called
    ↓
Supabase query with new filter
    ↓
setData() updated
    ↓
Re-render with new data
```

### Scénario 2: Changement de Recherche
```
User types in search
    ↓
setSearchTerm(newValue)
    ↓
Filter applied client-side
    ↓
Re-render with filtered data
    ↓
Pagination reset (setCurrentPage(1))
```

---

## 🚀 Optimisations Futures

### Améliorations Possibles

1. **Caching**
   - Cacher les données avec React Query
   - Réduire les appels Supabase

2. **Infinite Scroll**
   - Alternative à la pagination
   - Charge automatiquement au scroll

3. **Soft Delete**
   - Ajouter colonne `deleted_at`
   - Filtrer côté serveur

4. **Real-time Subscriptions**
   - Supabase real-time updates
   - Auto-refresh des données

5. **Advanced Search**
   - Full-text search Supabase
   - Autocomplete suggestions

---

## 📋 Checklist de Déploiement

- [ ] Toutes les pages compilent sans erreurs
- [ ] Permissions configurées dans Supabase
- [ ] Traductions i18n complètes (FR + EN)
- [ ] Routes configurées dans router
- [ ] HeaderNGO et SidebarNGO importés
- [ ] CSS Modules appliqués correctement
- [ ] Tests de permission passés
- [ ] Données Supabase accessibles
- [ ] Pagination fonctionne
- [ ] Recherche/Filtrage fonctionne
- [ ] Messages d'erreur clairs
- [ ] Loading states visibles
- [ ] Empty states affichés

---

## 🔗 Fichiers Connexes

- Header/Sidebar: `/src/components/layout/`
- i18n Config: `/src/locales/i18n.config.ts`
- Types: `/@types/`
- Hooks: `/src/hooks/`
- Services: `/src/services/`
