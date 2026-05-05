/**
 * Legacy opérateur : `OperatorLayout` autour du formulaire création personne Autorité.
 */
import React from 'react';
import { OperatorLayout } from './OperatorLayout';
import { useI18n } from '../../hooks';
import { 
  CreatePersonPage as AuthorityCreatePersonPage,
  type CreatePersonPageProps,
} from '../authority/CreatePersonPage';

export const CreatePersonPage: React.FC<CreatePersonPageProps> = ({
  basePath = '/operator',
  noLayout = false,
}) => {
  const { t } = useI18n();
  const title = t('operator.createPerson') || 'Créer une fiche personne';

  if (basePath === '/operator' && !noLayout) {
    return (
      <OperatorLayout title={title}>
        <AuthorityCreatePersonPage noLayout basePath="/operator" />
      </OperatorLayout>
    );
  }

  return <AuthorityCreatePersonPage basePath={basePath} noLayout={noLayout} />;
};

export default CreatePersonPage;
