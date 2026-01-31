/**
 * =====================================================
 * RETROUVONSLES - Operator Signalements En Attente Page
 * Consultation des signalements en attente de traitement
 * Note: L'opérateur peut VOIR mais ne peut PAS valider
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useAppSelector } from '../../store/hooks';
import * as signalementAPI from '../../features/signalements/services/signalementAPI';
import { OperatorLayout } from './OperatorLayout';
import { 
  AlertCircle, 
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  FileText,
  Search,
  RefreshCw,
  Info,
  X,
  User,
  Phone,
  Mail
} from 'lucide-react';
import styles from './SignalementsEnAttentePage.module.css';

interface SignalementEnAttente {
  id: string;
  description: string;
  date_observation: string | Date;
  lieu_observation?: string;
  ville_observation?: string;
  region_observation?: string;
  pays_observation?: string;
  niveau_certitude?: string;
  nom_temoin?: string;
  email_temoin?: string;
  telephone_temoin?: string;
  contexte_observation?: string;
  statut_validation: string;
  created_at: string;
  id_dossier?: string;
  numero_dossier?: string;
}

export const SignalementsEnAttentePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  
  const [signalements, setSignalements] = useState<SignalementEnAttente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSignalement, setSelectedSignalement] = useState<SignalementEnAttente | null>(null);
  const pageSize = 10;

  const fetchSignalements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signalementAPI.getSignalementsEnAttente(
        currentUser?.organisation_id || undefined,
        currentPage,
        pageSize
      );
      setSignalements(result.data as SignalementEnAttente[]);
      setTotalCount(result.total);
    } catch (err: any) {
      console.error('Error fetching signalements:', err);
      setError(err.message || 'Erreur lors du chargement des signalements');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.organisation_id, currentPage]);

  useEffect(() => {
    if (currentUser && !['operateur_saisie', 'admin_organisation'].includes(currentUser.role)) {
      navigate('/auth/login');
      return;
    }
    fetchSignalements();
  }, [currentUser, navigate, fetchSignalements]);

  // Filtrer par recherche
  const filteredSignalements = signalements.filter((sig) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sig.description?.toLowerCase().includes(query) ||
      sig.lieu_observation?.toLowerCase().includes(query) ||
      sig.ville_observation?.toLowerCase().includes(query) ||
      sig.numero_dossier?.toLowerCase().includes(query)
    );
  });

  const getCertitudeColor = (certitude?: string) => {
    switch (certitude) {
      case 'certain': return '#10b981';
      case 'tres_probable': return '#22c55e';
      case 'probable': return '#eab308';
      case 'incertain': return '#f97316';
      case 'doute': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getCertitudeLabel = (certitude?: string) => {
    const labels: Record<string, string> = {
      certain: 'Certain',
      tres_probable: 'Très probable',
      probable: 'Probable',
      incertain: 'Incertain',
      doute: 'Doute',
    };
    return labels[certitude || ''] || 'Non précisé';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <OperatorLayout title="Signalements en attente">
      <div className={styles.signalementsEnAttente}>
        {/* Info Banner */}
        <div className={styles.signalementsEnAttente__infoBanner}>
          <Info className={styles.signalementsEnAttente__infoBannerIcon} />
          <div className={styles.signalementsEnAttente__infoBannerContent}>
            <p>
              <strong>Note :</strong> En tant qu'opérateur, vous pouvez consulter les signalements 
              en attente de validation liés à votre organisation. La validation est effectuée 
              par les modérateurs (niveau 3+).
            </p>
          </div>
        </div>

        {/* Search and Refresh */}
        <div className={styles.signalementsEnAttente__controls}>
          <div className={styles.signalementsEnAttente__searchGroup}>
            <Search className={styles.signalementsEnAttente__searchIcon} size={18} />
            <input
              type="text"
              className={styles.signalementsEnAttente__searchInput}
              placeholder="Rechercher par description, lieu, numéro de dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            className={styles.signalementsEnAttente__refreshBtn}
            onClick={fetchSignalements}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? styles.signalementsEnAttente__spinning : ''} />
            Actualiser
          </button>
        </div>

        {/* Stats summary */}
        <div className={styles.signalementsEnAttente__stats}>
          <div className={styles.signalementsEnAttente__statItem}>
            <AlertCircle size={20} />
            <span>{totalCount} signalement{totalCount > 1 ? 's' : ''} en attente</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.signalementsEnAttente__errorMessage}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className={styles.signalementsEnAttente__content}>
          {isLoading ? (
            <div className={styles.signalementsEnAttente__loadingState}>
              <Loader2 className={styles.signalementsEnAttente__spinner} />
              <p>Chargement des signalements...</p>
            </div>
          ) : filteredSignalements.length > 0 ? (
            <>
              <div className={styles.signalementsEnAttente__grid}>
                {filteredSignalements.map((sig) => (
                  <div key={sig.id} className={styles.signalementsEnAttente__card}>
                    <div className={styles.signalementsEnAttente__cardHeader}>
                      <div className={styles.signalementsEnAttente__cardStatus}>
                        <Clock size={14} />
                        <span>En attente</span>
                      </div>
                      {sig.niveau_certitude && (
                        <span 
                          className={styles.signalementsEnAttente__certitudeBadge}
                          style={{ 
                            backgroundColor: `${getCertitudeColor(sig.niveau_certitude)}15`,
                            color: getCertitudeColor(sig.niveau_certitude)
                          }}
                        >
                          {getCertitudeLabel(sig.niveau_certitude)}
                        </span>
                      )}
                    </div>
                    
                    <div className={styles.signalementsEnAttente__cardBody}>
                      <p className={styles.signalementsEnAttente__description}>
                        {sig.description?.length > 150 
                          ? `${sig.description.substring(0, 150)}...` 
                          : sig.description || 'Pas de description'
                        }
                      </p>
                      
                      <div className={styles.signalementsEnAttente__meta}>
                        {(sig.lieu_observation || sig.ville_observation) && (
                          <div className={styles.signalementsEnAttente__metaItem}>
                            <MapPin size={14} />
                            <span>{sig.lieu_observation || sig.ville_observation}</span>
                          </div>
                        )}
                        
                        <div className={styles.signalementsEnAttente__metaItem}>
                          <Calendar size={14} />
                          <span>
                            {new Date(sig.date_observation).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {sig.numero_dossier && (
                          <div className={styles.signalementsEnAttente__metaItem}>
                            <FileText size={14} />
                            <span>Dossier: {sig.numero_dossier}</span>
                          </div>
                        )}
                        
                        {sig.nom_temoin && (
                          <div className={styles.signalementsEnAttente__metaItem}>
                            <MessageSquare size={14} />
                            <span>Témoin: {sig.nom_temoin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.signalementsEnAttente__cardActions}>
                      <button
                        className={styles.signalementsEnAttente__detailBtn}
                        onClick={() => setSelectedSignalement(sig)}
                      >
                        <Eye size={16} />
                        Voir détails
                      </button>
                      {sig.id_dossier && (
                        <button
                          className={styles.signalementsEnAttente__viewBtn}
                          onClick={() => navigate(`/operator/dossiers/${sig.id_dossier}`)}
                        >
                          <FileText size={16} />
                          Dossier
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.signalementsEnAttente__pagination}>
                  <button
                    className={styles.signalementsEnAttente__pageBtn}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </button>
                  <span className={styles.signalementsEnAttente__pageInfo}>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    className={styles.signalementsEnAttente__pageBtn}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.signalementsEnAttente__emptyState}>
              <AlertCircle className={styles.signalementsEnAttente__emptyIcon} />
              <p className={styles.signalementsEnAttente__emptyText}>
                {searchQuery 
                  ? 'Aucun signalement ne correspond à votre recherche'
                  : 'Aucun signalement en attente de traitement'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal de détail */}
        {selectedSignalement && (
          <div className={styles.signalementsEnAttente__modal} onClick={() => setSelectedSignalement(null)}>
            <div className={styles.signalementsEnAttente__modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.signalementsEnAttente__modalHeader}>
                <h3>Détails du signalement</h3>
                <button 
                  className={styles.signalementsEnAttente__modalClose}
                  onClick={() => setSelectedSignalement(null)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.signalementsEnAttente__modalBody}>
                {/* Statut */}
                <div className={styles.signalementsEnAttente__modalSection}>
                  <div className={styles.signalementsEnAttente__modalBadges}>
                    <span className={styles.signalementsEnAttente__modalStatusBadge}>
                      <Clock size={14} />
                      En attente de validation
                    </span>
                    {selectedSignalement.niveau_certitude && (
                      <span 
                        className={styles.signalementsEnAttente__modalCertitudeBadge}
                        style={{ 
                          backgroundColor: `${getCertitudeColor(selectedSignalement.niveau_certitude)}15`,
                          color: getCertitudeColor(selectedSignalement.niveau_certitude)
                        }}
                      >
                        {getCertitudeLabel(selectedSignalement.niveau_certitude)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                <div className={styles.signalementsEnAttente__modalSection}>
                  <h4><MessageSquare size={16} /> Description</h4>
                  <p className={styles.signalementsEnAttente__modalDescription}>
                    {selectedSignalement.description || 'Aucune description fournie'}
                  </p>
                </div>
                
                {/* Contexte */}
                {selectedSignalement.contexte_observation && (
                  <div className={styles.signalementsEnAttente__modalSection}>
                    <h4><Info size={16} /> Contexte de l'observation</h4>
                    <p>{selectedSignalement.contexte_observation}</p>
                  </div>
                )}
                
                {/* Localisation */}
                <div className={styles.signalementsEnAttente__modalSection}>
                  <h4><MapPin size={16} /> Localisation</h4>
                  <div className={styles.signalementsEnAttente__modalGrid}>
                    {selectedSignalement.lieu_observation && (
                      <div className={styles.signalementsEnAttente__modalItem}>
                        <span className={styles.signalementsEnAttente__modalLabel}>Lieu</span>
                        <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.lieu_observation}</span>
                      </div>
                    )}
                    {selectedSignalement.ville_observation && (
                      <div className={styles.signalementsEnAttente__modalItem}>
                        <span className={styles.signalementsEnAttente__modalLabel}>Ville</span>
                        <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.ville_observation}</span>
                      </div>
                    )}
                    {selectedSignalement.region_observation && (
                      <div className={styles.signalementsEnAttente__modalItem}>
                        <span className={styles.signalementsEnAttente__modalLabel}>Région</span>
                        <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.region_observation}</span>
                      </div>
                    )}
                    {selectedSignalement.pays_observation && (
                      <div className={styles.signalementsEnAttente__modalItem}>
                        <span className={styles.signalementsEnAttente__modalLabel}>Pays</span>
                        <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.pays_observation}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Date et heure */}
                <div className={styles.signalementsEnAttente__modalSection}>
                  <h4><Calendar size={16} /> Date et heure</h4>
                  <div className={styles.signalementsEnAttente__modalGrid}>
                    <div className={styles.signalementsEnAttente__modalItem}>
                      <span className={styles.signalementsEnAttente__modalLabel}>Date d'observation</span>
                      <span className={styles.signalementsEnAttente__modalValue}>
                        {new Date(selectedSignalement.date_observation).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className={styles.signalementsEnAttente__modalItem}>
                      <span className={styles.signalementsEnAttente__modalLabel}>Signalement créé le</span>
                      <span className={styles.signalementsEnAttente__modalValue}>
                        {new Date(selectedSignalement.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Témoin */}
                {(selectedSignalement.nom_temoin || selectedSignalement.email_temoin || selectedSignalement.telephone_temoin) && (
                  <div className={styles.signalementsEnAttente__modalSection}>
                    <h4><User size={16} /> Informations du témoin</h4>
                    <div className={styles.signalementsEnAttente__modalGrid}>
                      {selectedSignalement.nom_temoin && (
                        <div className={styles.signalementsEnAttente__modalItem}>
                          <span className={styles.signalementsEnAttente__modalLabel}>Nom</span>
                          <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.nom_temoin}</span>
                        </div>
                      )}
                      {selectedSignalement.telephone_temoin && (
                        <div className={styles.signalementsEnAttente__modalItem}>
                          <span className={styles.signalementsEnAttente__modalLabel}><Phone size={12} /> Téléphone</span>
                          <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.telephone_temoin}</span>
                        </div>
                      )}
                      {selectedSignalement.email_temoin && (
                        <div className={styles.signalementsEnAttente__modalItem}>
                          <span className={styles.signalementsEnAttente__modalLabel}><Mail size={12} /> Email</span>
                          <span className={styles.signalementsEnAttente__modalValue}>{selectedSignalement.email_temoin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Dossier lié */}
                {selectedSignalement.numero_dossier && (
                  <div className={styles.signalementsEnAttente__modalSection}>
                    <h4><FileText size={16} /> Dossier associé</h4>
                    <p>
                      <strong>{selectedSignalement.numero_dossier}</strong>
                    </p>
                  </div>
                )}
              </div>
              
              <div className={styles.signalementsEnAttente__modalFooter}>
                <button 
                  className={styles.signalementsEnAttente__modalCloseBtn}
                  onClick={() => setSelectedSignalement(null)}
                >
                  Fermer
                </button>
                {selectedSignalement.id_dossier && (
                  <button
                    className={styles.signalementsEnAttente__modalDossierBtn}
                    onClick={() => {
                      setSelectedSignalement(null);
                      navigate(`/operator/dossiers/${selectedSignalement.id_dossier}`);
                    }}
                  >
                    <FileText size={16} />
                    Voir le dossier
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
};

export default SignalementsEnAttentePage;
