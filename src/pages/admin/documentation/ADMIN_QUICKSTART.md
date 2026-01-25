# 🚀 Admin Organisation - Quick Start Guide

## ⚡ Démarrage Rapide

### 1. Vérifier les imports

Assurez-vous que vos imports fonctionnent:

```typescript
import { AdminOrganisationDashboardPage } from '@/pages/admin';
import { HeaderAdminOrganisation, SidebarAdminOrganisation } from '@/components/layout';
```

### 2. Configurer les routes

Dans votre fichier de routes principal (App.tsx ou routes.config.ts):

```typescript
import { adminRoutes, adminConfig } from '@/routes/adminRoutes.config';
import { NomRole } from '@/@types/enums.types';

// Ajouter une route protégée pour admin
<ProtectedRoute
  requiredRole={NomRole.ADMIN_ORGANISATION}
  routes={adminConfig.routes}
  basePath="/admin"
/>

// Ou manuellement:
<Route path="/admin/dashboard" element={<AdminOrganisationDashboardPage />} />
<Route path="/admin/dossiers" element={<AdminOrganisationDossiersPage />} />
<Route path="/admin/rapports" element={<AdminOrganisationRapportsPage />} />
<Route path="/admin/utilisateurs" element={<AdminOrganisationUsersPage />} />
<Route path="/admin/statistiques" element={<AdminOrganisationStatistiquesPage />} />
<Route path="/admin/roles" element={<AdminOrganisationRolesPage />} />
<Route path="/admin/audit-logs" element={<AdminOrganisationAuditLogsPage />} />
<Route path="/admin/parametres" element={<AdminOrganisationSettingsPage />} />
```

### 3. Ajouter les traductions

Dans `locales/en/admin.json` et `locales/fr/admin.json`, ajouter:

```json
{
  "admin": {
    "dashboard": "Dashboard",
    "dossiers": "Missing Person Files",
    "rapports": "Reports",
    "utilisateurs": "Users",
    "statistiques": "Statistics",
    "parametres": "Settings",
    "rolesManagement": "Roles & Permissions",
    "auditLogs": "Audit Logs",
    // ... (voir ADMIN_TRANSLATION_KEYS.json pour la liste complète)
  }
}
```

### 4. Tester la compilation

```bash
npm run build
# Ou
npm run tsc -- --noEmit
```

### 5. Intégrer l'API (Optionnel maintenant)

Les pages utilisent du mock data par défaut. Pour ajouter l'API:

```typescript
// Dans chaque page, remplacer loadMockData par:
const loadData = async () => {
  try {
    setLoading(true);
    const data = await dossiersService.getAll();
    setDossiers(data);
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 📋 Structure des Fichiers

```
src/
  pages/
    admin/
      ├── DashboardPage.tsx (180 lines)
      ├── DashboardPage.module.css
      ├── UsersManagementPage.tsx (250 lines)
      ├── UsersManagement.module.css
      ├── DossiersPage.tsx (220 lines)
      ├── DossiersPage.module.css
      ├── RapportsPage.tsx (200 lines)
      ├── RapportsPage.module.css
      ├── Statistiquespage.tsx (220 lines)
      ├── StatistiquesPage.module.css
      ├── OrganisationSettings.tsx (280 lines)
      ├── OrganisationSettings.module.css
      ├── RolesManagementPage.tsx (300 lines)
      ├── RolesManagement.module.css
      ├── AuditLogsPage.tsx (280 lines)
      ├── AuditLogs.module.css
      └── index.ts

  components/
    layout/
      ├── HeaderAdminOrganisation.tsx (100 lines)
      ├── HeaderAdminOrganisation.module.css
      ├── SidebarAdminOrganisation.tsx (120 lines)
      ├── SidebarAdminOrganisation.module.css
      └── index.ts (updated)

  routes/
    └── adminRoutes.config.ts (80 lines)
```

---

## 🎨 Pages Disponibles

| Page | URL | Description | Features |
|------|-----|-------------|----------|
| Dashboard | `/admin/dashboard` | Accueil admin | Stats, actions rapides, activités |
| Dossiers | `/admin/dossiers` | Gestion des dossiers | Grille, recherche, filtres |
| Rapports | `/admin/rapports` | Gestion des rapports | Tableau, approvals, filtres |
| Utilisateurs | `/admin/utilisateurs` | Gestion des utilisateurs | Tableau, recherche, avatars |
| Statistiques | `/admin/statistiques` | Analytics | Graphiques, trends, périodes |
| Rôles | `/admin/roles` | Gestion des rôles | Cartes, permissions, modal |
| Audit Logs | `/admin/audit-logs` | Logs d'activité | Timeline, filtres, stats |
| Paramètres | `/admin/parametres` | Configuration | Onglets, formulaires, zones danger |

---

## 🔑 Variables d'Environnement

Aucune nouvelle variable d'environnement requise. Les pages utilisent:
- Redux store existant
- i18n existant
- Navigation React Router existante

---

## 🧪 Tests Recommandés

### Test de Base
```bash
# Vérifier que ça compile
npm run build

# Vérifier les types
npm run tsc -- --noEmit
```

### Test de Responsive
```bash
# Ouvrir dans Chrome DevTools
# F12 > Device Mode > Toggle device toolbar
# Tester: iPhone SE, iPad, Desktop
```

### Test des Pages
1. Aller à `/admin/dashboard`
2. Cliquer sur les liens de navigation
3. Tester les filtres et recherche
4. Redimensionner la fenêtre pour responsive

### Test des Permissions
1. Logout
2. Login avec un rôle autre qu'ADMIN_ORGANISATION
3. Tenter d'accéder à `/admin/dashboard`
4. Doit rediriger vers login

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- `ADMIN_IMPLEMENTATION_COMPLETE.md` - Implémentation détaillée
- `ADMIN_IMPLEMENTATION_CHECKLIST.md` - Checklist complète
- `ADMIN_TRANSLATION_KEYS.json` - Toutes les clés i18n

---

## ✅ Checklist de Déploiement

- [ ] Routes configurées dans App.tsx
- [ ] Traductions ajoutées dans locales/
- [ ] npm run build réussit
- [ ] Pas d'erreurs TypeScript
- [ ] Pages accessibles au `/admin/`
- [ ] Responsive testé sur mobile
- [ ] Tests fonctionnels validés
- [ ] API intégrée (si nécessaire)
- [ ] Documentation utilisateur prête

---

## 🆘 Troubleshooting

### "Cannot find module '@/components/layout/Header'"
**Solution**: Vérifier que les imports dans index.ts sont à jour

### "Styles non appliqués"
**Solution**: Vérifier que les imports de CSS Modules sont corrects
```typescript
import styles from './PageName.module.css';
// Utiliser: className={styles.containerName}
```

### "Page ne s'affiche pas au /admin/dashboard"
**Solution**: Vérifier que la route est configurée dans App.tsx ou routes.config.ts

### "Traductions manquantes"
**Solution**: Ajouter les clés dans locales/en/admin.json et locales/fr/admin.json

### "Redirection vers login même en tant qu'admin"
**Solution**: Vérifier que currentUser.role === NomRole.ADMIN_ORGANISATION

---

## 💡 Pro Tips

1. **Utiliser React DevTools** pour inspecter les props et state
2. **Chrome DevTools Network** pour voir les appels API (quand intégrés)
3. **Lazy loading** des pages pour meilleure performance
4. **Mock data** permet de tester sans API
5. **CSS Modules** évitent les conflits de styles

---

**Dernier update**: 2024
**Version**: 1.0.0
**Status**: ✅ Ready to Use
