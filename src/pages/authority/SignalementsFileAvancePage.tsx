/**
 * File de signalements avancée — route `/authority/file-signalements` (ex-modérateur).
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { SignalementsValidationPage } from '../moderator/SignalementsValidationPage';

export const SignalementsFileAvancePage: React.FC = () => (
  <AuthorityLayout>
    <SignalementsValidationPage noLayout />
  </AuthorityLayout>
);

export default SignalementsFileAvancePage;
