# Documentation des Pages NGO - RETROUVONSLES

## 📋 Vue d'ensemble

Les pages NGO permettent aux organisations non-gouvernementales de gérer les cas de personnes disparues, les campagnes de sensibilisation, les ressources et les partenariats.

## 📑 Pages Implémentées

### 1. **Dashboard (`/ngo/dashboard`)**
**Fichier:** `DashboardPage.tsx`

#### Objectifs
- Afficher un aperçu des statistiques clés de l'ONG
- Fournir un accès rapide aux principales fonctionnalités
- Afficher les activités récentes

#### Données Affichées
- Nombre total de cas
- Nombre de cas actifs
- Nombre de cas résolus
- Nombre total de campagnes

#### Données Source
- `dossiers` (table Supabase)
- `campagnes` (table Supabase)
- `audit_logs` (table Supabase)

#### Fonctionnalités
✅ Statistiques en temps réel
✅ Actions rapides vers les autres pages
✅ Historique des activités récentes
✅ Vérification des permissions
✅ Gestion des états (loading/error)

---

### 2. **Cases (`/ngo/cases`)**
**Fichier:** `CasesPage.tsx`

#### Objectifs
- Gérer et suivre les cas de personnes disparues
- Rechercher et filtrer les cas par statut
- Visualiser les détails des cas

#### Données Affichées
| Colonne | Source |
|---------|--------|
| Nom et Prénom | `dossiers.nom`, `dossiers.prenom` |
| Localisation | `dossiers.localisation` |
| Date de disparition | `dossiers.date_disparition` |
| Statut | `dossiers.statut` (active/resolved/closed) |

#### Fonctionnalités
✅ Recherche par nom ou prénom
✅ Filtrage par statut (actif/résolu/fermé)
✅ Pagination (10 cas par page)
✅ Badges colorés par statut
✅ Dates formatées (FR)

#### Requête Supabase
```typescript
supabase
  .from('dossiers')
  .select('*')
  .eq('statut', statusFilter) // optionnel
  .or(`nom.ilike.%...%,prenom.ilike.%...%`) // recherche
  .order('date_creation', { ascending: false })
```

---

### 3. **Campaigns (`/ngo/campaigns`)**
**Fichier:** `CampagnesPage.tsx`

#### Objectifs
- Gérer les campagnes de sensibilisation
- Visualiser l'état et les détails de chaque campagne
- Tracker les objectifs de campagne

#### Données Affichées
| Champ | Source |
|-------|--------|
| Titre | `campagnes.titre` |
| Description | `campagnes.description` |
| Statut | `campagnes.statut` |
| Dates | `campagnes.date_debut`, `campagnes.date_fin` |
| Objectif | `campagnes.objectif` |

#### Fonctionnalités
✅ Recherche par titre ou description
✅ Filtrage par statut (active/completed/paused)
✅ Affichage en grille de cartes
✅ Dates formatées (FR)
✅ Pagination (8 campagnes par page)

#### Requête Supabase
```typescript
supabase
  .from('campagnes')
  .select('*')
  .eq('statut', statusFilter) // optionnel
  .or(`titre.ilike.%...%,description.ilike.%...%`) // recherche
  .order('date_debut', { ascending: false })
```

---

### 4. **Resources (`/ngo/resources`)**
**Fichier:** `ResourcesPage.tsx`

#### Objectifs
- Centraliser les ressources et outils pour les ONG
- Fournir accès à des documents, guides et formations
- Organiser les ressources par type

#### Données Affichées
| Champ | Source |
|-------|--------|
| Titre | `ressources_ngo.titre` |
| Type | `ressources_ngo.type` |
| Description | `ressources_ngo.description` |
| URL | `ressources_ngo.url` |
| Date de création | `ressources_ngo.date_creation` |

#### Types de Ressources
- 📄 **Document** - Fichiers PDF, Word, etc.
- 🛠️ **Tool** - Outils et applications
- 📖 **Guide** - Guides et manuels
- 🎓 **Training** - Matériel de formation

#### Fonctionnalités
✅ Recherche par titre ou description
✅ Filtrage par type de ressource
✅ Icônes thématiques par type
✅ Liens externes vers ressources
✅ Grille d'affichage (responsive)

#### Requête Supabase
```typescript
supabase
  .from('ressources_ngo')
  .select('*')
  .eq('type', typeFilter) // optionnel
  .or(`titre.ilike.%...%,description.ilike.%...%`) // recherche
  .order('date_creation', { ascending: false })
```

---

### 5. **Partnerships (`/ngo/partnerships`)**
**Fichier:** `PartnershipsPage.tsx`

#### Objectifs
- Gérer les partenariats avec d'autres organisations
- Maintenir les contacts des partenaires
- Suivre l'état des partenariats

#### Données Affichées
| Colonne | Source |
|---------|--------|
| Organisation | `partenariats_ngo.organisation_name` |
| Personne de contact | `partenariats_ngo.contact_person` |
| Email | `partenariats_ngo.email` |
| Téléphone | `partenariats_ngo.phone` |
| Statut | `partenariats_ngo.statut` |

#### Statuts Disponibles
- 🟢 **Active** - Partenariat actif
- 🔴 **Inactive** - Partenariat inactif
- 🟡 **Pending** - En attente de confirmation

#### Fonctionnalités
✅ Recherche par organisation ou contact
✅ Filtrage par statut
✅ Tableau format (lisible et compact)
✅ Codes couleur par statut
✅ Pagination (10 partenariats par page)

