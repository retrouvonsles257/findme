import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NGOLayout } from './NGOLayout';
import { CampagneCreate } from '../../features/campagnes/components';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';

export interface NGOCreateCampagnePageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /ngo */
  basePath?: string;
}

export const NGOCreateCampagnePage: React.FC<NGOCreateCampagnePageProps> = ({ noLayout = false, basePath = '/ngo' }) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id as string | undefined;
  const organisationId = (currentUser as any)?.organisation_id as string | undefined;

  const onCancel = useCallback(() => {
    navigate(`${basePath}/campagnes`);
  }, [navigate, basePath]);

  const onSuccess = useCallback(
    async (campagne: any) => {
      try {
        if (userId) {
          await (supabase as any).from('journal_activite').insert({
            type_action: 'autre',
            action_detaillee: 'creation_campagne_ong',
            description: `Création campagne ONG: ${campagne?.titre || ''}`.trim(),
            id_utilisateur: userId,
            date_action: new Date().toISOString(),
          });
        }
      } catch {
        // best effort
      } finally {
        navigate(`${basePath}/campagnes`);
      }
    },
    [navigate, basePath, userId],
  );

  const pageContent = (
    <CampagneCreate initialOrganisationId={organisationId as any} onCancel={onCancel} onSuccess={onSuccess} />
  );

  if (noLayout) return pageContent;
  return (
    <NGOLayout>
      {pageContent}
    </NGOLayout>
  );
};

