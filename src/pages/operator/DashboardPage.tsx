/**
 * =====================================================
 * RETROUVONSLES - Operator Dashboard Page
 * Tableau de bord pour les opérateurs de saisie
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../hooks';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { OperatorLayout } from './OperatorLayout';
import { 
  FolderPlus, 
  FolderOpen, 
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  UserPlus,
  AlertCircle,
  Image
} from 'lucide-react';
import { AdminListSkeleton } from '../admin/skeletons';
import styles from './DashboardPage.module.css';

export const OperatorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossiers, isLoading, fetchDossiers, setPageSize } = useDossiers();

  useEffect(() => {
    if (currentUser && currentUser.role !== NomRole.AUTORITE && currentUser.role !== NomRole.ADMIN_SYSTEME) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser?.id) return;
    // Dashboard: on veut uniquement "mes dossiers"
    setPageSize(100);
    fetchDossiers({ createur_id: currentUser.id });
  }, [currentUser?.id, fetchDossiers, setPageSize]);

  const myDossiers = dossiers.filter(
    (d: any) => d.id_utilisateur_createur === currentUser?.id || d.enregistre_par === currentUser?.id
  );

  const stats = {
    dossiers_total: myDossiers.length,
    dossiers_en_cours: myDossiers.filter((d: any) => d.statut_dossier === 'en_cours').length,
    dossiers_retrouves: myDossiers.filter((d: any) => d.statut_dossier.includes('retrouve')).length,
  };

  const recentDossiers = [...myDossiers].sort((a: any, b: any) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  }).slice(0, 5);

  const quickActions = [
    {
      title: t('operator.createDossier') || 'Créer un dossier',
      description: t('operator.createDossierDesc') || 'Créer un nouveau dossier de disparition',
      icon: FolderPlus,
      action: () => navigate('/operator/create-dossier'),
      color: '#1d4ed8'
    },
    {
      title: t('operator.createPerson') || 'Créer une personne',
      description: t('operator.createPersonDesc') || 'Enregistrer une fiche de personne détaillée',
      icon: UserPlus,
      action: () => navigate('/operator/create-person'),
      color: '#8b5cf6'
    },
    {
      title: t('operator.myDossiers') || 'Mes dossiers',
      description: t('operator.myDossiersDesc') || 'Consulter et gérer vos dossiers',
      icon: FolderOpen,
      action: () => navigate('/operator/my-dossiers'),
      color: '#10b981'
    },
    {
      title: 'Signalements en attente',
      description: 'Consulter les signalements en attente de validation',
      icon: AlertCircle,
      action: () => navigate('/operator/signalements-en-attente'),
      color: '#f59e0b'
    },
    {
      title: 'Photos en attente',
      description: 'Consulter les photos non approuvées',
      icon: Image,
      action: () => navigate('/operator/photos-en-attente'),
      color: '#ec4899'
    }
  ];

  return (
    <OperatorLayout title={t('operator.dashboardTitle')}>
      <div className={styles['operator-dashboard']}>
        {/* Statistics Cards */}
        <div className={styles['operator-dashboard__stats-grid']}>
          <div className={styles['operator-dashboard__stat-card']}>
            <div className={styles['operator-dashboard__stat-header']}>
              <div className={styles['operator-dashboard__stat-icon']} style={{ backgroundColor: 'rgba(29, 78, 216, 0.1)', color: '#1d4ed8' }}>
                <FileText size={24} />
              </div>
              <div className={styles['operator-dashboard__stat-content']}>
                <h3 className={styles['operator-dashboard__stat-value']}>{stats.dossiers_total}</h3>
                <p className={styles['operator-dashboard__stat-label']}>{t('operator.totalDossiers')}</p>
              </div>
            </div>
          </div>

          <div className={styles['operator-dashboard__stat-card']}>
            <div className={styles['operator-dashboard__stat-header']}>
              <div className={styles['operator-dashboard__stat-icon']} style={{ backgroundColor: '#fef3c7', color: '#ea580c' }}>
                <Clock size={24} />
              </div>
              <div className={styles['operator-dashboard__stat-content']}>
                <h3 className={styles['operator-dashboard__stat-value']}>{stats.dossiers_en_cours}</h3>
                <p className={styles['operator-dashboard__stat-label']}>{t('operator.inProgress')}</p>
              </div>
            </div>
          </div>

          <div className={styles['operator-dashboard__stat-card']}>
            <div className={styles['operator-dashboard__stat-header']}>
              <div className={styles['operator-dashboard__stat-icon']} style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles['operator-dashboard__stat-content']}>
                <h3 className={styles['operator-dashboard__stat-value']}>{stats.dossiers_retrouves}</h3>
                <p className={styles['operator-dashboard__stat-label']}>{t('operator.found')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles['operator-dashboard__section']}>
          <h2 className={styles['operator-dashboard__section-title']}>{t('operator.quickActions')}</h2>
          <div className={styles['operator-dashboard__actions-grid']}>
            {quickActions.map((action, idx) => {
              const IconComponent = action.icon;
              const isPrimary = idx === 0;
              return (
                <div
                  key={idx}
                  className={`${styles['operator-dashboard__action-card']} ${isPrimary ? styles['operator-dashboard__action-card--primary'] : ''}`}
                  onClick={action.action}
                  onKeyDown={(e) => e.key === 'Enter' && action.action()}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={styles['operator-dashboard__action-icon']}
                    style={isPrimary ? undefined : { backgroundColor: `${action.color}15`, color: action.color }}
                  >
                    <IconComponent size={24} />
                  </div>
                  <div className={styles['operator-dashboard__action-content']}>
                    <h3 className={styles['operator-dashboard__action-title']}>{action.title}</h3>
                    <p className={styles['operator-dashboard__action-description']}>{action.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      {/* Recent Dossiers */}
        <div className={styles['operator-dashboard__section']}>
        <h2 className={styles['operator-dashboard__section-title']}>{t('operator.recentDossiers')}</h2>
        {isLoading ? (
          <div className={styles['operator-dashboard__skeletonWrap']}>
            <AdminListSkeleton cardCount={5} showFilters={false} />
          </div>
        ) : recentDossiers.length > 0 ? (
          <div className={styles['operator-dashboard__dossiers-grid']}>
            {recentDossiers.map((dossier: any) => (
              <div
                key={dossier.id}
                className={styles['operator-dashboard__dossier-card']}
                onClick={() => navigate(`/operator/dossiers/${dossier.id}`)}
              >
                <div className={styles['operator-dashboard__dossier-header']}>
                  <h3 className={styles['operator-dashboard__dossier-title']}>{dossier.numero_dossier}</h3>
                  <span
                    className={`${styles['operator-dashboard__status-badge']} ${
                      dossier.statut_dossier === 'en_cours'
                        ? styles['operator-dashboard__status-badge--encours']
                        : dossier.statut_dossier.includes('retrouve')
                          ? styles['operator-dashboard__status-badge--retrouve']
                          : styles['operator-dashboard__status-badge--other']
                    }`}
                  >
                    {dossier.statut_dossier === 'en_cours' && <Clock size={12} />}
                    {dossier.statut_dossier.includes('retrouve') && <CheckCircle2 size={12} />}
                    <span>{dossier.statut_dossier}</span>
                  </span>
                </div>
                <div className={styles['operator-dashboard__dossier-meta']}>
                  <div className={styles['operator-dashboard__dossier-meta-item']}>
                    <Calendar size={14} />
                    <span>{t('operator.created')}: {new Date(dossier.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className={styles['operator-dashboard__dossier-meta-item']}>
                    <span className={styles['operator-dashboard__urgence-label']}>
                      {t('operator.urgency')}: <strong>{dossier.niveau_urgence}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles['operator-dashboard__empty-state']}>
            <FolderOpen className={styles['operator-dashboard__empty-icon']} />
            <p className={styles['operator-dashboard__empty-text']}>
              {t('operator.noDossiers')}
            </p>
          </div>
        )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default OperatorDashboardPage;