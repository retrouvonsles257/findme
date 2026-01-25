# Guide de Déploiement - Modules NGO

## ✅ Checklist Pré-Déploiement

### 1. Vérifications des Fichiers

- [ ] `/src/components/layout/Header/HeaderNGO.tsx` existe
- [ ] `/src/components/layout/Sidebar/SidebarNGO.tsx` existe
- [ ] `/src/pages/ngo/DashboardPage.tsx` existe
- [ ] `/src/pages/ngo/CasesPage.tsx` existe
- [ ] `/src/pages/ngo/CampagnesPage.tsx` existe
- [ ] `/src/pages/ngo/ResourcesPage.tsx` existe
- [ ] `/src/pages/ngo/PartnershipsPage.tsx` existe
- [ ] `/src/pages/ngo/index.ts` existe
- [ ] `/src/locales/fr/ngo.json` existe
- [ ] `/src/locales/en/ngo.json` existe

### 2. Vérifications de Configuration

- [ ] i18n.config.ts importé ngoFr et ngoEn
- [ ] i18n.config.ts ajoute ngo au namespace array
- [ ] Header/index.ts exporte HeaderNGO
- [ ] Sidebar/index.ts exporte SidebarNGO
- [ ] Routes NGO configurées dans Router

### 3. Vérifications de Compilation

```bash
# Compiler TypeScript
npm run build

# ✅ Succès: Aucune erreur TypeScript
# ❌ Erreur: Voir section "Dépannage" ci-dessous
```

### 4. Vérifications Supabase

#### Tables Requises

```sql
-- 1. dossiers table
SELECT * FROM dossiers LIMIT 1;
-- Colonnes requises: id, nom, prenom, localisation, statut, date_disparition, date_creation

-- 2. campagnes table
SELECT * FROM campagnes LIMIT 1;
-- Colonnes requises: id, titre, description, statut, date_debut, date_fin, objectif

-- 3. ressources_ngo table
SELECT * FROM ressources_ngo LIMIT 1;
-- Colonnes requises: id, titre, type, description, url, date_creation

-- 4. partenariats_ngo table
SELECT * FROM partenariats_ngo LIMIT 1;
-- Colonnes requises: id, organisation_name, contact_person, email, phone, statut, date_partnership

-- 5. audit_logs table
SELECT * FROM audit_logs LIMIT 1;
-- Colonnes requises: id, action_type, description, timestamp, entity_type
```

#### Vérification d'Accès

```sql
-- Vérifier que l'utilisateur peut accéder à ces tables
-- (Vérifier les politiques RLS)

-- Pour un utilisateur ONG:
SELECT COUNT(*) FROM dossiers;
SELECT COUNT(*) FROM campagnes;
SELECT COUNT(*) FROM ressources_ngo;
SELECT COUNT(*) FROM partenariats_ngo;
SELECT COUNT(*) FROM audit_logs;
```

### 5. Vérifications des Permissions

#### Permissions Supabase Requises

```sql
-- Vérifier que ces permissions existent dans la table user_permissions
SELECT * FROM user_permissions WHERE permission LIKE 'ngo:%';

-- Permissions attendues:
-- ngo:view_dashboard
-- ngo:view_cases
-- ngo:view_campaigns
-- ngo:view_resources
-- ngo:view_partnerships
```

#### Attribution des Permissions

```sql
-- Pour un utilisateur ONG avec id = 'user_id'
INSERT INTO user_permissions (user_id, permission)
VALUES 
  ('user_id', 'ngo:view_dashboard'),
  ('user_id', 'ngo:view_cases'),
  ('user_id', 'ngo:view_campaigns'),
  ('user_id', 'ngo:view_resources'),
  ('user_id', 'ngo:view_partnerships');
```

---

## 🚀 Étapes de Déploiement

### Phase 1: Préparation

#### 1.1 Créer une branche
```bash
git checkout -b feature/ngo-module-implementation
```

#### 1.2 Vérifier les fichiers sont présents
```bash
ls -la src/pages/ngo/
ls -la src/components/layout/Header/HeaderNGO.tsx
ls -la src/locales/fr/ngo.json
```

#### 1.3 Compiler et vérifier les erreurs
```bash
npm run build 2>&1 | grep -i error
# Aucune sortie = ✅ Succès
```

### Phase 2: Configuration

#### 2.1 Mettre à jour le Router

```typescript
// src/routes/AppRoutes.tsx ou similaire

import {
  NGODashboardPage,
  NGOCasesPage,
  NGOCampagnesPage,
  NGOResourcesPage,
  NGOPartnershipsPage
} from '@/pages/ngo';

// Ajouter les routes:
{
  path: 'ngo',
  children: [
    { index: true, element: <NGODashboardPage /> },
    { path: 'dashboard', element: <NGODashboardPage /> },
    { path: 'cases', element: <NGOCasesPage /> },
    { path: 'campaigns', element: <NGOCampagnesPage /> },
    { path: 'resources', element: <NGOResourcesPage /> },
    { path: 'partnerships', element: <NGOPartnershipsPage /> }
  ]
}
```