#### Requête Supabase
```typescript
supabase
  .from('partenariats_ngo')
  .select('*')
  .eq('statut', statusFilter) // optionnel
  .or(`organisation_name.ilike.%...%,contact_person.ilike.%...%`) // recherche
  .order('date_partnership', { ascending: false })
```

---

## 🔐 Système de Permissions

Toutes les pages vérifient les permissions avant affichage:

```typescript
// Vérification du rôle
if (!currentUser || (currentUser.role !== NomRole.ONG && currentUser.role !== 'ONG')) {
  navigate('/auth/login');
}

// Vérification des permissions
if (!hasPermission('ngo:view_dashboard')) {
  navigate('/auth/unauthorized');
}
```

### Permissions Requises
- `ngo:view_dashboard` - Dashboard
- `ngo:view_cases` - Page des cas
- `ngo:view_campaigns` - Page des campagnes
- `ngo:view_resources` - Page des ressources
- `ngo:view_partnerships` - Page des partenariats

---

## 🎨 Composants Utilisés

### Navigation
- **HeaderNGO** - En-tête avec recherche et menu utilisateur
- **SidebarNGO** - Barre latérale de navigation

### Composants Réutilisables
- `Card`, `CardBody` - Conteneurs de contenu
- `StatCard` - Cartes de statistiques
- Classe `styles` - Styling CSS Modules

### État et Chargement
- Loading spinner pendant le chargement
- Messages d'erreur centralisés
- Empty states pour aucune donnée

---

## 🌐 Internationalisation (i18n)

### Fichiers de Traduction
- **FR:** `/src/locales/fr/ngo.json`
- **EN:** `/src/locales/en/ngo.json`

### Clés Traduites
```json
{
  "ngo": {
    "dashboardTitle": "Tableau de bord ONG",
    "casesTitle": "Gestion des cas",
    "campaignsTitle": "Campagnes de sensibilisation",
    "resourcesTitle": "Ressources et outils",
    "partnershipsTitle": "Partenaires",
    // ... et plus
  }
}
```

### Utilisation
```typescript
const { t } = useI18n();

// Dans le composant
<h1>{t('ngo.dashboardTitle')}</h1>
```

---

## 📊 Flux de Données

```
┌─────────────────────────────────┐
│     Supabase Database           │
├─────────────────────────────────┤
│ • dossiers                      │
│ • campagnes                     │
│ • ressources_ngo                │
│ • partenariats_ngo              │
│ • audit_logs                    │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   React Component (Page)        │
├─────────────────────────────────┤
│ • useCallback pour async        │
│ • useState pour l'état local    │
│ • useEffect pour chargement     │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   UI Rendering                  │
├─────────────────────────────────┤
│ • Tables, Grilles, Cartes       │
│ • Recherche & Filtrage          │
│ • Pagination                    │
└─────────────────────────────────┘
```

---

## ⚡ Performance

### Optimisations Appliquées
✅ **useCallback** - Fonction de chargement mémorisée
✅ **Pagination** - Charge 8-10 éléments à la fois
✅ **Lazy Loading** - Données chargées à la demande
✅ **Error Handling** - Gestion robuste des erreurs

### Requêtes Optimisées
```typescript
// Récupère uniquement les colonnes nécessaires
.select('*')

// Filtre avant retour des données
.eq('statut', statusFilter)

// Recherche optimisée avec ilike
.or(`field.ilike.%query%`)

// Limite le nombre de résultats
.limit(1000)
```

---

## 📱 Responsive Design

Toutes les pages utilisent:
- CSS Modules pour styling
- Layout flexbox/grid
- Breakpoints responsifs
- Navigation adaptée mobile

---

## 🔄 État de Charge et Erreurs

### Loading State
```typescript
if (loading) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### Error State
```typescript
{error && (
  <div className={styles.errorMessage}>
    ⚠️ {error}
  </div>
)}
```

### Empty State
```typescript
{paginatedData.length > 0 ? (
  // Afficher les données
) : (
  <div className={styles.emptyState}>
    <p>{t('ngo.noData')}</p>
  </div>
)}
```

---

## 📅 Dates et Formats

Toutes les dates sont formatées avec la locale FR:
```typescript
new Date(timestamp).toLocaleDateString('fr-FR')
// Résultat: "18 janvier 2026"

new Date(timestamp).toLocaleString('fr-FR')
// Résultat: "18/01/2026 14:30:45"
```

---

## 🚀 Déploiement et Tests

### Vérifications Avant Déploiement
1. ✅ Tous les fichiers compilent sans erreurs
2. ✅ Permissions vérifiées pour chaque page
3. ✅ Traductions i18n complètes (FR/EN)
4. ✅ Données Supabase accessibles
5. ✅ Styling CSS appliqué correctement
6. ✅ Navigation fonctionnelle

### Routes à Configurer
```typescript
// Dans le routing
/ngo/dashboard       → NGODashboardPage
/ngo/cases           → NGOCasesPage
/ngo/campaigns       → NGOCampagnesPage
/ngo/resources       → NGOResourcesPage
/ngo/partnerships    → NGOPartnershipsPage
```

---

## 📞 Support et Maintenance

Pour toute question ou modification:
1. Vérifier les permissions Supabase
2. Tester les traductions i18n
3. Valider les styles CSS Modules
4. Vérifier la structure des composants
