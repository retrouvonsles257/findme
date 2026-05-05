/**
 * Modération photos — même périmètre fonctionnel que l’ancien écran modérateur (embarqué sous Autorité).
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { PhotosModerationPage as ModeratorPhotosModerationPage } from '../moderator/PhotosModerationPage';

export const PhotosModerationPage: React.FC = () => (
  <AuthorityLayout>
    <ModeratorPhotosModerationPage noLayout />
  </AuthorityLayout>
);

export default PhotosModerationPage;
