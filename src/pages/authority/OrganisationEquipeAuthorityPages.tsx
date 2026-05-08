/**
 * Membres et paramètres d’organisation — silo Autorité (portail `portal="authority"` sur pages admin).
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { OrganisationUsersPage } from './OrganisationUsersPage';
import { OrganisationUserNewPage } from './OrganisationUserNewPage';
import { OrganisationUserDetailPage } from './OrganisationUserDetailPage';
import { OrganisationSettingsPage } from './OrganisationSettingsPage';

export const OrganisationEquipeListAuthorityPage: React.FC = () => (
  <AuthorityLayout>
    <OrganisationUsersPage />
  </AuthorityLayout>
);

export const OrganisationEquipeNewAuthorityPage: React.FC = () => (
  <AuthorityLayout>
    <OrganisationUserNewPage />
  </AuthorityLayout>
);

export const OrganisationEquipeDetailAuthorityPage: React.FC = () => (
  <AuthorityLayout>
    <OrganisationUserDetailPage />
  </AuthorityLayout>
);

export const OrganisationParametresAuthorityPage: React.FC = () => (
  <AuthorityLayout>
    <OrganisationSettingsPage />
  </AuthorityLayout>
);
