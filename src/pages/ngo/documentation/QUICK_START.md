# ⚡ Quick Start - Intégration NGO en 5 Minutes

Pour démarrer rapidement avec le module NGO, suivez ce guide condensé.

---

## 1️⃣ Ajouter les Routes (2 min)

### Fichier: `src/routes/AppRoutes.tsx` (ou votre fichier de routing)

```typescript
// Ajouter les imports
import {
  NGODashboardPage,
  NGOCasesPage,
  NGOCampagnesPage,
  NGOResourcesPage,
  NGOPartnershipsPage
} from '@/pages/ngo';

// Ajouter les routes dans votre configuration:
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

---

## 2️⃣ Vérifier les Tables Supabase (1 min)

```sql
-- Exécuter dans Supabase SQL Editor

-- Vérifier que ces tables existent
SELECT COUNT(*) as dossiers_count FROM dossiers;
SELECT COUNT(*) as campagnes_count FROM campagnes;
SELECT COUNT(*) as ressources_count FROM ressources_ngo;
SELECT COUNT(*) as partenaires_count FROM partenariats_ngo;
SELECT COUNT(*) as logs_count FROM audit_logs;
```

✅ Si tous retournent un nombre → Les tables existent!

---

## 3️⃣ Ajouter les Permissions (1 min)

```sql
-- Exécuter dans Supabase SQL Editor
-- Remplacer 'user_id' par l'ID réel de l'utilisateur ONG

INSERT INTO user_permissions (user_id, permission) VALUES
('user_id', 'ngo:view_dashboard'),
('user_id', 'ngo:view_cases'),
('user_id', 'ngo:view_campaigns'),
('user_id', 'ngo:view_resources'),
('user_id', 'ngo:view_partnerships')
ON CONFLICT (user_id, permission) DO NOTHING;
```

---

## 4️⃣ Tester Localement (30 sec)

```bash
# Compiler et démarrer
npm run build
npm start

# Dans le navigateur
# http://localhost:3000/ngo/dashboard

# Se connecter comme utilisateur ONG
# Vérifier que le dashboard se charge
```

---

## 5️⃣ C'est Fait! ✅

Vous avez intégré le module NGO en 5 minutes!

---

## 🎯 Checklist Minimale

- [ ] Routes ajoutées dans le router
- [ ] Tables Supabase vérifiées
- [ ] Permissions ajoutées
- [ ] npm run build réussit
- [ ] Application démarre
- [ ] Peut accéder à /ngo/dashboard en tant qu'ONG

---

## 📚 Pour Plus de Détails

| Question | Document |
|----------|----------|
| Comment fonctionne l'architecture? | [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) |
| Quelle est la structure du routage? | [ROUTING_GUIDE.md](./ROUTING_GUIDE.md) |
| Comment déployer en production? | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| Vue d'ensemble générale? | [NGO_PAGES_DOCUMENTATION.md](./NGO_PAGES_DOCUMENTATION.md) |

---

## 🆘 Problèmes Courants

### Erreur: "Cannot find module '@/pages/ngo'"

```bash
# Solution: Vérifier l'import path
# ✅ Correct: import { NGODashboardPage } from '@/pages/ngo';
# ❌ Incorrect: import NGODashboardPage from '@/pages/ngo/DashboardPage';
```

### Page blanche en accédant à /ngo/dashboard

```bash
# Solution 1: Vérifier la console du navigateur pour les erreurs
# Solution 2: Vérifier que l'utilisateur est authentifié
# Solution 3: Vérifier les permissions de l'utilisateur
# Solution 4: Vérifier que Supabase est connecté
```

### Traductions manquantes (anglais/français)

```bash
# Solution: Vérifier que i18n.config.ts a les imports NGO
# import ngoEn from './en/ngo.json';
# import ngoFr from './fr/ngo.json';
```

---

**✅ C'est tout! Vous êtes prêt à utiliser le module NGO.**

Pour des questions plus détaillées, consultez les guides de documentation dans `/src/pages/ngo/documentation/`
