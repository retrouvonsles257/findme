# PUBLIC MODULE - RETROUVONSLES

Documentation complète du module public (pages accessibles sans authentification)

## Vue d'ensemble

Le module public contient 10 pages principales accessibles à tous les utilisateurs sans authentification:

### Pages Principales

#### 1. **HomePage** (`HomePage.tsx`)
- Page d'accueil de la plateforme
- **Sections:**
  - Barre de navigation sticky avec logo, liens et bouton login
  - Section héro avec image background (unity.png)
  - Statistiques en temps réel (cases, signalements, avis, photos)
  - Section "Une synergie au service de l'humain" (3 colonnes)
  - Carte interactive (CTA)
  - Témoignages dynamiques de cas résolvés
  - Partenaires (5 logos)
  - Appel à l'action (don, bénévolat)
  - Footer (4 colonnes + infos légales)
  
- **Données Supabase:**
  - `dossiers.select(count)` - Total des cas
  - `signalements.select(count)` - Total signalements
  - `avis.select(count)` - Total des avis
  - `dossiers.select(photo_url).select(count)` - Total photos
  - `dossiers.select('*').eq('statut', 'resolved').limit(3)` - Témoignages
  
- **Styling:** `HomePage.module.css` (500+ lignes, responsive)

#### 2. **SearchPage** (`SearchPage.tsx`)
- Page de recherche avancée
- **Filtres:**
  - Recherche par nom/prénom (server-side ilike)
  - Recherche par localisation (server-side ilike)
  - Filtre par statut (active/resolved/closed)
  
- **Pagination:** 12 items par page
- **Affichage:** Cards avec photo, nom, localisation, description, bouton détails
- **Données Supabase:** `dossiers.select('*')` avec filtres conditionnels
- **Styling:** `SearchPage.module.css` (responsive)

#### 3. **DisparitionsPage** (`DisparitionsPage.tsx`)
- Liste complète des personnes disparues
- **Filtres:** Status, âge (min/max), localisation
- **Pagination:** 12 items par page
- **Affichage:** Grid cards avec photo, détails
- **Données Supabase:** `dossiers.select('*')` avec tous les filtres
- **Styling:** `DisparitionsPage.module.css` (responsive)

#### 4. **MapPage** (`MapPage.tsx`)
- Visualization des cas sur une carte
- **Sidebar:** Liste des cas avec filtrage par statut
- **Interaction:** Sélectionner un cas pour voir les détails
- **Placeholder:** Prêt pour intégration Leaflet/Mapbox
- **Données Supabase:** `dossiers.select('*')` avec filtres optionnels
- **Styling:** `MapPage.module.css` (grid layout responsive)

#### 5. **AboutPage** (`AboutPage.tsx`)
- Informations sur la plateforme
- **Sections:**
  - Mission, Vision, Valeurs
  - Processus en 4 étapes
  - Équipe et partenaires
  - Appel à l'action (don, bénévolat)

- **Styling:** `AboutPage.module.css` (responsive grid)

#### 6. **ContactPage** (`ContactPage.tsx`)
- Formulaire de contact et informations
- **Formulaire:**
  - Nom, Email, Téléphone, Sujet, Message
  - Sauvegarde dans table `contacts` de Supabase
  - Messages de succès/erreur

- **Informations:**
  - Email, téléphone, adresse
  - Liens réseaux sociaux
  - Numéros d'urgence

- **Styling:** `ContactPage.module.css` (2 colonnes responsive)

#### 7. **DonatePage** (`DonatePage.tsx`)
- Page de donations
- **Sections:**
  - Sélection montant (4 packages + montant personnalisé)
  - Type donation (une fois ou mensuel)
  - Avantages de donner
  - FAQ

- **Bénéfices affichés:** Impact immédiat, Sécurité, Transparence, Certifications
- **Styling:** `DonatePage.module.css` (responsive grid)

#### 8. **HowItWorksPage** (`HowItWorksPage.tsx`)
- Explique le fonctionnement de la plateforme
- **Sections:**
  - Processus en 4 étapes
  - 6 fonctionnalités principales
  - 4 technologies utilisées (IA, temps réel, blockchain, géolocalisation)
  - Statistiques (98% succès, 24/7, 50+ partenaires, 10k+ utilisateurs)

- **Styling:** `HowItWorksPage.module.css` (responsive grid)

