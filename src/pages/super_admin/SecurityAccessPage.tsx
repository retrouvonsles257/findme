import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle, KeyRound, Plus, RefreshCw, ShieldCheck, UserCheck, Users, XCircle } from 'lucide-react';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import styles from './SystemLogsPage.module.css';

interface SecurityMetrics {
  generated_at?: string;
  active_users?: number;
  disabled_users?: number;
  platform_admins?: number;
  organisation_admins?: number;
  authority_users?: number;
  expired_role_assignments?: number;
  roles_expiring_30d?: number;
  admin_logins_last_7d?: number;
  recent_role_changes?: number;
  access_requests_pending?: number;
  access_requests_approved_30d?: number;
  access_requests_refused_30d?: number;
  recent_role_assignments?: Array<{
    role?: string;
    beneficiaire?: string;
    beneficiaire_email?: string;
    attribue_par?: string;
    attribue_par_email?: string;
    date_attribution?: string;
    date_expiration?: string | null;
    commentaire?: string | null;
  }>;
}

interface AccessRequest {
  id: string;
  statut: 'en_attente' | 'approuvee' | 'refusee' | 'annulee';
  motif: string;
  commentaire_decision?: string | null;
  date_demande: string;
  date_decision?: string | null;
  utilisateur_cible?: { id: string; nom?: string | null; email?: string | null };
  role_demande?: { id: string; nom_role?: string; description?: string | null };
  demandeur?: { nom?: string | null; email?: string | null };
  approbateur?: { nom?: string | null; email?: string | null } | null;
}

interface SimpleUser {
  id: string;
  label: string;
}

interface SimpleRole {
  id: string;
  label: string;
}

const fmt = (value?: number) => (value ?? 0).toLocaleString('fr-FR');

export const SuperAdminSecurityAccessPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [roles, setRoles] = useState<SimpleRole[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRoleId, setTargetRoleId] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [metricsResult, requestsResult, usersResult, rolesResult] = await Promise.all([
        (supabase as any).rpc('get_security_access_metrics'),
        (supabase as any).rpc('get_sensitive_access_requests'),
        (supabase as any).from('utilisateur').select('id, nom, prenom, email').order('nom'),
        (supabase as any).from('role').select('id, nom_role, description').order('niveau_accreditation', { ascending: false }),
      ]);
      if (metricsResult.error) throw metricsResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (usersResult.error) throw usersResult.error;
      if (rolesResult.error) throw rolesResult.error;
      setMetrics(metricsResult.data || {});
      setRequests(requestsResult.data || []);
      setUsers((usersResult.data || []).map((user: any) => ({
        id: user.id,
        label: [user.prenom, user.nom].filter(Boolean).join(' ') || user.email,
      })));
      setRoles((rolesResult.data || []).map((role: any) => ({
        id: role.id,
        label: `${role.nom_role}${role.description ? ` - ${role.description}` : ''}`,
      })));
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les métriques sécurité.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccessRequest = async () => {
    if (!targetUserId || !targetRoleId || !requestReason.trim()) {
      setError('Utilisateur, rôle et motif sont obligatoires.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const { error: rpcError } = await (supabase as any).rpc('request_sensitive_access', {
        p_id_utilisateur_cible: targetUserId,
        p_id_role_demande: targetRoleId,
        p_motif: requestReason.trim(),
      });
      if (rpcError) throw rpcError;
      setTargetUserId('');
      setTargetRoleId('');
      setRequestReason('');
      setSuccess('Demande d’accès sensible créée.');
      await loadMetrics();
    } catch (err: any) {
      setError(err.message || 'Impossible de créer la demande.');
    } finally {
      setIsSaving(false);
    }
  };

  const decideRequest = async (request: AccessRequest, decision: 'approuvee' | 'refusee' | 'annulee') => {
    const commentaire = window.prompt(
      decision === 'approuvee' ? 'Commentaire/motif d’approbation :' : 'Commentaire de décision :',
      ''
    );
    if (commentaire === null) return;

    let expiration: string | null = null;
    if (decision === 'approuvee') {
      expiration = window.prompt('Date d’expiration optionnelle au format AAAA-MM-JJ (laisser vide si aucune) :', '') || null;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const { error: rpcError } = await (supabase as any).rpc('decide_sensitive_access_request', {
        p_request_id: request.id,
        p_decision: decision,
        p_commentaire: commentaire.trim() || null,
        p_date_expiration: expiration ? new Date(`${expiration}T23:59:59`).toISOString() : null,
      });
      if (rpcError) throw rpcError;
      setSuccess(`Demande ${decision.replace('_', ' ')}.`);
      await loadMetrics();
    } catch (err: any) {
      setError(err.message || 'Impossible de traiter la demande.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const rows = [
    ['Utilisateurs actifs', fmt(metrics?.active_users), 'Comptes pouvant accéder à la plateforme', Users],
    ['Utilisateurs désactivés/suspendus', fmt(metrics?.disabled_users), 'Comptes neutralisés', UserCheck],
    ['Admins plateforme', fmt(metrics?.platform_admins), 'admin_systeme sans organisation', ShieldCheck],
    ['Admins d’organisation', fmt(metrics?.organisation_admins), 'admin_systeme rattachés à une organisation', ShieldCheck],
    ['Autorités', fmt(metrics?.authority_users), 'Acteurs opérationnels habilités', Users],
    ['Rôles expirés', fmt(metrics?.expired_role_assignments), 'Attributions à revoir', CalendarClock],
    ['Rôles expirant sous 30j', fmt(metrics?.roles_expiring_30d), 'Prévenir les pertes d’accès', CalendarClock],
    ['Connexions admin 7j', fmt(metrics?.admin_logins_last_7d), 'Activité d’accès sensible', KeyRound],
    ['Changements de rôles 30j', fmt(metrics?.recent_role_changes), 'Audit des privilèges', KeyRound],
    ['Demandes sensibles en attente', fmt(metrics?.access_requests_pending), 'Workflow d’approbation', ShieldCheck],
    ['Demandes approuvées 30j', fmt(metrics?.access_requests_approved_30d), 'Accès sensibles accordés', ShieldCheck],
    ['Demandes refusées 30j', fmt(metrics?.access_requests_refused_30d), 'Accès sensibles bloqués', ShieldCheck],
  ] as const;

  const recommendations = [
    {
      label: 'Rôles expirés',
      status: (metrics?.expired_role_assignments || 0) > 0 ? 'À traiter' : 'OK',
      detail: (metrics?.expired_role_assignments || 0) > 0
        ? 'Révoquer ou renouveler les attributions expirées.'
        : 'Aucune attribution expirée détectée.',
    },
    {
      label: 'Demandes sensibles',
      status: (metrics?.access_requests_pending || 0) > 0 ? 'Décision requise' : 'OK',
      detail: (metrics?.access_requests_pending || 0) > 0
        ? 'Traiter les demandes en attente pour éviter les accès informels.'
        : 'Aucune demande sensible en attente.',
    },
    {
      label: 'Admins plateforme',
      status: (metrics?.platform_admins || 0) > 2 ? 'À auditer' : 'OK',
      detail: (metrics?.platform_admins || 0) > 2
        ? 'Limiter le nombre d’administrateurs plateforme permanents.'
        : 'Nombre d’administrateurs plateforme maîtrisé.',
    },
    {
      label: 'Connexions admin',
      status: (metrics?.admin_logins_last_7d || 0) === 0 ? 'À vérifier' : 'OK',
      detail: (metrics?.admin_logins_last_7d || 0) === 0
        ? 'Aucune connexion admin récente : vérifier la journalisation.'
        : 'Journalisation des connexions admin active.',
    },
  ];

  return (
    <SuperAdminLayout title="Sécurité & accès" activeNav="security-access">
      <div className={styles['sa-system-logs']}>
        <div className={styles['sa-system-logs__stats']}>
          <span>Vue d’audit des accès et privilèges, sans opération métier.</span>
          <button className={styles['sa-system-logs__filter-btn']} onClick={loadMetrics} disabled={isLoading}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={`${styles['sa-system-logs__error']}`} style={{ background: '#ecfdf5', color: '#166534', borderColor: '#bbf7d0' }}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles['sa-system-logs__skeletonWrap']}>
            <AdminCardsGridSkeleton cardCount={9} />
          </div>
        ) : (
          <>
            <div className={styles['sa-system-logs__table-wrapper']}>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Indicateur</th>
                    <th>Valeur</th>
                    <th>Pourquoi c’est important</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, value, description, Icon]) => (
                    <tr key={label}>
                      <td><Icon size={16} /> {label}</td>
                      <td><strong>{value}</strong></td>
                      <td>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Créer une demande d’accès sensible</h3>
              <div className={styles['sa-system-logs__filters']}>
                <div className={styles['sa-system-logs__filter-group']}>
                  <label>Utilisateur cible</label>
                  <select value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)}>
                    <option value="">Sélectionner</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['sa-system-logs__filter-group']}>
                  <label>Rôle demandé</label>
                  <select value={targetRoleId} onChange={(event) => setTargetRoleId(event.target.value)}>
                    <option value="">Sélectionner</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['sa-system-logs__filter-group']} style={{ flex: 1, minWidth: 260 }}>
                  <label>Motif obligatoire</label>
                  <input
                    type="text"
                    value={requestReason}
                    onChange={(event) => setRequestReason(event.target.value)}
                    placeholder="Pourquoi cet accès est nécessaire ?"
                    style={{ minWidth: '100%' }}
                  />
                </div>
                <button className={styles['sa-system-logs__export-btn']} onClick={createAccessRequest} disabled={isSaving}>
                  <Plus size={16} />
                  Créer la demande
                </button>
              </div>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Centre de sécurité</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Contrôle</th>
                    <th>Statut</th>
                    <th>Recommandation</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((recommendation) => (
                    <tr key={recommendation.label}>
                      <td>{recommendation.label}</td>
                      <td><span className={`${styles['sa-system-logs__badge']} ${styles[`sa-system-logs__badge--${recommendation.status === 'OK' ? 'success' : 'warning'}`]}`}>{recommendation.status}</span></td>
                      <td>{recommendation.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Demandes d’accès sensibles</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Statut</th>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Demandeur</th>
                    <th>Motif</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan={7}>Aucune demande d’accès sensible.</td></tr>
                  ) : requests.map((request) => (
                    <tr key={request.id}>
                      <td><span className={`${styles['sa-system-logs__badge']} ${styles[`sa-system-logs__badge--${request.statut === 'en_attente' ? 'warning' : request.statut === 'approuvee' ? 'success' : 'danger'}`]}`}>{request.statut}</span></td>
                      <td>{request.utilisateur_cible?.nom || request.utilisateur_cible?.email || '-'}</td>
                      <td>{request.role_demande?.nom_role || '-'}</td>
                      <td>{request.demandeur?.nom || request.demandeur?.email || '-'}</td>
                      <td>{request.motif}</td>
                      <td>{request.date_demande ? new Date(request.date_demande).toLocaleString('fr-FR') : '-'}</td>
                      <td>
                        {request.statut === 'en_attente' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className={styles['sa-system-logs__filter-btn']} onClick={() => decideRequest(request, 'approuvee')} disabled={isSaving}>
                              <CheckCircle size={14} /> Approuver
                            </button>
                            <button className={styles['sa-system-logs__filter-btn']} onClick={() => decideRequest(request, 'refusee')} disabled={isSaving}>
                              <XCircle size={14} /> Refuser
                            </button>
                          </div>
                        ) : (
                          request.commentaire_decision || '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Workflow rôles sensibles</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Étape</th>
                    <th>Statut</th>
                    <th>Objectif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Demande d’élévation</td><td>Table dédiée créée</td><td>Motif obligatoire avant attribution d’un rôle sensible</td></tr>
                  <tr><td>Décision</td><td>Statuts en_attente/approuvee/refusee/annulee</td><td>Tracer l’approbateur et son commentaire</td></tr>
                  <tr><td>Expiration automatique</td><td>Disponible via date_expiration</td><td>Limiter les privilèges dans le temps</td></tr>
                  <tr><td>Audit</td><td>Journal activité + historique des rôles</td><td>Savoir qui a donné quel rôle, quand et pourquoi</td></tr>
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Dernières attributions de rôles</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Rôle</th>
                    <th>Bénéficiaire</th>
                    <th>Attribué par</th>
                    <th>Date</th>
                    <th>Expiration</th>
                    <th>Motif/commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.recent_role_assignments || []).length === 0 ? (
                    <tr><td colSpan={6}>Aucune attribution récente trouvée.</td></tr>
                  ) : (metrics?.recent_role_assignments || []).map((assignment, index) => (
                    <tr key={`${assignment.beneficiaire_email}-${assignment.role}-${index}`}>
                      <td>{assignment.role || '-'}</td>
                      <td>{assignment.beneficiaire || assignment.beneficiaire_email || '-'}</td>
                      <td>{assignment.attribue_par || assignment.attribue_par_email || 'Système'}</td>
                      <td>{assignment.date_attribution ? new Date(assignment.date_attribution).toLocaleString('fr-FR') : '-'}</td>
                      <td>{assignment.date_expiration ? new Date(assignment.date_expiration).toLocaleDateString('fr-FR') : 'Sans expiration'}</td>
                      <td>{assignment.commentaire || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSecurityAccessPage;
