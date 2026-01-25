# Guide de Routage - Pages NGO

## 📍 Routes à Configurer

### Routes Principales NGO

```typescript
// Dans votre Router/Routes configuration

import {
  NGODashboardPage,
  NGOCasesPage,
  NGOCampagnesPage,
  NGOResourcesPage,
  NGOPartnershipsPage
} from '@/pages/ngo';

// Configuration des routes
const ngoRoutes = [
  {
    path: '/ngo',
    element: <NGODashboardPage />,
    meta: { title: 'ONG Dashboard' }
  },
  {
    path: '/ngo/dashboard',
    element: <NGODashboardPage />,
    meta: { title: 'ONG Dashboard' }
  },
  {
    path: '/ngo/cases',
    element: <NGOCasesPage />,
    meta: { title: 'ONG Cases' }
  },
  {
    path: '/ngo/campaigns',
    element: <NGOCampagnesPage />,
    meta: { title: 'ONG Campaigns' }
  },
  {
    path: '/ngo/resources',
    element: <NGOResourcesPage />,
    meta: { title: 'ONG Resources' }
  },
  {
    path: '/ngo/partnerships',
    element: <NGOPartnershipsPage />,
    meta: { title: 'ONG Partnerships' }
  }
];
```

---

## 🗺️ Structure de Navigation

### Hiérarchie de Routage

```
/
├── /ngo/dashboard           (Page d'accueil ONG)
├── /ngo/cases               (Gestion des cas)
├── /ngo/campaigns           (Campagnes)
├── /ngo/resources           (Ressources)
├── /ngo/partnerships        (Partenaires)
├── /ngo/search?q=term       (Recherche)
└── ... (autres routes)
```

---

## 🧭 Navigation Inter-Pages

### Sidebar Navigation Items

```typescript
const navigationItems: NavigationItem[] = [
  {
    icon: '📊',
    label: t('ngo.navigation.dashboard'),
    path: '/ngo/dashboard'
  },
  {
    icon: '👥',
    label: t('ngo.navigation.cases'),
    path: '/ngo/cases'
  },
  {
    icon: '📢',
    label: t('ngo.navigation.campaigns'),
    path: '/ngo/campaigns'
  },
  {
    icon: '📚',
    label: t('ngo.navigation.resources'),
    path: '/ngo/resources'
  },
  {
    icon: '🤝',
    label: t('ngo.navigation.partnerships'),
    path: '/ngo/partnerships'
  }
];
```

### Navigation Programmatique

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigation simple
onClick={() => navigate('/ngo/cases')}

// Navigation avec paramètres
onClick={() => navigate('/ngo/search?q=missing')}

// Retour en arrière
onClick={() => navigate(-1)}
```

---

## 🔍 Route de Recherche Globale

### Endpoint Recherche

```typescript
// Header Search Handler
const handleSearch = (searchTerm: string) => {
  navigate(`/ngo/search?q=${encodeURIComponent(searchTerm)}`);
};
```

### Récupération du Query Param

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const query = searchParams.get('q') || '';
```

---

## 🎯 Redirection par Authentification

### Protection des Routes

```typescript
// À l'intérieur de chaque page
useEffect(() => {
  // 1. Si pas authentifié → login
  if (!currentUser) {
    navigate('/auth/login');
    return;
  }

  // 2. Si pas le bon rôle → unauthorized
  if (currentUser.role !== 'ONG') {
    navigate('/auth/unauthorized');
    return;
  }

  // 3. Si pas de permission → unauthorized
  if (!hasPermission('ngo:view_*')) {
    navigate('/auth/unauthorized');
    return;
  }

  // 4. Charger les données
  loadData();
}, [currentUser, navigate, hasPermission, loadData]);
```

---

## 📲 Breadcrumbs (Optionnel)

### Implémentation Proposée

```typescript
// Component: BreadcrumbNav
const BreadcrumbNav: React.FC<BreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav className={styles.breadcrumbs}>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className={styles.separator}> / </span>}
          <button
            onClick={() => navigate(item.path)}
            className={item.active ? styles.active : ''}
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
};

// Usage dans DashboardPage
<BreadcrumbNav items={[
  { label: t('ngo.dashboard'), path: '/ngo/dashboard', active: true }
]} />
```

---

## 🎭 Patterns de Navigation Avancée

### Avec État (Keep Scroll Position)

```typescript
// Sauvegarder scroll position avant navigation
const [scrollPosition, setScrollPosition] = useState(0);

const handleNavigate = (path: string) => {
  setScrollPosition(window.scrollY);
  navigate(path);
};

// Restaurer scroll position après montage
useEffect(() => {
  window.scrollTo(0, scrollPosition);
}, [scrollPosition]);
```

### Avec Confirmation

