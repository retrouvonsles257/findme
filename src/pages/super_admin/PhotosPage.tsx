/**
 * =====================================================
 * RETROUVONSLES - Super Admin Photos Page
 * Modération des photos
 * Connecté à Supabase table: photo
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminTableSkeleton } from 'components/skeletons';
import { 
  Image, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, 
  Download, X, Eye, CheckCircle, Ban
} from 'lucide-react';
import styles from './SystemLogsPage.module.css';

interface Photo {
  id: string;
  url_cloudinary: string;
  url_thumbnail?: string;
  type_photo: string;
  titre?: string;
  description?: string;
  qualite_image: string;
  visible_public: boolean;
  approuvee: boolean;
  date_moderation?: string;
  id_personne?: string;
  id_signalement?: string;
  created_at?: string;
  personne?: { nom: string; prenom?: string };
  signalement?: { numero_signalement?: string };
  uploader?: { nom: string; email: string };
}

const ITEMS_PER_PAGE = 20;

export const SuperAdminPhotosPage: React.FC = () => {
  const { t } = useI18n();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Filtres
  const [filterType, setFilterType] = useState<string>('');
  const [filterApprouvee, setFilterApprouvee] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<string>('');

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let countQuery = (supabase as any).from('photo').select('id', { count: 'exact', head: true });
      if (filterType) countQuery = countQuery.eq('type_photo', filterType);
      if (filterApprouvee !== '') countQuery = countQuery.eq('approuvee', filterApprouvee === 'true');
      if (filterVisible !== '') countQuery = countQuery.eq('visible_public', filterVisible === 'true');

      const { count } = await countQuery;
      setTotalCount(count || 0);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('photo')
        .select(`
          *,
          personne:personne(nom, prenom),
          signalement:signalement(numero_signalement),
          uploader:utilisateur!photo_uploadee_par_fkey(nom, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterType) query = query.eq('type_photo', filterType);
      if (filterApprouvee !== '') query = query.eq('approuvee', filterApprouvee === 'true');
      if (filterVisible !== '') query = query.eq('visible_public', filterVisible === 'true');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setPhotos(data || []);
    } catch (err: any) {
      console.error('Erreur chargement photos:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterApprouvee, filterVisible]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleApprove = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('photo')
        .update({ 
          approuvee: true,
          moderee_par: user?.id,
          date_moderation: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      loadPhotos();
    } catch (err: any) {
      setError(t('super_admin.photosError', { message: err.message }));
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('photo')
        .update({ 
          approuvee: false,
          visible_public: false,
          moderee_par: user?.id,
          date_moderation: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      loadPhotos();
    } catch (err: any) {
      setError(t('super_admin.photosError', { message: err.message }));
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Titre', 'Qualité', 'Approuvée', 'Visible', 'Personne', 'Signalement', 'Date création'];
    const rows = photos.map(p => [
      p.id,
      p.type_photo,
      p.titre || '-',
      p.qualite_image,
      p.approuvee ? 'Oui' : 'Non',
      p.visible_public ? 'Oui' : 'Non',
      p.personne ? `${p.personne.prenom || ''} ${p.personne.nom}`.trim() : '-',
      p.signalement?.numero_signalement || '-',
      p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '-',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `photos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <SuperAdminLayout title={t('super_admin.photosTitle')} activeNav="photos">
      <div className={styles['sa-system-logs']}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{t('super_admin.photosTitle')}</h2>
        </div>

        <div className={styles['sa-system-logs__filters']}>
          <div className={styles['sa-system-logs__filter-group']}>
            <Filter size={16} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
              <option value="">{t('super_admin.documentsAllTypes')}</option>
              <option value="portrait">{t('super_admin.photosTypePortrait')}</option>
              <option value="corps_entier">{t('super_admin.photosTypeCorpsEntier')}</option>
              <option value="signalement">{t('super_admin.photosTypeSignalement')}</option>
              <option value="lieu_disparition">{t('super_admin.photosTypeLieuDisparition')}</option>
              <option value="objet_personnel">{t('super_admin.photosTypeObjetPersonnel')}</option>
              <option value="document">{t('super_admin.photosTypeDocument')}</option>
              <option value="autre">{t('super_admin.photosTypeAutre')}</option>
            </select>
          </div>
          <select value={filterApprouvee} onChange={(e) => { setFilterApprouvee(e.target.value); setCurrentPage(1); }}>
            <option value="">Toutes</option>
            <option value="true">Approuvées</option>
            <option value="false">Non approuvées</option>
          </select>
          <select value={filterVisible} onChange={(e) => { setFilterVisible(e.target.value); setCurrentPage(1); }}>
            <option value="">Toutes</option>
            <option value="true">Visibles</option>
            <option value="false">Masquées</option>
          </select>
          <button onClick={exportToCSV} className={styles['sa-system-logs__export-btn']}>
            <Download size={16} />
            {t('super_admin.photosExportCsv')}
          </button>
        </div>

        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {isLoading ? (
          <div className={styles['sa-system-logs__skeletonWrap']}>
            <AdminTableSkeleton columns={8} rows={8} />
          </div>
        ) : (
          <div className={styles['sa-system-logs__table-wrapper']}>
            {photos.length === 0 ? (
              <div className={styles['sa-system-logs__empty']}>
                <Image size={48} />
                <p>{t('super_admin.photosNoPhotos')}</p>
              </div>
            ) : (
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>{t('super_admin.photosTablePhoto')}</th>
                    <th>{t('super_admin.photosTableType')}</th>
                    <th>{t('super_admin.photosTableTitle')}</th>
                    <th>{t('super_admin.photosTableQuality')}</th>
                    <th>{t('super_admin.photosTablePersonne')}</th>
                    <th>{t('super_admin.photosTableApproved')}</th>
                    <th>{t('super_admin.photosTableVisible')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {photos.map((photo) => (
                    <tr key={photo.id}>
                      <td>
                        {photo.url_thumbnail ? (
                          <img src={photo.url_thumbnail} alt={photo.titre} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <Image size={24} />
                        )}
                      </td>
                      <td>{photo.type_photo}</td>
                      <td>{photo.titre || '-'}</td>
                      <td>{photo.qualite_image}</td>
                      <td>{photo.personne ? `${photo.personne.prenom || ''} ${photo.personne.nom}`.trim() : '-'}</td>
                      <td>{photo.approuvee ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <Ban size={16} style={{ color: '#ef4444' }} />}</td>
                      <td>{photo.visible_public ? 'Oui' : 'Non'}</td>
                      <td>
                        <button onClick={() => setSelectedPhoto(photo)} title="Voir">
                          <Eye size={16} />
                        </button>
                        {!photo.approuvee && (
                          <button onClick={() => handleApprove(photo.id)} title={t('super_admin.photosApprove')} style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {photo.approuvee && (
                          <button onClick={() => handleReject(photo.id)} title={t('super_admin.photosReject')} style={{ marginLeft: '0.5rem', color: '#ef4444' }}>
                            <Ban size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles['sa-system-logs__pagination']}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> {t('common.previous')}
            </button>
            <span>{t('super_admin.systemLogsPageOf', { current: currentPage, total: totalPages })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              {t('common.next')} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {selectedPhoto && (
          <div className={styles['sa-system-logs__modal-overlay']} onClick={() => setSelectedPhoto(null)}>
            <div className={styles['sa-system-logs__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-logs__modal-header']}>
                <h2>{t('super_admin.photosDetailsTitle')}</h2>
                <button onClick={() => setSelectedPhoto(null)}><X size={20} /></button>
              </div>
              <div className={styles['sa-system-logs__modal-body']}>
                <img src={selectedPhoto.url_cloudinary} alt={selectedPhoto.titre} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', marginBottom: '1rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Type:</strong> {selectedPhoto.type_photo}</div>
                  {selectedPhoto.titre && <div><strong>Titre:</strong> {selectedPhoto.titre}</div>}
                  {selectedPhoto.description && <div><strong>Description:</strong> {selectedPhoto.description}</div>}
                  <div><strong>Qualité:</strong> {selectedPhoto.qualite_image}</div>
                  <div><strong>Approuvée:</strong> {selectedPhoto.approuvee ? 'Oui' : 'Non'}</div>
                  <div><strong>Visible:</strong> {selectedPhoto.visible_public ? 'Oui' : 'Non'}</div>
                  {selectedPhoto.personne && <div><strong>Personne:</strong> {selectedPhoto.personne.prenom || ''} {selectedPhoto.personne.nom}</div>}
                  {selectedPhoto.uploader && <div><strong>Uploadé par:</strong> {selectedPhoto.uploader.email}</div>}
                </div>
              </div>
              <div className={styles['sa-system-logs__modal-footer']}>
                {!selectedPhoto.approuvee && (
                  <button onClick={() => { handleApprove(selectedPhoto.id); setSelectedPhoto(null); }} style={{ background: '#10b981', color: 'white' }}>
                    <CheckCircle size={16} />
                    {t('super_admin.photosApprove')}
                  </button>
                )}
                {selectedPhoto.approuvee && (
                  <button onClick={() => { handleReject(selectedPhoto.id); setSelectedPhoto(null); }} style={{ background: '#ef4444', color: 'white' }}>
                    <Ban size={16} />
                    {t('super_admin.photosReject')}
                  </button>
                )}
                <button onClick={() => setSelectedPhoto(null)}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminPhotosPage;
