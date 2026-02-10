/**
 * Admin Organisation - Analyse IA (héritage Autorité)
 * Réutilise IAAnalysisPage Authority avec layout Admin, données filtrées par organisation.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { IAAnalysisPage } from '../authority/IAAnalysisPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationIAPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.ia')} activeNav="ia">
      <IAAnalysisPage noLayout />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationIAPage;
