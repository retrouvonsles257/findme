/**
 * Modération photos — même périmètre fonctionnel que l’ancien écran modérateur (embarqué sous Autorité).
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { PhotosModerationPage as ModeratorPhotosModerationPage } from './moderation/PhotosModerationPage';

export interface AuthorityPhotosModerationPageProps {
  noLayout?: boolean;
}

export const PhotosModerationPage: React.FC<AuthorityPhotosModerationPageProps> = ({ noLayout = false }) => {
  const content = <ModeratorPhotosModerationPage noLayout />;
  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default PhotosModerationPage;