```typescript
const handleNavigateWithConfirm = (path: string) => {
  if (hasUnsavedChanges) {
    const confirmed = window.confirm('Vous avez des modifications non sauvegardées. Continuer?');
    if (!confirmed) return;
  }
  navigate(path);
};
```

---

## 🔗 Liens Internes

### Exemple: De Cases à Campaigns

```typescript
// CasesPage.tsx
<button
  className={styles.actionButton}
  onClick={() => navigate('/ngo/campaigns')}
>
  {t('ngo.viewCampaigns')}
</button>
```

### Exemple: Back to Dashboard

```typescript
<button
  className={styles.backButton}
  onClick={() => navigate('/ngo/dashboard')}
>
  {t('common.backToDashboard')}
</button>
```

---

## 📊 Tableau de Routage Complet

| Route | Component | Role Required | Permission | Description |
|-------|-----------|---------------|-----------|-------------|
| `/ngo` | Dashboard | ONG | ngo:view_dashboard | Accueil |
| `/ngo/dashboard` | Dashboard | ONG | ngo:view_dashboard | Même route (alias) |
| `/ngo/cases` | Cases | ONG | ngo:view_cases | Gestion des cas |
| `/ngo/campaigns` | Campaigns | ONG | ngo:view_campaigns | Campagnes |
| `/ngo/resources` | Resources | ONG | ngo:view_resources | Ressources |
| `/ngo/partnerships` | Partnerships | ONG | ngo:view_partnerships | Partenaires |
| `/ngo/search` | Search Results | ONG | ngo:view_* | Recherche globale |

---

## 🚀 Implémentation dans le Router Principal

### Exemple Complet

```typescript
// src/routes/Router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { NGODashboardPage, NGOCasesPage, ... } from '@/pages/ngo';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      // ... autres routes

      // ONG Routes
      {
        path: 'ngo',
        children: [
          {
            index: true,
            element: <NGODashboardPage />
          },
          {
            path: 'dashboard',
            element: <NGODashboardPage />
          },
          {
            path: 'cases',
            element: <NGOCasesPage />
          },
          {
            path: 'campaigns',
            element: <NGOCampagnesPage />
          },
          {
            path: 'resources',
            element: <NGOResourcesPage />
          },
          {
            path: 'partnerships',
            element: <NGOPartnershipsPage />
          },
          {
            path: 'search',
            element: <SearchResultsPage /> // Optional
          }
        ]
      }
    ]
  }
]);

export function Router() {
  return <RouterProvider router={router} />;
}
```

---

## 🎯 Lazy Loading Routes (Optimisation)

```typescript
import { lazy, Suspense } from 'react';

const NGODashboardPage = lazy(() => import('@/pages/ngo').then(m => ({ default: m.NGODashboardPage })));
const NGOCasesPage = lazy(() => import('@/pages/ngo').then(m => ({ default: m.NGOCasesPage })));
// ...

// Dans le router:
{
  path: 'ngo/dashboard',
  element: (
    <Suspense fallback={<LoadingPage />}>
      <NGODashboardPage />
    </Suspense>
  )
}
```

---

## 📌 Considérations Importantes

### URL Consistency

✅ **Utiliser des URLs cohérentes:**
```
/ngo/dashboard     ← Préféré
/ngo/campaigns     ← Clair et intuitif
```

❌ **Éviter:**
```
/ONG/Dashboard     ← Casse inconsistante
/ngo-dashboard     ← Tiret au lieu de slash
```

### Query Parameters

```typescript
// Recherche
/ngo/search?q=john&page=2

// Filtres
/ngo/cases?status=active&sort=date
```

### Redirects

```typescript
// Dashboard par défaut
/ngo → /ngo/dashboard (301 Permanent Redirect)

// Non autorisé
/ngo/* (sans permission) → /auth/unauthorized (302 Found)
```

---

## 🧪 Tests de Routage

### Test Navigation

```typescript
test('navigates to cases page when clicking cases link', () => {
  const { getByText } = render(<SidebarNGO />);
  const casesLink = getByText(/cases/i);
  
  userEvent.click(casesLink);
  
  expect(useNavigate).toHaveBeenCalledWith('/ngo/cases');
});
```

### Test Protection

```typescript
test('redirects to login when not authenticated', () => {
  const { useNavigate } = require('react-router-dom');
  
  render(<NGODashboardPage />);
  
  // Vérifier que la navigation vers login s'est produite
  expect(useNavigate).toHaveBeenCalledWith('/auth/login');
});
```

---

## 📚 Références

- [React Router v6 Docs](https://reactrouter.com/)
- [useNavigate Hook](https://reactrouter.com/en/main/hooks/use-navigate)
- [useSearchParams Hook](https://reactrouter.com/en/main/hooks/use-search-params)
