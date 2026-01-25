# 🔧 GUIDE D'INTÉGRATION DES ROUTES

## ⚡ Quick Start

### 1. Intégrer AppRoutes dans App.tsx

**Avant:**
```typescript
// src/App.tsx (ancien)
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Old routing or placeholder */}
    </div>
  );
}

export default App;
```

**Après:**
```typescript
// src/App.tsx (nouveau)
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
```

---

## 📋 Vérifications Prérequises

### 1. Redux Store
Assurer que le store a une structure user:

```typescript
// store/auth/authSlice.ts
interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

// store/user/userSelectors.ts
export const selectCurrentUser = (state: RootState) => state.auth.currentUser;
```

### 2. User Type
```typescript
interface User {
  id: string;
  email: string;
  role: NomRole;
  statut: StatutCompte;
  // ... autres champs
}
```

### 3. Enum Rôles
```typescript
// @types/enums.types.ts
export enum NomRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_ORGANISATION = 'admin_organisation',
  OFFICIER_POLICE = 'officier_police',
  AGENT_GENDARMERIE = 'agent_gendarmerie',
  RESPONSABLE_ONG = 'responsable_ong',
  OPERATEUR_SAISIE = 'operateur_saisie',
  MODERATEUR = 'moderateur',
  CITOYEN_VERIFIE = 'citoyen_verifie',
  CITOYEN_STANDARD = 'citoyen_standard'
}
```

---

## 🧪 Tester les Routes

### Test 1: Routes Publiques
```bash
# Accéder sans authentification
http://localhost:3000/
http://localhost:3000/about
http://localhost:3000/contact
http://localhost:3000/donate

# Résultat attendu: Pages s'affichent normalement
```

### Test 2: Redirection Non-Auth
```bash
# Tenter d'accéder route protégée
http://localhost:3000/citizen/dashboard

# Résultat attendu: Redirection vers /auth/login
```

### Test 3: Role-Based Access
```typescript
// Après login avec rôle CITOYEN_STANDARD
http://localhost:3000/citizen/dashboard  // ✅ Fonctionne
http://localhost:3000/admin/dashboard    // ❌ Redirige à /forbidden
http://localhost:3000/authority/dossiers // ❌ Redirige à /forbidden
```

### Test 4: 404 Handling
```bash
http://localhost:3000/nonexistent
# Résultat attendu: NotFoundPage s'affiche
```

---

## 🎯 Utiliser les Routes dans les Composants

### 1. Navigation Programmée
```typescript
import { useNavigate } from 'react-router-dom';
import { CITIZEN_ROUTES } from '@/routes';

export function MyComponent() {
  const navigate = useNavigate();
  
  const handleViewProfile = () => {
    navigate(CITIZEN_ROUTES.PROFILE);
    // ou navigate('/citizen/profile');
  };
  
  return <button onClick={handleViewProfile}>View Profile</button>;
}
```

### 2. Lien Conventionnel
```typescript
import { Link } from 'react-router-dom';
import { AUTHORITY_ROUTES } from '@/routes';

export function MenuBar() {
  return (
    <nav>
      <Link to={AUTHORITY_ROUTES.DOSSIERS}>Dossiers</Link>
      <Link to={AUTHORITY_ROUTES.ALERTES}>Alertes</Link>
      <Link to={AUTHORITY_ROUTES.STATISTIQUES}>Statistiques</Link>
    </nav>
  );
}
```

### 3. Paramètres Dynamiques
```typescript
import { useParams } from 'react-router-dom';
import { getRoute } from '@/routes';

export function DossierDetail() {
  const { id } = useParams();
  
  // Accéder au dossier avec id
  // Route était: /authority/dossiers/:id
  
  return <div>Dossier ID: {id}</div>;
}
```

### 4. Helper Function getRoute()
```typescript
import { getRoute } from '@/routes';

// Générer dynamiquement des URLs
const dossierUrl = getRoute('authority', 'DOSSIER_DETAIL', { id: '123' });
// Résultat: '/authority/dossiers/123'

const citoyenUrl = getRoute('citizen', 'MY_SIGNALEMENTS');
// Résultat: '/citizen/my-signalements'
```

---

## 🔐 Patterns de Sécurité

### 1. Vérifier Authentification
```typescript
import { useAppSelector } from '@/store/types';
import { selectCurrentUser } from '@/features/users/store/userSelectors';

export function ProtectedComponent() {
  const currentUser = useAppSelector(selectCurrentUser);
  
  if (!currentUser) {
    return <div>Non authentifié</div>;
  }
  
  return <div>Bienvenue {currentUser.email}</div>;
}
```

### 2. Vérifier Rôle
```typescript
import { NomRole } from '@/@types/enums.types';

export function AdminOnly() {
  const currentUser = useAppSelector(selectCurrentUser);
  
  if (currentUser?.role !== NomRole.ADMIN_ORGANISATION) {
    return <div>Accès non autorisé</div>;
  }
  
  return <div>Admin Content</div>;
}
```

