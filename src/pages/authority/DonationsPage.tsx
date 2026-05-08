/**
 * =====================================================
 * RETROUVONSLES - Donations Page (Authority)
 * Consultation des dons et campagnes de sensibilisation
 * Données 100% réelles depuis Supabase
 * =====================================================
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  DollarSign,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Clock,
  Eye,
  Megaphone,
  BarChart3,
  Filter,
  X,
  ArrowRight,
} from 'lucide-react';
import { AuthorityLayout } from '../../components/layout';
import { supabase } from '../../config';
import { useAuth, useNotification } from '../../contexts';
import { useI18n } from '../../hooks';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import styles from './DonationsPage.module.css';

// Types basés sur le modèle de données
interface Don {
  id: string;
  montant: number;
  devise: string;
  type_don: string;
  donateur_anonyme: boolean;
  nom_donateur: string | null;
  organisation_donatrice: string | null;
  message_donateur: string | null;
  methode_paiement: string;
  statut_paiement: string;
  reference_transaction: string;
  date_don: string;
  remerciement_envoye: boolean;
}

interface CampagneSensibilisation {
  id: string;
  titre: string;
  description: string | null;
  objectif: string | null;
  type_campagne: string;
  public_cible: string | null;
  date_debut: string;
  date_fin: string | null;
  statut_campagne: string;
  nombre_personnes_touchees: number;
  nombre_interactions: number;
  budget_alloue: number | null;
  budget_depense: number | null;
  zones_geographiques: any;
  canaux_diffusion: any;
}

interface DonStats {
  totalDons: number;
  montantTotal: number;
  donsReussis: number;
  donsMoyens: number;
  donsPonctuels: number;
  donsMensuels: number;
}

interface CampagneStats {
  totalCampagnes: number;
  campagnesEnCours: number;
  campagnesTerminees: number;
  personnesAtteintes: number;
}

type TabType = 'donations' | 'campagnes' | 'statistiques';
type DonFilterType = 'all' | 'reussi' | 'en_attente' | 'echoue';
type CampagneFilterType = 'all' | 'en_cours' | 'terminee' | 'planifiee';

export const DonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { t, language } = useI18n();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('donations');
  const [donations, setDonations] = useState<Don[]>([]);
  const [campagnes, setCampagnes] = useState<CampagneSensibilisation[]>([]);
  const [donStats, setDonStats] = useState<DonStats>({
    totalDons: 0,
    montantTotal: 0,
    donsReussis: 0,
    donsMoyens: 0,
    donsPonctuels: 0,
    donsMensuels: 0,
  });
  const [campagneStats, setCampagneStats] = useState<CampagneStats>({
    totalCampagnes: 0,
    campagnesEnCours: 0,
    campagnesTerminees: 0,
    personnesAtteintes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [donFilter, setDonFilter] = useState<DonFilterType>('all');
  const [campagneFilter, setCampagneFilter] = useState<CampagneFilterType>('all');
  const [selectedCampagne, setSelectedCampagne] = useState<CampagneSensibilisation | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Charger les dons
      const { data: donsData, error: donsError } = await (supabase as any)
        .from('don')
        .select('*')
        .order('date_don', { ascending: false })
        .limit(100);

      if (donsError) {
        console.error('Erreur chargement dons:', donsError);
      } else {
        setDonations(donsData || []);

        // Calculer les stats
        const dons = donsData || [];
        const reussis = dons.filter((d: Don) => d.statut_paiement === 'reussi');
        const ponctuels = dons.filter((d: Don) => d.type_don === 'ponctuel');
        const mensuels = dons.filter((d: Don) => d.type_don === 'mensuel');

        setDonStats({
          totalDons: dons.length,
          montantTotal: reussis.reduce((sum: number, d: Don) => sum + d.montant, 0),
          donsReussis: reussis.length,
          donsMoyens: reussis.length > 0 
            ? Math.round(reussis.reduce((sum: number, d: Don) => sum + d.montant, 0) / reussis.length)
            : 0,
          donsPonctuels: ponctuels.length,
          donsMensuels: mensuels.length,
        });
      }

      // Charger les campagnes
      const { data: campagnesData, error: campagnesError } = await (supabase as any)
        .from('campagne_sensibilisation')
        .select('*')
        .order('date_debut', { ascending: false })
        .limit(50);

      if (campagnesError) {
        console.error('Erreur chargement campagnes:', campagnesError);
      } else {
        setCampagnes(campagnesData || []);

        // Calculer les stats
        const camps = campagnesData || [];
        const enCours = camps.filter((c: CampagneSensibilisation) => c.statut_campagne === 'en_cours');
        const terminees = camps.filter((c: CampagneSensibilisation) => c.statut_campagne === 'terminee');

        setCampagneStats({
          totalCampagnes: camps.length,
          campagnesEnCours: enCours.length,
          campagnesTerminees: terminees.length,
          personnesAtteintes: camps.reduce((sum: number, c: CampagneSensibilisation) => sum + (c.nombre_personnes_touchees || 0), 0),
        });
      }

      // Log consultation
      if (user?.id) {
        await (supabase as any).from('journal_activite').insert({
          type_action: 'autre',
          action_detaillee: 'Consultation page dons et campagnes',
          description: 'Consultation des dons et campagnes de sensibilisation',
          id_utilisateur: user.id,
          date_action: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      addNotification({
        title: t('authority.donations.messages.error'),
        message: t('authority.donations.messages.loadError'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, addNotification, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les donations
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (donFilter === 'all') return true;
      return d.statut_paiement === donFilter;
    });
  }, [donations, donFilter]);

  // Filtrer les campagnes
  const filteredCampagnes = useMemo(() => {
    return campagnes.filter((c) => {
      if (campagneFilter === 'all') return true;
      return c.statut_campagne === campagneFilter;
    });
  }, [campagnes, campagneFilter]);

  // Formatage montant
  const formatMontant = (montant: number, devise: string = 'XAF') => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: devise,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  // Badge de statut pour les dons
  const getDonStatusBadge = (statut: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      reussi: { label: t('authority.donations.status.success'), color: '#0284c7' },
      en_attente: { label: t('authority.donations.status.pending'), color: '#f59e0b' },
      echoue: { label: t('authority.donations.status.failed'), color: '#ef4444' },
      rembourse: { label: t('authority.donations.status.refunded'), color: '#6b7280' },
      annule: { label: t('authority.donations.status.cancelled'), color: '#9ca3af' },
    };
    return badges[statut] || { label: statut, color: '#6b7280' };
  };

  // Badge de statut pour les campagnes
  const getCampagneStatusBadge = (statut: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      en_cours: { label: t('authority.donations.campagneStatus.ongoing'), color: '#38bdf8' },
      terminee: { label: t('authority.donations.campagneStatus.completed'), color: '#0284c7' },
      planifiee: { label: t('authority.donations.campagneStatus.planned'), color: '#8b5cf6' },
      annulee: { label: t('authority.donations.campagneStatus.cancelled'), color: '#ef4444' },
    };
    return badges[statut] || { label: statut, color: '#6b7280' };
  };

  // Type de campagne
  const getCampagneTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prevention_fugue: t('authority.donations.campagneTypes.fugue'),
      securite_enfants: t('authority.donations.campagneTypes.childSafety'),
      vigilance_communautaire: t('authority.donations.campagneTypes.vigilance'),
      formation_premiers_secours: t('authority.donations.campagneTypes.firstAid'),
      sensibilisation_generale: t('authority.donations.campagneTypes.awareness'),
      collecte_fonds: t('authority.donations.campagneTypes.fundraising'),
      autre: t('authority.donations.campagneTypes.other'),
    };
    return labels[type] || type;
  };

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <Heart size={28} />
                {t('authority.donations.title')}
              </h1>
              <p className={styles.pageSubtitle}>
                {t('authority.donations.subtitle')}
              </p>
            </div>
            <button
              className={styles.refreshButton}
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? styles.spinning : ''} />
              {t('authority.donations.refresh')}
            </button>
          </div>
        </header>

        {/* CTA vers la page dédiée Faire un don (pas dans la sidebar) */}
        <div className={styles.ctaDonWrapper} style={{ marginBottom: 24 }}>
          <section className={styles.ctaDonCard}>
            <div className={styles.ctaDonContent}>
              <Heart size={32} className={styles.ctaDonIcon} />
              <div>
                <h2 className={styles.ctaDonTitle}>{t('authority.donations.makeDonation') || 'Faire un don'}</h2>
                <p className={styles.ctaDonText}>
                  {t('authority.donations.ctaDonDescription') || 'Accédez à la page de don pour soutenir Retrouvons-Les et consulter votre historique de dons.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.ctaDonButton}
              onClick={() => navigate('/authority/donations/faire-un-don')}
            >
              {t('authority.donations.goToDonate') || 'Aller à la page de don'}
              <ArrowRight size={18} />
            </button>
          </section>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'donations' ? styles.active : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            <DollarSign size={18} />
            {t('authority.donations.tabs.donations')} ({donations.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'campagnes' ? styles.active : ''}`}
            onClick={() => setActiveTab('campagnes')}
          >
            <Megaphone size={18} />
            {t('authority.donations.tabs.campaigns')} ({campagnes.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'statistiques' ? styles.active : ''}`}
            onClick={() => setActiveTab('statistiques')}
          >
            <BarChart3 size={18} />
            {t('authority.donations.tabs.statistics')}
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              <AdminCardsGridSkeleton cardCount={6} />
            </div>
          ) : (
            <>
              {/* === TAB DONATIONS === */}
              {activeTab === 'donations' && (
                <div className={styles.section}>
                  {/* Stats Cards */}
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <DollarSign size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{formatMontant(donStats.montantTotal)}</span>
                        <span className={styles.statLabel}>{t('authority.donations.stats.totalAmount')}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <CheckCircle size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{donStats.donsReussis}</span>
                        <span className={styles.statLabel}>{t('authority.donations.stats.successfulDonations')}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <TrendingUp size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{formatMontant(donStats.donsMoyens)}</span>
                        <span className={styles.statLabel}>{t('authority.donations.stats.averageDonation')}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <Users size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{donStats.donsMensuels}</span>
                        <span className={styles.statLabel}>{t('authority.donations.stats.monthlyDonors')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter */}
                  <div className={styles.filterBar}>
                    <Filter size={18} />
                    <select
                      value={donFilter}
                      onChange={(e) => setDonFilter(e.target.value as DonFilterType)}
                      className={styles.filterSelect}
                    >
                      <option value="all">{t('authority.donations.filters.all')}</option>
                      <option value="reussi">{t('authority.donations.filters.successful')}</option>
                      <option value="en_attente">{t('authority.donations.filters.pending')}</option>
                      <option value="echoue">{t('authority.donations.filters.failed')}</option>
                    </select>
                  </div>

                  {/* Donations List */}
                  <div className={styles.donationsList}>
                    {filteredDonations.length > 0 ? (
                      filteredDonations.map((don) => {
                        const statusBadge = getDonStatusBadge(don.statut_paiement);
                        return (
                          <div key={don.id} className={styles.donationCard}>
                            <div className={styles.donationMain}>
                              <div className={styles.donationAmount}>
                                {formatMontant(don.montant, don.devise)}
                              </div>
                              <div className={styles.donationInfo}>
                                <span className={styles.donorName}>
                                  {don.donateur_anonyme 
                                    ? t('authority.donations.anonymousDonor')
                                    : don.nom_donateur || don.organisation_donatrice || t('authority.donations.unknownDonor')}
                                </span>
                                <span className={styles.donationType}>
                                  {don.type_don === 'ponctuel' 
                                    ? t('authority.donations.types.oneTime')
                                    : don.type_don === 'mensuel'
                                      ? t('authority.donations.types.monthly')
                                      : don.type_don}
                                </span>
                              </div>
                            </div>
                            <div className={styles.donationMeta}>
                              <span className={styles.donationDate}>
                                <Calendar size={14} />
                                {new Date(don.date_don).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                              </span>
                              <span
                                className={styles.donationStatus}
                                style={{ backgroundColor: statusBadge.color }}
                              >
                                {statusBadge.label}
                              </span>
                            </div>
                            {don.message_donateur && (
                              <p className={styles.donationMessage}>
                                "{don.message_donateur}"
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.emptyState}>
                        <DollarSign size={48} />
                        <p>{t('authority.donations.noDonations')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB CAMPAGNES === */}
              {activeTab === 'campagnes' && (
                <div className={styles.section}>
                  {/* Stats Cards */}
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <Megaphone size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{campagneStats.totalCampagnes}</span>
                        <span className={styles.statLabel}>{t('authority.donations.campagneStats.total')}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <Clock size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{campagneStats.campagnesEnCours}</span>
                        <span className={styles.statLabel}>{t('authority.donations.campagneStats.ongoing')}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <CheckCircle size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{campagneStats.campagnesTerminees}</span>
                        <span className={styles.statLabel}>{t('authority.donations.campagneStats.completed')}</span>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <Users size={24} className={styles.statIcon} />
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{campagneStats.personnesAtteintes.toLocaleString()}</span>
                        <span className={styles.statLabel}>{t('authority.donations.campagneStats.peopleReached')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter */}
                  <div className={styles.filterBar}>
                    <Filter size={18} />
                    <select
                      value={campagneFilter}
                      onChange={(e) => setCampagneFilter(e.target.value as CampagneFilterType)}
                      className={styles.filterSelect}
                    >
                      <option value="all">{t('authority.donations.filters.all')}</option>
                      <option value="en_cours">{t('authority.donations.filters.ongoing')}</option>
                      <option value="terminee">{t('authority.donations.filters.completed')}</option>
                      <option value="planifiee">{t('authority.donations.filters.planned')}</option>
                    </select>
                  </div>

                  {/* Campagnes List */}
                  <div className={styles.campagnesList}>
                    {filteredCampagnes.length > 0 ? (
                      filteredCampagnes.map((campagne) => {
                        const statusBadge = getCampagneStatusBadge(campagne.statut_campagne);
                        return (
                          <div key={campagne.id} className={styles.campagneCard}>
                            <div className={styles.campagneHeader}>
                              <h3 className={styles.campagneTitle}>{campagne.titre}</h3>
                              <span
                                className={styles.campagneStatus}
                                style={{ backgroundColor: statusBadge.color }}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            <p className={styles.campagneDescription}>
                              {campagne.description || t('authority.donations.noDescription')}
                            </p>

                            <div className={styles.campagneMeta}>
                              <span className={styles.campagneType}>
                                <Target size={14} />
                                {getCampagneTypeLabel(campagne.type_campagne)}
                              </span>
                              <span className={styles.campagneDate}>
                                <Calendar size={14} />
                                {new Date(campagne.date_debut).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                                {campagne.date_fin && ` - ${new Date(campagne.date_fin).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}`}
                              </span>
                            </div>

                            <div className={styles.campagneStats}>
                              <div className={styles.campagneStat}>
                                <Users size={16} />
                                <span>{(campagne.nombre_personnes_touchees || 0).toLocaleString()} {t('authority.donations.peopleReached')}</span>
                              </div>
                              <div className={styles.campagneStat}>
                                <TrendingUp size={16} />
                                <span>{(campagne.nombre_interactions || 0).toLocaleString()} {t('authority.donations.interactions')}</span>
                              </div>
                              {campagne.budget_alloue && (
                                <div className={styles.campagneStat}>
                                  <DollarSign size={16} />
                                  <span>{formatMontant(campagne.budget_alloue)} {t('authority.donations.allocated')}</span>
                                </div>
                              )}
                            </div>

                            <button
                              className={styles.viewButton}
                              onClick={() => setSelectedCampagne(campagne)}
                            >
                              <Eye size={16} />
                              {t('authority.donations.viewDetails')}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.emptyState}>
                        <Megaphone size={48} />
                        <p>{t('authority.donations.noCampaigns')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB STATISTIQUES === */}
              {activeTab === 'statistiques' && (
                <div className={styles.section}>
                  <div className={styles.statsOverview}>
                    <h2>{t('authority.donations.statsOverview.title')}</h2>

                    <div className={styles.statsRow}>
                      <div className={styles.bigStatCard}>
                        <Heart size={32} className={styles.bigStatIcon} />
                        <div className={styles.bigStatContent}>
                          <span className={styles.bigStatValue}>{formatMontant(donStats.montantTotal)}</span>
                          <span className={styles.bigStatLabel}>{t('authority.donations.statsOverview.totalCollected')}</span>
                        </div>
                      </div>

                      <div className={styles.bigStatCard}>
                        <Users size={32} className={styles.bigStatIcon} />
                        <div className={styles.bigStatContent}>
                          <span className={styles.bigStatValue}>{donStats.donsReussis}</span>
                          <span className={styles.bigStatLabel}>{t('authority.donations.statsOverview.totalDonors')}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.statsBreakdown}>
                      <h3>{t('authority.donations.statsOverview.donationBreakdown')}</h3>
                      <div className={styles.breakdownGrid}>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.oneTimeDonations')}</span>
                          <span className={styles.breakdownValue}>{donStats.donsPonctuels}</span>
                        </div>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.monthlyDonations')}</span>
                          <span className={styles.breakdownValue}>{donStats.donsMensuels}</span>
                        </div>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.averageDonation')}</span>
                          <span className={styles.breakdownValue}>{formatMontant(donStats.donsMoyens)}</span>
                        </div>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.successRate')}</span>
                          <span className={styles.breakdownValue}>
                            {donations.length > 0 
                              ? `${Math.round((donStats.donsReussis / donations.length) * 100)}%`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.statsBreakdown}>
                      <h3>{t('authority.donations.statsOverview.campaignImpact')}</h3>
                      <div className={styles.breakdownGrid}>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.totalCampaigns')}</span>
                          <span className={styles.breakdownValue}>{campagneStats.totalCampagnes}</span>
                        </div>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.activeCampaigns')}</span>
                          <span className={styles.breakdownValue}>{campagneStats.campagnesEnCours}</span>
                        </div>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.totalReach')}</span>
                          <span className={styles.breakdownValue}>{campagneStats.personnesAtteintes.toLocaleString()}</span>
                        </div>
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownLabel}>{t('authority.donations.statsOverview.completedCampaigns')}</span>
                          <span className={styles.breakdownValue}>{campagneStats.campagnesTerminees}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal détail campagne */}
        {selectedCampagne && (
          <div className={styles.modalOverlay} onClick={() => setSelectedCampagne(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setSelectedCampagne(null)}>
                <X size={24} />
              </button>

              <div className={styles.modalHeader}>
                <Megaphone size={24} />
                <h2>{selectedCampagne.titre}</h2>
              </div>

              <div className={styles.modalContent}>
                <div className={styles.modalSection}>
                  <h4>{t('authority.donations.modal.description')}</h4>
                  <p>{selectedCampagne.description || t('authority.donations.noDescription')}</p>
                </div>

                {selectedCampagne.objectif && (
                  <div className={styles.modalSection}>
                    <h4>{t('authority.donations.modal.objective')}</h4>
                    <p>{selectedCampagne.objectif}</p>
                  </div>
                )}

                <div className={styles.modalGrid}>
                  <div className={styles.modalItem}>
                    <span className={styles.modalLabel}>{t('authority.donations.modal.type')}</span>
                    <span className={styles.modalValue}>{getCampagneTypeLabel(selectedCampagne.type_campagne)}</span>
                  </div>
                  <div className={styles.modalItem}>
                    <span className={styles.modalLabel}>{t('authority.donations.modal.status')}</span>
                    <span className={styles.modalValue}>{getCampagneStatusBadge(selectedCampagne.statut_campagne).label}</span>
                  </div>
                  <div className={styles.modalItem}>
                    <span className={styles.modalLabel}>{t('authority.donations.modal.startDate')}</span>
                    <span className={styles.modalValue}>
                      {new Date(selectedCampagne.date_debut).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                  {selectedCampagne.date_fin && (
                    <div className={styles.modalItem}>
                      <span className={styles.modalLabel}>{t('authority.donations.modal.endDate')}</span>
                      <span className={styles.modalValue}>
                        {new Date(selectedCampagne.date_fin).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    </div>
                  )}
                  <div className={styles.modalItem}>
                    <span className={styles.modalLabel}>{t('authority.donations.modal.reach')}</span>
                    <span className={styles.modalValue}>{(selectedCampagne.nombre_personnes_touchees || 0).toLocaleString()}</span>
                  </div>
                  <div className={styles.modalItem}>
                    <span className={styles.modalLabel}>{t('authority.donations.modal.interactions')}</span>
                    <span className={styles.modalValue}>{(selectedCampagne.nombre_interactions || 0).toLocaleString()}</span>
                  </div>
                  {selectedCampagne.budget_alloue && (
                    <div className={styles.modalItem}>
                      <span className={styles.modalLabel}>{t('authority.donations.modal.budget')}</span>
                      <span className={styles.modalValue}>{formatMontant(selectedCampagne.budget_alloue)}</span>
                    </div>
                  )}
                  {selectedCampagne.public_cible && (
                    <div className={styles.modalItem}>
                      <span className={styles.modalLabel}>{t('authority.donations.modal.targetAudience')}</span>
                      <span className={styles.modalValue}>{selectedCampagne.public_cible}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default DonationsPage;
