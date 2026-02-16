/**
 * =====================================================
 * RETROUVONSLES - NGO Alerte Detail Page
 * Détail d'une alerte (prévention / sensibilisation)
 * =====================================================
 */

import React from 'react';
import { AlerteDetailPage as AuthorityAlerteDetailPage } from '../authority/AlerteDetailPage';
import { NGOLayout } from './NGOLayout';
import { useI18n } from '../../hooks';

export const NGOAlerteDetailPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <NGOLayout>
      <AuthorityAlerteDetailPage noLayout basePath="/ngo" />
    </NGOLayout>
  );
};
