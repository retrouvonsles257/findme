/**
 * =====================================================
 * RETROUVONSLES - Coordination Page
 * Coordination inter-agences et partage d'informations
 * Données 100% réelles depuis Supabase
 * =====================================================
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { FolderOpen, MapPin, Calendar, RefreshCw, Send, MessageSquare, Package, Share2, History, User, Phone, Eye, Plus } from 'lucide-react';
import { 
  useCoordinationMessages,
  useCoordinationResources,
  useCoordinationHistory,
  useSharedDossiers,
} from '../../features/coordination';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useNotification, useAuth } from '../../contexts';
import { useI18n } from '../../hooks';
import styles from './CoordinationPage.module.css';

type CoordinationTab = 'messages' | 'ressources' | 'partages' | 'historique';

export const CoordinationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<CoordinationTab>('messages');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks réels avec Supabase
  const { messages, loading: messagesLoading, error: messagesError, sendMessage } = useCoordinationMessages();
  const { resources, requests, loading: resourcesLoading, error: resourcesError, requestResource } = useCoordinationResources();
  const { history, loading: historyLoading, error: historyError, fetchHistory } = useCoordinationHistory();
  const { sharedDossiers, loading: sharedLoading, shareDossier } = useSharedDossiers();
  const { dossiers } = useDossiers();

  // États modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestType, setRequestType] = useState('agents');

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDossierToShare, setSelectedDossierToShare] = useState('');
  const [shareOrganisations, setShareOrganisations] = useState<string[]>([]);

  // Scroll vers le bas automatiquement
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (activeTab === 'messages' && !messagesLoading) {
      scrollToBottom();
    }
  }, [messages, messagesLoading, activeTab, scrollToBottom]);

  // Envoyer un message
  const handleSendMessage = useCallback(async () => {
    if (messageText.trim()) {
      try {
        await sendMessage(messageText);
        setMessageText('');
        addNotification({
          title: 'Message envoyé',
          message: 'Votre message a été diffusé',
          type: 'success',
        });
        setTimeout(scrollToBottom, 100);
      } catch (err: any) {
        addNotification({
          title: 'Erreur',
          message: err.message || 'Erreur lors de l\'envoi',
          type: 'error',
        });
      }
    }
  }, [messageText, sendMessage, addNotification, scrollToBottom]);

  // Demander une ressource
  const handleRequestResource = useCallback(async () => {
    if (!selectedResource) return;

    try {
      await requestResource(selectedResource.id, requestType, requestQuantity);
      addNotification({
        title: 'Demande envoyée',
        message: `Demande de ${requestQuantity} ${requestType} envoyée à ${selectedResource.nom_organisation}`,
        type: 'success',
      });
      setShowRequestModal(false);
      setSelectedResource(null);
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la demande',
        type: 'error',
      });
    }
  }, [selectedResource, requestType, requestQuantity, requestResource, addNotification]);

  // Partager un dossier
  const handleShareDossier = useCallback(async () => {
    if (!selectedDossierToShare || shareOrganisations.length === 0) {
      addNotification({
        title: 'Erreur',
        message: 'Sélectionnez un dossier et au moins une organisation',
        type: 'error',
      });
      return;
    }

    try {
      await shareDossier(selectedDossierToShare, shareOrganisations, 'lecture');
      addNotification({
        title: 'Dossier partagé',
        message: `Dossier partagé avec ${shareOrganisations.length} organisation(s)`,
        type: 'success',
      });
      setShowShareModal(false);
      setSelectedDossierToShare('');
      setShareOrganisations([]);
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors du partage',
        type: 'error',
      });
    }
  }, [selectedDossierToShare, shareOrganisations, shareDossier, addNotification]);

  // Ouvrir modal de demande de ressource
  const openRequestModal = (resource: any) => {
    setSelectedResource(resource);
    setRequestQuantity(1);
    setRequestType('agents');
    setShowRequestModal(true);
  };

  // Toggle organisation dans le partage
  const toggleShareOrganisation = (org: string) => {
    setShareOrganisations(prev => 
      prev.includes(org) 
        ? prev.filter(o => o !== org)
        : [...prev, org]
    );
  };

  // Obtenir l'icône selon le type d'historique
  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'partage': return '🔗';
      case 'message': return '💬';
      case 'ressource': return '📦';
      case 'alerte': return '📢';
      case 'modification': return '✏️';
      default: return '📋';
    }
  };

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Coordination Inter-Agences</h1>
          <p className={styles.subtitle}>{t('authority.coordination.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['messages', 'ressources', 'partages', 'historique'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'messages' && (
                <>
                  <MessageSquare size={16} />
                  {t('authority.coordination.tabs.messages')} ({messages.length})
                </>
              )}
              {tab === 'ressources' && (
                <>
                  <Package size={16} />
                  {t('authority.coordination.tabs.resources')} ({resources.length})
                </>
              )}
              {tab === 'partages' && (
                <>
                  <Share2 size={16} />
                  {t('authority.coordination.tabs.shares')} ({sharedDossiers.length})
                </>
              )}
              {tab === 'historique' && (
                <>
                  <History size={16} />
                  {t('authority.coordination.tabs.history')} ({history.length})
                </>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* === MESSAGES TAB === */}
          {activeTab === 'messages' && (
            <div className={styles.section}>
              <h2>{t('authority.coordination.messages.title')}</h2>

              {messagesError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  border: '1px solid #ef5350'
                }}>
                  <strong>Erreur:</strong> {messagesError}
                </div>
              )}

              <div className={styles.messagesList}>
                {messagesLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    {t('authority.coordination.messages.loading')}
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwnMessage = user?.id === msg.author_id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`${styles.messageWrapper} ${isOwnMessage ? styles.messageOwn : styles.messageOther}`}
                      >
                        <div className={styles.messageBubble}>
                          {!isOwnMessage && (
                            <div className={styles.messageAuthor}>
                              <strong>{msg.author}</strong>
                              {msg.organisation && (
                                <span className={styles.messageOrg}>{msg.organisation}</span>
                              )}
                            </div>
                          )}
                          <div className={styles.messageContent}>
                            <p className={styles.messageText}>{msg.text}</p>
                            {msg.dossier_id && (
                              <button 
                                className={styles.dossierLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/authority/dossiers/${msg.dossier_id}`);
                                }}
                              >
                                <FolderOpen size={14} /> {t('authority.coordination.messages.viewDossier')}
                              </button>
                            )}
                          </div>
                          <div className={styles.messageTime}>
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.empty}>{t('authority.coordination.messages.noMessages')}</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.messageInputContainer}>
                <div className={styles.messageInput}>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t('authority.coordination.messages.placeholder')}
                    rows={1}
                    className={styles.textarea}
                    disabled={messagesLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    className={styles.sendButton}
                    disabled={!messageText.trim() || messagesLoading}
                    title={t('authority.coordination.messages.send')}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === RESSOURCES TAB === */}
          {activeTab === 'ressources' && (
            <div className={styles.section}>
              <h2>{t('authority.coordination.resources.title')}</h2>

              {resourcesError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                }}>
                  {resourcesError}
                </div>
              )}

              <div className={styles.resourcesList}>
                {resourcesLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>
                ) : resources.length > 0 ? (
                  resources.map((resource) => (
                    <div key={resource.id} className={styles.resourceItem}>
                      <h4>{resource.nom_organisation}</h4>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: resource.disponible ? '#c8e6c9' : '#ffcdd2',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginBottom: '8px',
                      }}>
                        {resource.disponible 
                          ? t('authority.coordination.resources.available')
                          : t('authority.coordination.resources.unavailable')}
                      </span>
                      <ul className={styles.resourceDetails}>
                        <li><User size={14} /> {resource.agents_disponibles} agents disponibles</li>
                        <li><MapPin size={14} /> {resource.vehicules_disponibles} véhicules</li>
                        {resource.autres_ressources.map((r, i) => (
                          <li key={i}><Package size={14} /> {r}</li>
                        ))}
                        <li><MapPin size={14} /> {resource.localisation}</li>
                        <li><Phone size={14} /> {resource.telephone}</li>
                      </ul>
                      <button 
                        className={styles.requestButton}
                        onClick={() => openRequestModal(resource)}
                        disabled={!resource.disponible}
                      >
                        {t('authority.coordination.resources.request')}
                      </button>
                    </div>
                  ))
                ) : (
                  <p>{t('authority.coordination.resources.title')}</p>
                )}
              </div>

              {/* Demandes en cours */}
              {requests.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3>{t('authority.coordination.resources.request')}</h3>
                  {requests.map(req => (
                    <div key={req.id} style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '8px',
                    }}>
                      <p><strong>{req.type_ressource}</strong> x{req.quantite}</p>
                      <p>À: {req.organisation_fournisseur}</p>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: 
                          req.statut === 'approuve' ? '#c8e6c9' :
                          req.statut === 'refuse' ? '#ffcdd2' :
                          '#fff3e0',
                      }}>
                        {req.statut}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === PARTAGES TAB === */}
          {activeTab === 'partages' && (
            <div className={styles.section}>
              <h2>{t('authority.coordination.shares.title')}</h2>

              <div className={styles.sharesList}>
                {sharedLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>
                ) : sharedDossiers.length > 0 ? (
                  sharedDossiers.map((share) => (
                    <div key={share.id} className={styles.shareItem}>
                      <div className={styles.shareHeader}>
                        <h4>{share.numero_dossier} - {t('authority.commonActions.share')} {t('authority.commonActions.view')} {share.partage_par}</h4>
                        <span className={styles.shareBadge}>{t('authority.commonActions.share')}</span>
                      </div>
                      <p>{t('authority.coordination.shares.share')}: {share.organisations_cibles.join(', ')}</p>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>
                        <Calendar size={14} /> {new Date(share.date_partage).toLocaleDateString('fr-FR')}
                        {share.commentaires > 0 && ` | ${share.commentaires} ${t('authority.coordination.messages.title')}`}
                      </p>
                      <div className={styles.shareActions}>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => navigate(`/authority/dossiers/${share.dossier_id}`)}
                        >
                          <Eye size={14} /> {t('authority.commonActions.view')}
                        </button>
                        <button className={styles.actionBtn}><MessageSquare size={14} /> {t('authority.coordination.messages.title')}</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.empty}>{t('authority.coordination.shares.title')}</p>
                )}
              </div>

              <button 
                className={styles.shareButton}
                onClick={() => setShowShareModal(true)}
              >
                <Plus size={16} /> {t('authority.coordination.shares.share')}
              </button>
            </div>
          )}

          {/* === HISTORIQUE TAB === */}
          {activeTab === 'historique' && (
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>{t('authority.coordination.history.title')}</h2>
                <button 
                  onClick={fetchHistory}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  disabled={historyLoading}
                >
                  <RefreshCw size={16} /> {t('authority.header.refresh')}
                </button>
              </div>

              {historyError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                }}>
                  {historyError}
                </div>
              )}

              <div className={styles.historyList}>
                {historyLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>
                ) : history.length > 0 ? (
                  history.map((entry) => (
                    <div key={entry.id} className={styles.historyItem}>
                      <div className={styles.historyTime}>
                        {getHistoryIcon(entry.type)} {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={styles.historyContent}>
                        <p><strong>{entry.titre}</strong></p>
                        <p>{entry.description}</p>
                        <small style={{ color: '#999' }}>
                          {entry.auteur} - {entry.organisation}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.empty}>Aucun historique</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Demande de Ressource */}
        {showRequestModal && selectedResource && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setShowRequestModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                maxWidth: '450px', width: '90%',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '16px' }}>📦 Demander des Ressources</h2>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                À: <strong>{selectedResource.nom_organisation}</strong>
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Type de ressource:</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="agents">Agents / Personnel</option>
                  <option value="vehicules">Véhicules</option>
                  <option value="equipement">Équipement</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Quantité:</label>
                <input
                  type="number"
                  min="1"
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRequestModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.commonActions.cancel')}</button>
                <button onClick={handleRequestResource} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.coordination.resources.request')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Partage de Dossier */}
        {showShareModal && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setShowShareModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                maxWidth: '500px', width: '90%',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '16px' }}>
                <Share2 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {t('authority.coordination.shares.share')}
              </h2>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Dossier à partager:</label>
                <select
                  value={selectedDossierToShare}
                  onChange={(e) => setSelectedDossierToShare(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">-- Sélectionner --</option>
                  {dossiers.slice(0, 20).map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.numero_dossier || `DOS-${d.id.substring(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Partager avec:</label>
                {['Police Nationale', 'Gendarmerie', 'Protection Civile', 'ONG', 'Mairie'].map(org => (
                  <label key={org} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={shareOrganisations.includes(org)}
                      onChange={() => toggleShareOrganisation(org)}
                      style={{ marginRight: '8px' }}
                    />
                    {org}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowShareModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.commonActions.cancel')}</button>
                <button onClick={handleShareDossier} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.commonActions.share')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default CoordinationPage;
