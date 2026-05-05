/**
 * Legacy opérateur (routes non montées) : `OperatorLayout` autour de la liste Autorité.
 */
import React from 'react';
import { OperatorLayout } from './OperatorLayout';
import { PersonsPage, type PersonsPageProps } from '../authority/PersonsPage';

export type OperatorPersonsPageProps = PersonsPageProps;

export const OperatorPersonsPage: React.FC<OperatorPersonsPageProps> = ({
  noLayout = false,
  basePath = '/operator',
}) => {
  if (noLayout) {
    return <PersonsPage noLayout basePath={basePath} />;
  }
  return (
    <OperatorLayout title="Personnes">
      <PersonsPage noLayout basePath="/operator" />
    </OperatorLayout>
  );
};

export default OperatorPersonsPage;