#### 9. **PreventingPage** (`PreventingPage.tsx`)
- Conseils de prévention et bonnes pratiques
- **Sections:**
  - 6 conseils pratiques (éducation, communication, planification, enfants, identification, support médical)
  - Signes d'alerte (4)
  - Plan d'action (4 étapes)
  - Ressources utiles (numéros d'urgence, hôpitaux, aide juridique)

- **Styling:** `PreventingPage.module.css` (responsive grid)

#### 10. **DossierDetailPage** (`DossierDetailPage.tsx`)
- Vue détaillée d'un cas individuel
- **Onglets:**
  - Détails (informations complètes)
  - Signalements (avec localisation et date)
  - Avis (observations communautaires)

- **Sections:**
  - Photo du cas
  - Informations de base (nom, âge, localisation, dates)
  - Description complète
  - Boutons (signaler un indice, partager)
  - Listes dynamiques depuis Supabase

- **Données Supabase:**
  - `dossiers.select('*').eq('id', id)` - Dossier principal
  - `signalements.select('*').eq('dossier_id', id)` - Signalements liés
  - `avis.select('*').eq('dossier_id', id)` - Avis liés

- **Styling:** `DossierDetailPage.module.css` (responsive layout)

## Architecture

### Structure des fichiers

```
src/pages/public/
├── HomePage.tsx
├── HomePage.module.css
├── SearchPage.tsx
├── SearchPage.module.css
├── DisparitionsPage.tsx
├── DisparitionsPage.module.css
├── MapPage.tsx
├── MapPage.module.css
├── AboutPage.tsx
├── AboutPage.module.css
├── ContactPage.tsx
├── ContactPage.module.css
├── DonatePage.tsx
├── DonatePage.module.css
├── HowItWorksPage.tsx
├── HowItWorksPage.module.css
├── PreventingPage.tsx
├── PreventingPage.module.css
├── DossierDetailPage.tsx
├── DossierDetailPage.module.css
└── index.ts (exports)
```

### Traductions i18n

**Fichiers de traduction:**
- `src/locales/fr/public.json` - Traductions françaises (400+ clés)
- `src/locales/en/public.json` - Traductions anglaises (400+ clés)

**Namespaces utilisés:**
- `public` - Toutes les traductions des pages publiques

**Clés principales:**
- `home.*` - HomePage
- `search.*` - SearchPage
- `disparitions.*` - DisparitionsPage
- `map.*` - MapPage
- `about.*` - AboutPage
- `contact.*` - ContactPage
- `donate.*` - DonatePage
- `how_it_works.*` - HowItWorksPage
- `preventing.*` - PreventingPage
- `detail.*` - DossierDetailPage

## Patterns et Conventions

### 1. Gestion des données Supabase

**Pattern utilisé:** `useCallback` + `useEffect`

```typescript
const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    let query = supabase.from('table').select('*');
    
    // Filtres conditionnels
    if (filter) query = query.eq('field', value);
    if (search) query = query.ilike('field', `%${search}%`);
    
    // Tri
    query = query.order('field', { ascending: false });

    const { data, error: err } = await query;
    
    if (err) throw err;
    setData(data);
  } catch (err) {
    console.error('Error:', err);
    setError(t('errors.loading'));
  } finally {
    setLoading(false);
  }
}, [dependencies]);

useEffect(() => { loadData(); }, [loadData]);
```

### 2. Recherche et filtrage (côté serveur)

```typescript
// Recherche avec ilike (case-insensitive like)
query = query.ilike('nom', `%${search}%`);

// Filtrage avec eq
query = query.eq('statut', 'active');

// Combinaison avec OR
query = query.or(`field1.ilike.%${search}%,field2.ilike.%${search}%`);
```

### 3. Pagination (côté client)

```typescript
const itemsPerPage = 12;
const totalPages = Math.ceil(data.length / itemsPerPage);
const startIdx = (currentPage - 1) * itemsPerPage;
const paginatedData = data.slice(startIdx, startIdx + itemsPerPage);
```

### 4. Gestion d'état

```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const [filters, setFilters] = useState<FilterState>({...});
```

### 5. Styling avec CSS Modules

- Variables de couleur cohérentes
- Responsive design avec media queries (1024px, 768px, 480px)
- Transitions et hover effects
- Gradients pour les boutons
- Box-shadow pour la profondeur

## Données Supabase utilisées

### Tables
1. **dossiers** - Cas principaux (nom, prenom, age, description, localisation, photo_url, statut, date_creation, date_disparition)
2. **signalements** - Rapports de signalements (description, localisation, date_signalement, dossier_id)
3. **avis** - Observations communautaires (contenu, date_avis, dossier_id)
4. **contacts** - Messages de contact (nom, email, telephone, sujet, message, date_creation, statut)

### Opérations Supabase
- **SELECT:** Lectures de données
- **WHERE/EQ:** Filtrage par statut, ID
- **ILIKE:** Recherche texte case-insensitive
- **ORDER:** Tri par date/champ
- **LIMIT:** Limitation des résultats
- **COUNT:** Comptage des enregistrements
- **INSERT:** Sauvegarde des messages de contact

## Fonctionnalités avancées

### 1. Statistiques en temps réel (HomePage)
```typescript
const queries = [
  supabase.from('dossiers').select('count', { count: 'exact' }),
  supabase.from('signalements').select('count', { count: 'exact' }),
  supabase.from('avis').select('count', { count: 'exact' }),
  supabase.from('dossiers').select('photo_url').not('photo_url', 'is', null),
];

const [results] = await Promise.all(queries);
```

### 2. Témoignages dynamiques
```typescript
const { data: testimonies } = await supabase
  .from('dossiers')
  .select('nom, prenom, description, photo_url')
  .eq('statut', 'resolved')
  .limit(3);
```

### 3. Recherche multi-critères
```typescript
let query = supabase.from('dossiers').select('*');

// Filtres chaînables
if (statusFilter) query = query.eq('statut', statusFilter);
if (location) query = query.ilike('localisation', `%${location}%`);
if (search) query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%`);

