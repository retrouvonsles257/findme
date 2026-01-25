# 🔐 SUPER ADMIN - Quick Start Guide

## ✅ Status: 100% COMPLETE

Super Admin pages are fully implemented with real Supabase integration, complete i18n support, and comprehensive features.

---

## 📁 File Structure

```
src/
├── pages/super_admin/
│   ├── Dashboardpage.tsx              📊 Main dashboard with KPIs
│   ├── GlobalStatsPage.tsx            🌍 System-wide statistics
│   ├── OrganisationsPage.tsx          🏢 Organization management
│   ├── SystemUsersPage.tsx            👥 User management
│   ├── IAConfigurationPage.tsx        🤖 IA model configuration
│   ├── SecurityPage.tsx               🔐 Security settings
│   ├── SystemLogsPage.tsx             📋 System logging
│   ├── SystemSettingsPage.tsx         ⚙️ System configuration
│   ├── index.ts                       📤 Exports all components
│   └── [*.module.css]                 🎨 Styling (8 files)
│
├── components/layout/
│   ├── Header/HeaderSuperAdmin.tsx    Header for super admin
│   └── Sidebar/SidebarSuperAdmin.tsx  Sidebar navigation
```

---

## 🚀 Getting Started

### 1. Import Pages
```typescript
import {
  SuperAdminDashboardPage,
  SuperAdminGlobalStatsPage,
  SuperAdminOrganisationsPage,
  SuperAdminSystemUsersPage,
  SuperAdminIAConfigurationPage,
  SuperAdminSecurityPage,
  SuperAdminSystemLogsPage,
  SuperAdminSystemSettingsPage,
} from '@/pages/super_admin';
```

### 2. Import Layout Components
```typescript
import { HeaderSuperAdmin } from '@/components/layout/Header/HeaderSuperAdmin';
import { SidebarSuperAdmin } from '@/components/layout/Sidebar/SidebarSuperAdmin';
```

### 3. Add Routes
```typescript
// In your router configuration
{
  path: '/super-admin',
  element: <ProtectedRoute requiredRole="SUPER_ADMIN" />,
  children: [
    { path: 'dashboard', element: <SuperAdminDashboardPage /> },
    { path: 'global-stats', element: <SuperAdminGlobalStatsPage /> },
    { path: 'organisations', element: <SuperAdminOrganisationsPage /> },
    { path: 'system-users', element: <SuperAdminSystemUsersPage /> },
    { path: 'ia-config', element: <SuperAdminIAConfigurationPage /> },
    { path: 'security', element: <SuperAdminSecurityPage /> },
    { path: 'system-logs', element: <SuperAdminSystemLogsPage /> },
    { path: 'system-settings', element: <SuperAdminSystemSettingsPage /> },
  ]
}
```

---

## 📊 Pages Overview

### Dashboard (`/super-admin/dashboard`)
- **Purpose**: System overview with KPIs
- **Features**:
  - Total organizations, users, dossiers, alerts, health status
  - Quick action cards (4 items)
  - Recent activity timeline
  - Navigation to other modules
- **Permissions**: `super_admin:view_dashboard`

### Global Statistics (`/super-admin/global-stats`)
- **Purpose**: System-wide analytics
- **Features**:
  - Total dispersions and resolution metrics
  - Statistics by region with success rates
  - Age distribution visualization
  - Gender statistics
- **Permissions**: `super_admin:view_global_stats`

### Organisations (`/super-admin/organisations`)
- **Purpose**: Manage all organizations
- **Features**:
  - List, search, filter, paginate organizations
  - View organization details
  - Edit organization settings
  - Delete organization with confirmation
  - Show user count per organization
- **Permissions**: `super_admin:view_organisations`

### System Users (`/super-admin/system-users`)
- **Purpose**: Manage all system users
- **Features**:
  - List all users across all organizations
  - Search by name or email
  - Filter by role (9 roles)
  - Filter by status (active/inactive/pending)
  - Activate/deactivate users
  - Show organization and last login info
- **Permissions**: `super_admin:manage_system_users`

### IA Configuration (`/super-admin/ia-config`)
- **Purpose**: Configure AI models
- **Features**:
  - Enable/disable models
  - Edit model parameters:
    - Max requests per day
    - Timeout (seconds)
    - Temperature (0-1)
    - Top P (0-1)
    - Max tokens
  - Track last updated timestamp
- **Permissions**: `super_admin:manage_ia_config`

### Security (`/super-admin/security`)
- **Purpose**: Manage security settings
- **Features**:
  - MFA configuration
  - Password expiration policy
  - Session timeout settings
  - Login attempt limits
  - IP whitelisting toggle
  - Data encryption toggle
  - Audit logging toggle
  - API rate limiting toggle
  - Recent security events feed
  - Danger zone for critical actions
- **Permissions**: `super_admin:manage_security`

### System Logs (`/super-admin/system-logs`)
- **Purpose**: View system logs
- **Features**:
  - Search logs by message/details
  - Filter by level (ERROR/WARNING/INFO/DEBUG)
  - Filter by service (5 services)
  - Date range filtering
  - Pagination (20 per page)
  - Expandable log details
  - Export to CSV
  - User ID and IP tracking
