/**
 * File de signalements avancée — route `/authority/file-signalements` (ex-modérateur).
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { SignalementsValidationPage } from './moderation/SignalementsValidationPage';

export interface SignalementsFileAvancePageProps {
  noLayout?: boolean;
}

export const SignalementsFileAvancePage: React.FC<SignalementsFileAvancePageProps> = ({ noLayout = false }) => {
  const content = <SignalementsValidationPage noLayout />;
  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default SignalementsFileAvancePage;
