/**
 * Legacy opérateur : `OperatorLayout` autour de la fiche personne Autorité.
 */
import React from 'react';
import { OperatorLayout } from './OperatorLayout';
import { PersonDetailPage, type PersonDetailPageProps } from '../authority/PersonDetailPage';

export type OperatorPersonDetailPageProps = PersonDetailPageProps;

export const OperatorPersonDetailPage: React.FC<OperatorPersonDetailPageProps> = ({
  noLayout = false,
  basePath = '/operator',
}) => {
  if (noLayout) {
    return <PersonDetailPage noLayout basePath={basePath} />;
  }
  return (
    <OperatorLayout title="Personne">
      <PersonDetailPage noLayout basePath="/operator" />
    </OperatorLayout>
  );
};

export default OperatorPersonDetailPage;