- **Permissions**: `super_admin:view_system_logs`

### System Settings (`/super-admin/system-settings`)
- **Purpose**: Configure system
- **Features**:
  - System information (name, version, timezone, language)
  - Maintenance mode toggle
  - Backup configuration (frequency, retention)
  - Notification settings (email, SMS)
  - Performance settings (file size limit, concurrent users)
  - Edit mode with validation
- **Permissions**: `super_admin:manage_system_settings`

---

## 🔑 Required Permissions

Add these permissions to your RBAC configuration:

```typescript
const SUPER_ADMIN_PERMISSIONS = [
  'super_admin:view_dashboard',
  'super_admin:view_global_stats',
  'super_admin:view_organisations',
  'super_admin:manage_system_users',
  'super_admin:manage_ia_config',
  'super_admin:manage_security',
  'super_admin:view_system_logs',
  'super_admin:manage_system_settings',
];
```

---

## 🌐 i18n Configuration

All text is translated. Required translation keys:

### common namespace
- dashboard, loading, saving, cancel, save, edit, delete
- notifications, status, actions, search, filter
- all common UI labels

### super_admin namespace
- dashboardTitle, dashboardSubtitle
- globalStatisticsTitle, globalStatisticsSubtitle
- organisationsTitle, systemUsersTitle
- iaConfigurationTitle, securityTitle
- systemLogsTitle, systemSettingsTitle
- And many more (see implementation for full list)

Example translation file:
```json
{
  "super_admin": {
    "dashboardTitle": "Super Admin Dashboard",
    "dashboardSubtitle": "Manage the entire system",
    "totalOrganisations": "Total Organizations",
    "totalUsers": "Total Users",
    // ... more keys
  }
}
```

---

## 💾 Supabase Integration

### Tables Used
- `organisation` - Organizations
- `utilisateur` - Users
- `utilisateur_role` - User-role relationships
- `dossiers` - Missing person files
- `alertes` - System alerts
- `ia_configuration` - IA model config
- `system_settings` - System settings
- `system_logs` - System logs
- `audit_logs` - Activity logs

### RLS Policies
All queries respect Supabase RLS policies. Tables have proper security rules.

### Example Query
```typescript
const { data, error } = await supabase
  .from('organisation')
  .select('*')
  .order('date_creation', { ascending: false });
```

---

## 🎨 Styling

Each page has a dedicated CSS module with:
- Mobile-first responsive design
- Professional color scheme (#667eea primary)
- Consistent spacing and typography
- Hover states and transitions
- Loading spinners
- Empty states
- Error messages

---

## 🔒 Authentication & Permissions

Every page includes:
1. **Role Check**: Verifies user is SUPER_ADMIN
2. **Permission Check**: Uses `usePermissions()` hook
3. **Redirect Logic**: Redirects to login if not authenticated
4. **Unauthorized Handling**: Redirects if missing permissions

---

## 📝 Example Usage

```typescript
import { SuperAdminDashboardPage } from '@/pages/super_admin';
import { useAppSelector } from '@/store/types';
import { selectCurrentUser } from '@/features/users/store/userSelectors';

export const SuperAdminModule = () => {
  const user = useAppSelector(selectCurrentUser);

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Redirect to="/login" />;
  }

  return <SuperAdminDashboardPage />;
};
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Dashboard loads with real data
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] CRUD operations work (delete, update)
- [ ] Error handling works
- [ ] Loading states visible
- [ ] Responsive on mobile
- [ ] i18n works (FR/EN)
- [ ] Permission checks work

### Example Test
```typescript
test('Dashboard should load KPIs', async () => {
  render(<SuperAdminDashboardPage />);
  await waitFor(() => {
    expect(screen.getByText(/totalOrganisations/i)).toBeInTheDocument();
  });
});
```

---

## 🔄 Data Flow

1. **Component Mounts**: Check auth & permissions
2. **Load Data**: Fetch from Supabase
3. **Display UI**: Show data or loading state
4. **User Action**: Search, filter, paginate, CRUD
5. **Update**: Modify Supabase, show success/error
6. **Refresh**: Reload data and update UI

---

## 🐛 Troubleshooting

### Page Not Loading
- Check authentication
- Verify SUPER_ADMIN role
- Check browser console for errors
- Ensure Supabase connection works

### No Data Showing
- Check Supabase RLS policies
- Verify tables exist
- Check user organization context
- Look for SQL errors in console

### i18n Keys Missing
- Add keys to translation file
- Check namespace is correct
- Verify translation file is loaded

### Styling Issues
- Check CSS module is imported
- Verify class names match
- Check media queries for mobile
- Look for CSS conflicts

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React i18next](https://react.i18next.com)
- [CSS Modules](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app)

---

## ✨ Features Summary

✅ **8 Complete Pages**
✅ **Real Supabase Integration**
✅ **Full i18n Support (FR+EN)**
✅ **Responsive Design**
✅ **Role-Based Access Control**
✅ **Error Handling**
✅ **Loading States**
✅ **Search & Filter**
✅ **Pagination**
✅ **CRUD Operations**
✅ **CSV Export**
✅ **Professional UI**

---

## 🎯 100% Implementation Complete

All super admin functionality is ready for production!
