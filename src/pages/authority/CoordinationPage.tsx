/**
 * =====================================================
 * RETROUVONSLES - Coordination Page
 * Coordination inter-agences et partage d'informations
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import { useCoordinationMessages } from '../../features/coordination';
import styles from './CoordinationPage.module.css';

type CoordinationTab = 'messages' | 'ressources' | 'partages' | 'historique';

export const CoordinationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CoordinationTab>('messages');
  const [messageText, setMessageText] = useState('');

  // Utiliser le hook réel avec Supabase Realtime
  const { messages, loading, error, sendMessage } = useCoordinationMessages();

  const handleSendMessage = useCallback(async () => {
    if (messageText.trim()) {
      try {
        await sendMessage(messageText);
        setMessageText('');
      } catch (err) {
        console.error('Erreur lors de l\'envoi:', err);
      }
    }
  }, [messageText, sendMessage]);

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Coordination Inter-Agences</h1>
          <p className={styles.subtitle}>Collaboration et partage d'informations entre autorités</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['messages', 'ressources', 'partages', 'historique'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'messages' && '💬 Messages'}
              {tab === 'ressources' && '📦 Ressources'}
              {tab === 'partages' && '🔗 Partages'}
              {tab === 'historique' && '📋 Historique'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'messages' && (
            <div className={styles.section}>
              <h2>Messages de Coordination</h2>

              {error && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  border: '1px solid #ef5350'
                }}>
                  <strong>Erreur:</strong> {error}
                </div>
              )}

              <div className={styles.messagesList}>
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    Chargement des messages...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className={styles.messageItem}>
                      <div className={styles.messageHeader}>
                        <div>
                          <strong>{msg.author}</strong>
                          <span style={{ marginLeft: '8px', fontSize: '0.85em', color: '#999' }}>
                            {msg.organisation}
                          </span>
                        </div>
                        <span className={styles.time}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={styles.messageText}>{msg.text}</p>
                    </div>
                  ))
                ) : (
                  <p className={styles.empty}>Aucun message</p>
                )}
              </div>

              <div className={styles.messageInput}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Tapez votre message de coordination..."
                  rows={3}
                  className={styles.textarea}
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  className={styles.sendButton}
                  disabled={!messageText.trim() || loading}
                >
                  {loading ? '📤 Envoi...' : '📤 Envoyer'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ressources' && (
            <div className={styles.section}>
              <h2>Ressources Disponibles</h2>

              <div className={styles.resourcesList}>
                <div className={styles.resourceItem}>
                  <h4>Police Nationale - District Nord</h4>
                  <ul className={styles.resourceDetails}>
                    <li>👮 30 agents disponibles</li>
                    <li>🚗 15 véhicules de patrouille</li>
                    <li>📡 Postes de commande: 3</li>
                  </ul>
                  <button className={styles.requestButton}>Demander Ressources</button>
                </div>

                <div className={styles.resourceItem}>
                  <h4>Gendarmerie - Région Est</h4>
                  <ul className={styles.resourceDetails}>
                    <li>👮 20 agents disponibles</li>
                    <li>🚗 10 véhicules de patrouille</li>
                    <li>🚁 1 hélicoptère</li>
                  </ul>
                  <button className={styles.requestButton}>Demander Ressources</button>
                </div>

                <div className={styles.resourceItem}>
                  <h4>ONG Humanitaire Locale</h4>
                  <ul className={styles.resourceDetails}>
                    <li>👥 50 bénévoles</li>
                    <li>🚐 10 véhicules</li>
                    <li>📞 Hotline permanente</li>
                  </ul>
                  <button className={styles.requestButton}>Demander Assistance</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'partages' && (
            <div className={styles.section}>
              <h2>Dossiers Partagés</h2>

              <div className={styles.sharesList}>
                <div className={styles.shareItem}>
                  <div className={styles.shareHeader}>
                    <h4>Dossier #2024-001 - Partagé par Police</h4>
                    <span className={styles.shareBadge}>Partagé</span>
                  </div>
                  <p>Avec: Gendarmerie, ONG, Protection Civile</p>
                  <div className={styles.shareActions}>
                    <button className={styles.actionBtn}>👁️ Voir</button>
                    <button className={styles.actionBtn}>💬 Commenter</button>
                  </div>
                </div>

                <div className={styles.shareItem}>
                  <div className={styles.shareHeader}>
                    <h4>Dossier #2024-005 - Partagé par Gendarmerie</h4>
                    <span className={styles.shareBadge}>Partagé</span>
                  </div>
                  <p>Avec: Police, Protection Civile</p>
                  <div className={styles.shareActions}>
                    <button className={styles.actionBtn}>👁️ Voir</button>
                    <button className={styles.actionBtn}>💬 Commenter</button>
                  </div>
                </div>
              </div>

              <button className={styles.shareButton}>➕ Partager Dossier</button>
            </div>
          )}

          {activeTab === 'historique' && (
            <div className={styles.section}>
              <h2>Historique de Coordination</h2>

              <div className={styles.historyList}>
                <div className={styles.historyItem}>
                  <div className={styles.historyTime}>14:32</div>
                  <div className={styles.historyContent}>
                    <p><strong>Dossier #2024-001 partagé</strong></p>
                    <p>Police a partagé avec Gendarmerie et ONG</p>
                  </div>
                </div>

                <div className={styles.historyItem}>
                  <div className={styles.historyTime}>12:15</div>
                  <div className={styles.historyContent}>
                    <p><strong>Message de coordination</strong></p>
                    <p>Demande de ressources approuvée</p>
                  </div>
                </div>

                <div className={styles.historyItem}>
                  <div className={styles.historyTime}>10:42</div>
                  <div className={styles.historyContent}>
                    <p><strong>Alerte créée et diffusée</strong></p>
                    <p>Dossier #2024-005 - Alerte multi-canaux</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinationPage;
