/**
 * =====================================================
 * RETROUVONSLES - NGO Create Alerte Page
 * Création d'alertes de prévention / sensibilisation (types restreints)
 * =====================================================
 */

import React from 'react';
import { CreateAlertePage as AuthorityCreateAlertePage } from '../authority/CreateAlertePage';
import { TypeAlerte } from '../../@types/enums.types';
import { NGOLayout } from './NGOLayout';
import { useI18n } from '../../hooks';

/** Types autorisés pour l'ONG : sensibilisation et mise à jour (prévention). */
const NGO_ALLOWED_ALERT_TYPES = [
  TypeAlerte.DISPARITION_STANDARD, // utilisé comme "Sensibilisation"
  TypeAlerte.MISE_A_JOUR,          // utilisé comme "Prévention"
] as const;

export const NGOCreateAlertePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <NGOLayout>
      <AuthorityCreateAlertePage
        noLayout
        basePath="/ngo"
        allowedTypes={[...NGO_ALLOWED_ALERT_TYPES]}
      />
    </NGOLayout>
  );
};
