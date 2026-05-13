import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NomRole } from '../../../@types/enums.types';
import { selectUser, selectUserRole } from '../../../features/auth/store/authSelectors';
import { useAppSelector } from '../../../store/hooks';
import { useSystemConfig } from '../hooks/useSystemConfig';
import './SystemMaintenanceGate.css';

interface Props {
  children: React.ReactNode;
}

export const SystemMaintenanceGate: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { config, isLoading } = useSystemConfig();
  const currentUser = useAppSelector(selectUser);
  const role = useAppSelector(selectUserRole);

  const isPlatformAdmin = role === NomRole.ADMIN_SYSTEME && !(currentUser as any)?.organisation_id;
  const isAuthRoute = location.pathname.startsWith('/auth');
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const maintenanceEnabled = config.maintenance_mode && !isLoading;
  const shouldBlock = maintenanceEnabled && !isPlatformAdmin && !isAuthRoute;

  if (shouldBlock) {
    return (
      <div className="system-maintenance">
        <div className="system-maintenance__card">
          <div className="system-maintenance__icon">
            <AlertTriangle size={34} />
          </div>
          <h1>Plateforme en maintenance</h1>
          <p>{config.maintenance_message}</p>
          <small>Les administrateurs de plateforme peuvent toujours se connecter pour terminer l’intervention.</small>
        </div>
      </div>
    );
  }

  return (
    <>
      {maintenanceEnabled && (isPlatformAdmin || isSuperAdminRoute) && (
        <div className="system-maintenance-banner" role="status">
          <ShieldCheck size={16} />
          <span>Mode maintenance actif : les utilisateurs non administrateurs sont temporairement bloqués.</span>
        </div>
      )}
      {children}
    </>
  );
};

export default SystemMaintenanceGate;