const { data } = await query.order('date_creation', { ascending: false });
```

## Localisation (i18n)

### Configuration
- Supporté: Français (fr) et Anglais (en)
- Défaut: Anglais
- Détection: localStorage → navigateur → HTML
- Namespace: `public`

### Utilisation
```typescript
const { t } = useTranslation();

// Utilisation simple
<h1>{t('home.title')}</h1>

// Avec interpolation
<p>{t('disparitions.results_count', { count: 441 })}</p>
```

### Structure des clés
```json
{
  "home": {
    "title": "Ensemble, Retrouvons-les",
    "subtitle": "..."
  },
  "status": {
    "active": "Recherchée",
    "resolved": "Retrouvée"
  }
}
```

## Gestion d'erreurs et loading

### États de chargement
1. **Loading state** - Spinner avec message
2. **Error state** - Message d'erreur user-friendly
3. **Empty state** - Pas de résultats avec message
4. **Success state** - Données affichées

### Exemple
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (data.length === 0) return <EmptyState />;
return <DataDisplay data={data} />;
```

## Responsive Design

### Breakpoints
- **1024px** - Tablettes et grands écrans
- **768px** - Tablettes et petits écrans
- **480px** - Téléphones

### Approche mobile-first
- Base: design mobile
- `@media (min-width: 768px)` - Adaptations tablette
- `@media (min-width: 1024px)` - Adaptations desktop

## Sécurité et Bonnes pratiques

1. **Validation** - Vérification des inputs utilisateur
2. **Sanitization** - Pas d'injection XSS
3. **RLS** - Row Level Security sur Supabase
4. **Erreurs** - Messages génériques pour l'utilisateur
5. **Logging** - Console.error pour développeurs
6. **Timeouts** - Gestion des requêtes longues

## Performance

1. **Pagination** - Évite le surcharge de DOM
2. **Lazy loading** - Images chargées à la demande
3. **Memoization** - useCallback pour éviter rerenders inutiles
4. **Queries optimisées** - Sélection des colonnes nécessaires
5. **CSS Modules** - Pas de styles globaux conflictuels

## Maintenance et Extensibilité

### Ajouter une nouvelle page

1. **Créer le fichier TSX**
```bash
touch src/pages/public/NewPage.tsx
```

2. **Créer le fichier CSS**
```bash
touch src/pages/public/NewPage.module.css
```

3. **Ajouter les traductions**
```json
// src/locales/fr/public.json
{
  "new_page": {
    "title": "Titre",
    ...
  }
}
```

4. **Exporter dans index.ts**
```typescript
export { default as NewPage } from './NewPage';
```

5. **Ajouter la route dans le router**
```typescript
import { NewPage } from '@/pages/public';

<Route path="/new-page" element={<NewPage />} />
```

### Modifier une page existante

1. Éditer le fichier `.tsx`
2. Éditer les styles `.module.css`
3. Mettre à jour les traductions dans `public.json`
4. Tester les fonctionnalités
5. Vérifier la responsivité

## Tests

### Checklist de test

- [ ] Recherche fonctionne correctement
- [ ] Filtres fonctionnent
- [ ] Pagination fonctionne
- [ ] Données Supabase sont chargées
- [ ] Images s'affichent
- [ ] Responsivité OK (mobile, tablette, desktop)
- [ ] Traductions français/anglais OK
- [ ] Boutons CTA fonctionnent
- [ ] Formulaires soumettent les données
- [ ] Messages d'erreur s'affichent
- [ ] Pas d'erreurs console

## Déploiement

### Build
```bash
npm run build
```

### Vérifications pré-déploiement
```bash
# TypeScript check
npm run type-check

# Build check
npm run build

# Eslint
npm run lint
```

### Variables d'environnement nécessaires
```
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
```

## Support et contact

Pour toute question ou problème:
- Email: contact@retrouvonsles.org
- Téléphone: +237 600 000 000
- Adresse: Yaoundé, Cameroon

---

**Dernière mise à jour:** 2024
**Module:** Public Pages v1.0
**Statut:** Production Ready ✅