### 3. Vérifier Statut
```typescript
import { StatutCompte } from '@/@types/enums.types';

export function VerifiedCitizenOnly() {
  const currentUser = useAppSelector(selectCurrentUser);
  
  if (currentUser?.statut !== StatutCompte.ACTIF) {
    return <div>Compte non actif</div>;
  }
  
  return <div>Citizen Content</div>;
}
```

---

## 🐛 Debugging Routes

### 1. Afficher les Routes Actuelles
```typescript
import { useLocation } from 'react-router-dom';

export function RouteDebugger() {
  const location = useLocation();
  
  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, padding: '10px', background: '#f0f0f0' }}>
      <p>Current Path: {location.pathname}</p>
      <p>Search: {location.search}</p>
    </div>
  );
}
```

### 2. Vérifier Redux State
```typescript
import { useAppSelector } from '@/store/types';
import { selectCurrentUser } from '@/features/users/store/userSelectors';

export function AuthDebugger() {
  const currentUser = useAppSelector(selectCurrentUser);
  
  return (
    <pre>
      {JSON.stringify({
        isAuthenticated: !!currentUser,
        user: currentUser,
        role: currentUser?.role
      }, null, 2)}
    </pre>
  );
}
```

### 3. Console Logging
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteLogger() {
  const location = useLocation();
  
  useEffect(() => {
    console.log(`Route changed to: ${location.pathname}`);
  }, [location.pathname]);
}
```

---

## ⚙️ Configuration Avancée

### 1. Lazy Load un Module
```typescript
// routes/CitizenRoutes.tsx (modification future)
import { lazy } from 'react';

const DashboardPage = lazy(() =>
  import('@/pages/citizen/DashboardPage').then(m => ({
    default: m.CitizenDashboardPage
  }))
);
```

### 2. Ajouter Middleware
```typescript
// routes/AppRoutes.tsx (modification future)
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AppRoutes = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Analytics tracking
    logPageView(location.pathname);
    
    // Scroll to top
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // ... rest of component
};
```

### 3. Route-Level Analytics
```typescript
// routes/withRouteTracking.tsx (nouveau)
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracking() {
  const location = useLocation();
  
  useEffect(() => {
    // Google Analytics
    window.gtag?.('config', 'GA_MEASUREMENT_ID', {
      page_path: location.pathname,
      page_title: document.title
    });
  }, [location]);
}
```

---

## 🚨 Erreurs Communes

### Erreur 1: Routes ne s'affichent pas
```
❌ Symptôme: Page blanche, console vide
✅ Solution:
   1. Vérifier que AppRoutes est dans App.tsx
   2. Vérifier que <Router> wrapper AppRoutes
   3. Vérifier imports des pages
```

### Erreur 2: Redirects non-auth ne fonctionnent pas
```
❌ Symptôme: Peut accéder /citizen/dashboard sans login
✅ Solution:
   1. Vérifier Redux selectCurrentUser
   2. Vérifier que currentUser est null quand pas loggé
   3. Vérifier PrivateRoute logic
```

### Erreur 3: Role-based access ne fonctionne pas
```
❌ Symptôme: Admin peut accéder /citizen/dashboard
✅ Solution:
   1. Vérifier que user.role est défini
   2. Vérifier que NomRole enum est correct
   3. Vérifier RoleBasedRoute requiredRoles
```

### Erreur 4: Boucle infinie de redirects
```
❌ Symptôme: Redirect loop /auth/login → ...
✅ Solution:
   1. Vérifier que LoginPage ne redirige pas
   2. Vérifier que auth state se met à jour
   3. Vérifier PrivateRoute condition
```

---

## 📚 Ressources

- **React Router:** https://reactrouter.com/
- **Redux:** https://redux.js.org/
- **TypeScript:** https://www.typescriptlang.org/

---

## ✅ Checklist d'Intégration Finale

- [ ] AppRoutes importé dans App.tsx
- [ ] Router wrapper ajouté
- [ ] Redux store vérifiée
- [ ] User type défini
- [ ] NomRole enum vérifiée
- [ ] Routes publiques testées
- [ ] Routes auth testées
- [ ] Redirects non-auth testés
- [ ] Role-based access testé
- [ ] 404 pages testées
- [ ] Navigation fonctionnelle
- [ ] Links vs useNavigate cohérents
- [ ] getRoute() utilisé correctement
- [ ] Debug tools configurés
- [ ] Pas d'erreurs console

---

**Status:** 🎉 PRÊT POUR INTÉGRATION  
**Date:** 18 Janvier 2026  
**Support:** Voir ROUTES_IMPLEMENTATION_COMPLETE.md