#### 2.2 Mettre à jour les Permissions

```sql
-- Dans Supabase, s'assurer que ces permissions existent:
INSERT INTO roles_permissions (role_id, permission)
SELECT id, 'ngo:view_dashboard' FROM roles WHERE name = 'ONG'
ON CONFLICT DO NOTHING;

INSERT INTO roles_permissions (role_id, permission)
SELECT id, 'ngo:view_cases' FROM roles WHERE name = 'ONG'
ON CONFLICT DO NOTHING;

-- ... (repeat pour all permissions)
```

#### 2.3 Vérifier la Configuration i18n

```typescript
// src/locales/i18n.config.ts
// Doit contenir:
import ngoEn from './en/ngo.json';
import ngoFr from './fr/ngo.json';

// Et dans les resources:
en: {
  // ...
  ngo: ngoEn
},
fr: {
  // ...
  ngo: ngoFr
}

// Et dans le namespace array:
ns: ['common', 'super_admin', 'ngo', ...]
```

### Phase 3: Tests Locaux

#### 3.1 Lancer l'application en développement
```bash
npm start
```

#### 3.2 Tester l'Authentification

- [ ] Se connecter comme utilisateur ONG
- [ ] Vérifier le rôle = 'ONG'
- [ ] Vérifier les permissions incluent 'ngo:view_*'

#### 3.3 Tester la Navigation

- [ ] Cliquer sur le menu NGO (dans la sidebar si disponible)
- [ ] Accéder à `/ngo/dashboard`
- [ ] Vérifier que HeaderNGO et SidebarNGO s'affichent
- [ ] Cliquer sur chaque élément de navigation:
  - [ ] Dashboard
  - [ ] Cases
  - [ ] Campaigns
  - [ ] Resources
  - [ ] Partnerships

#### 3.4 Tester le Chargement des Données

```
Dashboard:
✅ Stats se chargent (4 cartes)
✅ Quick actions affichés
✅ Recent activities listées

Cases:
✅ Table se charge
✅ Données affichées (nom, localisation, etc.)
✅ Pagination fonctionne

Campaigns:
✅ Grille se charge
✅ Cartes affichées
✅ Filtres et recherche fonctionnent

Resources:
✅ Grille se charge
✅ Icônes des types affichées
✅ Liens externes accessibles

Partnerships:
✅ Table se charge
✅ Infos contact affichées
✅ Statuts coloriés correctement
```

#### 3.5 Tester la Recherche et le Filtrage

```
Chaque page:
✅ Boîte de recherche visible
✅ Résultats filtrés en temps réel
✅ Dropdown de filtres accessible
✅ Pagination met à jour correctement
```

#### 3.6 Tester l'i18n

- [ ] Passer la langue à FR:
  - [ ] Tous les textes en français
  - [ ] "Tableau de bord" affiché au lieu de "Dashboard"
  
- [ ] Passer la langue à EN:
  - [ ] Tous les textes en anglais
  - [ ] "Dashboard" affiché correctement

#### 3.7 Tester les Messages d'Erreur

- [ ] Déconnecter l'utilisateur:
  - [ ] Redirect vers `/auth/login`
  - [ ] Message "Veuillez vous connecter"
  
- [ ] Changer le rôle à autre chose:
  - [ ] Redirect vers `/auth/unauthorized`
  - [ ] Message "Accès refusé"

- [ ] Arrêter le serveur Supabase:
  - [ ] Écran d'erreur affiché
  - [ ] Message "Erreur lors du chargement" (i18n)

### Phase 4: Tests de Performance

#### 4.1 Vérifier les Requêtes Supabase

```javascript
// Dans browser console:
// Aller à Supabase Dashboard > Logs
// Vérifier que les requêtes sont faites:

SELECT * FROM dossiers
SELECT * FROM campagnes
SELECT * FROM ressources_ngo
SELECT * FROM partenariats_ngo
SELECT * FROM audit_logs
```

#### 4.2 Vérifier le Temps de Chargement

- [ ] Dashboard < 2s
- [ ] Cases < 3s
- [ ] Campaigns < 3s
- [ ] Resources < 3s
- [ ] Partnerships < 3s

**Si trop lent:**
- Vérifier les indexes Supabase sur les colonnes filtrées
- Vérifier que les .or() queries sont optimisées
- Réduire le nombre de colonnes sélectionnées

### Phase 5: Tests d'Intégration

#### 5.1 Tester avec d'autres Modules

- [ ] De Super Admin vers NGO (si applicable)
- [ ] De NGO vers Citizen (si applicable)
- [ ] Vérifier que les redirections de rôle fonctionnent

#### 5.2 Tester les CSS

