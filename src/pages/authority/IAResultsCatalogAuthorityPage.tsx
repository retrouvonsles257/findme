/**
 * Catalogue paginé des résultats IA (parcours Autorité).
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { IAResultsPage } from './moderation/IAResultsPage';

export const IAResultsCatalogAuthorityPage: React.FC = () => (
  <AuthorityLayout>
    <IAResultsPage noLayout copyVariant="authority" />
  </AuthorityLayout>
);

export default IAResultsCatalogAuthorityPage;
