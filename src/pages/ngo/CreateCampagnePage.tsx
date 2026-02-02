import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NGOLayout } from './NGOLayout';
import { CampagneCreate } from '../../features/campagnes/components';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';

export const NGOCreateCampagnePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id as string | undefined;
  const organisationId = (currentUser as any)?.organisation_id as string | undefined;

  const onCancel = useCallback(() => {
    navigate('/ngo/campagnes');
  }, [navigate]);

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
        navigate('/ngo/campagnes');
      }
    },
    [navigate, userId],
  );

  return (
    <NGOLayout title="Créer une campagne">
      <CampagneCreate initialOrganisationId={organisationId as any} onCancel={onCancel} onSuccess={onSuccess} />
    </NGOLayout>
  );
};