- [ ] HeaderNGO et SidebarNGO visibles
- [ ] Styles cohérents avec le reste de l'app
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode (si applicable)

#### 5.3 Tester les Edge Cases

```javascript
// Données vides
- Déletionner tous les dossiers
- Vérifier "Pas de cas trouvés" s'affiche
- Les stats restent à 0

// Recherche vide
- Cliquer sur une page sans résultats
- Vérifier que la pagination est désactivée

// Permissions manquantes
- Créer un utilisateur ONG sans permission
- Vérifier que '/ngo/dashboard' redirige
```

---

## 🔧 Dépannage

### Erreur: "Cannot find module"

```
Error: Cannot find module '@/pages/ngo'
```

**Solution:**
1. Vérifier que `/src/pages/ngo/index.ts` existe
2. Vérifier les exports dans index.ts
3. Vérifier que la structure des dossiers est correcte

### Erreur: "HeaderNGO is not defined"

```
Error: HeaderNGO is not defined
```

**Solution:**
1. Vérifier que `/src/components/layout/Header/HeaderNGO.tsx` existe
2. Vérifier que Header/index.ts l'exporte
3. Rebuilder: `npm run build`

### Erreur: "t() function not defined"

```
Error: t is not a function
```

**Solution:**
1. Vérifier l'import: `import { useI18n } from '@/hooks'`
2. Vérifier que ngo.json existe (FR et EN)
3. Vérifier que i18n.config.ts importe ngoEn et ngoFr

### Problème: Les données ne se chargent pas

**Checklist:**
1. ✅ Console Supabase: Tables existent?
2. ✅ Console Supabase: Données présentes?
3. ✅ Browser Console: Erreurs réseau?
4. ✅ Browser Console: Erreurs permission (403)?
5. ✅ Vérifier les RLS policies

### Problème: Pagination ne fonctionne pas

**Solution:**
1. Vérifier que itemsPerPage <= data.length
2. Vérifier que totalPages = Math.ceil(data.length / itemsPerPage)
3. Vérifier que currentPage est en range [1, totalPages]

### Problème: Recherche ne retourne rien

**Solution:**
1. Vérifier la casse (ilike est case-insensitive)
2. Vérifier les colonnes recherchées existent
3. Vérifier les données contiennent le terme recherché

---

## 📊 Tableau de Déploiement

| Étape | Tâche | Statut | Notes |
|-------|-------|--------|-------|
| 1 | Vérifier fichiers | ⭕ | 8 fichiers à vérifier |
| 2 | Compiler | ⭕ | npm run build |
| 3 | Configurer Routes | ⭕ | 6 routes à ajouter |
| 4 | Configurer Permissions | ⭕ | 5 permissions à vérifier |
| 5 | Tests Locaux | ⭕ | Navigation + données |
| 6 | Tests i18n | ⭕ | FR/EN |
| 7 | Tests Performance | ⭕ | Temps de chargement |
| 8 | Tests Intégration | ⭕ | Avec autres modules |
| 9 | Commit & Push | ⭕ | git commit -m "feat: NGO module" |
| 10 | Code Review | ⭕ | Peer review |
| 11 | Déploiement Staging | ⭕ | Test en environnement staging |
| 12 | Déploiement Production | ⭕ | Déployer en prod |

---

## 🎯 Critères de Succès

### Avant de Déployer en Production

- ✅ Toutes les pages compilent
- ✅ Aucune erreur TypeScript
- ✅ Aucune erreur JavaScript (console)
- ✅ Toutes les permissions configurées
- ✅ Toutes les traductions présentes (FR/EN)
- ✅ Pagination fonctionne
- ✅ Recherche/Filtrage fonctionnent
- ✅ Messages d'erreur affichés correctement
- ✅ Loading states visibles
- ✅ Responsive design fonctionne
- ✅ Tests de sécurité (authentification/permissions)
- ✅ Pas de données sensibles loggées en console

---

## 📝 Rollback Plan

### Si Quelque Chose ne Fonctionne pas en Production

```bash
# 1. Identifier le problème
# (Vérifier Sentry/logs, browser console)

# 2. Revert le commit
git revert <commit-hash>

# 3. Redéployer
npm run build && npm run deploy

# 4. Investiguer localement
npm start
# Reproduire le problème

# 5. Fix et tester
npm run build
npm start

# 6. Commit du fix
git add .
git commit -m "fix: NGO module issue"

# 7. Redéployer
npm run deploy
```

---

## 📞 Support et Questions

### Ressources
- [Documentation NGO Complète](./NGO_PAGES_DOCUMENTATION.md)
- [Architecture Technique](./TECHNICAL_ARCHITECTURE.md)
- [Guide de Routage](./ROUTING_GUIDE.md)

### Contacts
- DevOps Lead: [contact]
- Project Manager: [contact]
- Tech Lead: [contact]
