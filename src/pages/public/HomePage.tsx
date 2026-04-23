import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n, useInView } from '../../hooks';
import { supabase } from '../../config';
import {
  AlertTriangle,
  Eye,
  Users,
  MapPin,
  Heart,
  UserPlus,
  Brain,
  Sparkles,
  Camera,
  MessageSquare,
  CheckCircle,
  Shield,
  Building2,
  Globe,
} from 'lucide-react';
import styles from './HomePage.module.css';
import { MissingPersonsCarousel, HomeMapSection } from '../../components/public';

type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'zoom';

const REVEAL_VARIANT_CLASS: Record<RevealVariant, string> = {
  up: styles.revealUp,
  down: styles.revealDown,
  left: styles.revealLeft,
  right: styles.revealRight,
  zoom: styles.revealZoom,
};

function Reveal({
  children,
  className,
  style,
  variant = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: RevealVariant;
}) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${REVEAL_VARIANT_CLASS[variant]} ${isVisible ? styles.revealVisible : ''} ${className ?? ''}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface DossierStats {
  totalCases: number;
  totalSignalements: number;
  totalAvis: number;
  totalPhotos: number;
}

interface Temoignage {
  id: string;
  nom_complet: string;
  photo_principale?: string;
  date_resolution?: string;
  derniere_localisation_connue?: string;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const [stats, setStats] = useState<DossierStats>({
    totalCases: 0,
    totalSignalements: 0,
    totalAvis: 0,
    totalPhotos: 0,
  });
  const [temoignages, setTemoignages] = useState<Temoignage[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const loadStatistics = useCallback(async () => {
    try {
      const [dossiersRes, signalementRes, avisRes, photosRes] = await Promise.all([
        supabase.from('dossier_disparition').select('id', { count: 'exact', head: true }) as any,
        supabase.from('signalement').select('id', { count: 'exact', head: true }) as any,
        supabase.from('avis').select('id', { count: 'exact', head: true }) as any,
        supabase
          .from('dossier_disparition')
          .select('photo_principale')
          .not('photo_principale', 'is', null) as any,
      ]);

      const photosCount = (photosRes.data || []).filter((d: any) => d.photo_principale).length;

      setStats({
        totalCases: dossiersRes.count || 0,
        totalSignalements: signalementRes.count || 0,
        totalAvis: avisRes.count || 0,
        totalPhotos: photosCount,
      });

      // Charger les témoignages (cas résolus avec vraies données)
      const { data: temoignagesData } = await (supabase
        .from('dossier_disparition')
        .select(`
          id,
          lieu_disparition,
          ville_disparition,
          date_resolution,
          personne:id_personne (
            nom_complet,
            photo_principale
          )
        `)
        .eq('statut_dossier', 'retrouve_vivant')
        .order('date_resolution', { ascending: false })
        .limit(3) as any);

      const formatted: Temoignage[] = (temoignagesData || []).map((d: any) => ({
        id: d.id,
        nom_complet: d.personne?.nom_complet || 'Personne retrouvée',
        photo_principale: d.personne?.photo_principale,
        date_resolution: d.date_resolution,
        derniere_localisation_connue: d.lieu_disparition || d.ville_disparition,
      }));

      setTemoignages(formatted);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setStatsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section id="home-hero" className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.heroCameroon}>
              <span className={styles.cameroonFlag} aria-hidden>
                <svg viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="3" height="6" fill="#007A5E" />
                  <rect x="3" width="3" height="6" fill="#CE1126" />
                  <rect x="6" width="3" height="6" fill="#FCD116" />
                  {/* Étoile à 5 branches (or), centrée sur la bande rouge */}
                  <polygon
                    fill="#FCD116"
                    stroke="#CE1126"
                    strokeWidth="0.04"
                    strokeLinejoin="round"
                    points="4.5,2.05 4.72,2.69 5.4,2.71 4.86,3.12 5.06,3.77 4.5,3.38 3.94,3.77 4.14,3.12 3.6,2.71 4.28,2.69"
                  />
                </svg>
              </span>
              <span>{t('public.home.cameroon_badge')}</span>
            </div>
            <h1 className={styles.heroTitle}>
              {t('public.home.title').split(',')[0]},
              <br />
              <span className={styles.highlight}>
                {(t('public.home.title').split(',')[1] || 'Retrouvons-Les').trim()}
              </span>
            </h1>
            <p className={styles.heroDescription}>{t('public.home.subtitle')}</p>
            <p className={styles.heroCasesCount}>
              {t('public.home.cases_count').replace('{{count}}', String(stats.totalCases || 441))}
            </p>

            <MissingPersonsCarousel />
          </div>
          <div className={styles.heroImage} aria-hidden>
            <img src="/assets/images/unity.png" alt="" className={styles.heroImg} />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="home-stats" className={styles.statsSection}>
        <Reveal variant="up">
          <h2 className={styles.sectionTitle}>{t('public.home.stats_title')}</h2>
        </Reveal>
        <div className={styles.statsContainer}>
          <Reveal variant="up" style={{ transitionDelay: '0ms' }}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Users size={32} />
              </div>
              <div className={styles.statNumber}>
                {!statsLoaded ? <span className={styles.statNumberSkeleton} aria-hidden /> : stats.totalCases}
              </div>
              <div className={styles.statLabel}>{t('public.home.total_cases')}</div>
              <div className={styles.statSubtext}>{t('public.home.total_cases_desc')}</div>
            </div>
          </Reveal>

          <Reveal variant="right" style={{ transitionDelay: '75ms' }}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MessageSquare size={32} />
              </div>
              <div className={styles.statNumber}>
                {!statsLoaded ? (
                  <span className={styles.statNumberSkeleton} aria-hidden />
                ) : stats.totalSignalements > 1000 ? (
                  `${Math.floor(stats.totalSignalements / 1000)}k`
                ) : (
                  stats.totalSignalements
                )}
              </div>
              <div className={styles.statLabel}>{t('public.home.total_signals')}</div>
              <div className={styles.statSubtext}>{t('public.home.total_signals_desc')}</div>
            </div>
          </Reveal>

          <Reveal variant="zoom" style={{ transitionDelay: '150ms' }}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Eye size={32} />
              </div>
              <div className={styles.statNumber}>
                {!statsLoaded ? (
                  <span className={styles.statNumberSkeleton} aria-hidden />
                ) : stats.totalAvis > 1000 ? (
                  `${Math.floor(stats.totalAvis / 1000)}k`
                ) : (
                  stats.totalAvis
                )}
              </div>
              <div className={styles.statLabel}>{t('public.home.total_opinions')}</div>
              <div className={styles.statSubtext}>{t('public.home.total_opinions_desc')}</div>
            </div>
          </Reveal>

          <Reveal variant="left" style={{ transitionDelay: '225ms' }}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Camera size={32} />
              </div>
              <div className={styles.statNumber}>
                {!statsLoaded ? (
                  <span className={styles.statNumberSkeleton} aria-hidden />
                ) : stats.totalPhotos > 1000 ? (
                  `${Math.floor(stats.totalPhotos / 1000)}k`
                ) : (
                  stats.totalPhotos
                )}
              </div>
              <div className={styles.statLabel}>{t('public.home.total_photos')}</div>
              <div className={styles.statSubtext}>{t('public.home.total_photos_desc')}</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Synergy Section */}
      <section id="home-synergy" className={styles.synergySection}>
        <Reveal variant="left">
          <h2 className={styles.sectionTitle}>
            {t('public.home.synergy_title').split(' ').slice(0, -1).join(' ')}{' '}
            <span className={styles.highlight}>
              {t('public.home.synergy_title').split(' ').slice(-1)}
            </span>
          </h2>
        </Reveal>

        <div className={styles.synergyGrid}>
          <Reveal variant="up" style={{ transitionDelay: '0ms' }}>
            <div className={styles.synergyCard}>
              <div className={styles.synergyIcon}>
                <AlertTriangle size={40} />
              </div>
              <div className={styles.synergyStep}>01</div>
              <h3>{t('public.home.synergy_step1_title')}</h3>
              <p>{t('public.home.synergy_step1_desc')}</p>
            </div>
          </Reveal>

          <Reveal variant="zoom" style={{ transitionDelay: '80ms' }}>
            <div className={styles.synergyCard}>
              <div className={styles.synergyIcon}>
                <Brain size={40} />
              </div>
              <div className={styles.synergyStep}>02</div>
              <h3>{t('public.home.synergy_step2_title')}</h3>
              <p>{t('public.home.synergy_step2_desc')}</p>
            </div>
          </Reveal>

          <Reveal variant="right" style={{ transitionDelay: '160ms' }}>
            <div className={styles.synergyCard}>
              <div className={styles.synergyIcon}>
                <Users size={40} />
              </div>
              <div className={styles.synergyStep}>03</div>
              <h3>{t('public.home.synergy_step3_title')}</h3>
              <p>{t('public.home.synergy_step3_desc')}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section id="home-map" className={styles.mapSection}>
        <Reveal variant="up">
          <HomeMapSection />
        </Reveal>
      </section>

      {/* Testimonies Section */}
      <section id="home-testimonies" className={styles.testimoniesSection}>
        <Reveal variant="down">
          <h2 className={styles.sectionTitle}>{t('public.home.testimonies_title')}</h2>
        </Reveal>
        <Reveal variant="right" style={{ transitionDelay: '50ms' }}>
          <p className={styles.testimoniesSubtitle}>{t('public.home.testimonies_subtitle')}</p>
        </Reveal>

        <div className={styles.testimoniesGrid}>
          {temoignages.length > 0 ? (
            temoignages.map((temoignage, index) => (
              <Reveal
                key={temoignage.id}
                variant={index % 2 === 0 ? 'up' : 'left'}
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className={styles.testimonyCard}>
                <div className={styles.testimonyHeader}>
                  <div className={styles.testimonyAvatar}>
                    {temoignage.photo_principale ? (
                      <img src={temoignage.photo_principale} alt={temoignage.nom_complet} />
                    ) : (
                      temoignage.nom_complet.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={styles.testimonyInfo}>
                    <h4>{temoignage.nom_complet}</h4>
                    {temoignage.derniere_localisation_connue && (
                      <span className={styles.testimonyLocation}>
                        <MapPin size={12} />
                        {temoignage.derniere_localisation_connue}
                      </span>
                    )}
                  </div>
                  <span className={styles.testimonyBadge}>
                    <CheckCircle size={14} />
                    {t('public.home.testimonies_found')}
                  </span>
                </div>
                {temoignage.date_resolution && (
                  <p className={styles.testimonyDate}>
                    {new Date(temoignage.date_resolution).toLocaleDateString(language, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                </div>
              </Reveal>
            ))
          ) : (
            <Reveal variant="zoom">
              <div className={styles.noTestimonies}>
                <Heart size={48} />
                <p>{t('public.home.testimonies_empty')}</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Partners Section */}
      <section id="home-partners" className={styles.partnersSection}>
        <Reveal variant="zoom">
          <p className={styles.partnersText}>{t('public.home.partners_title')}</p>
        </Reveal>
        <Reveal variant="up" style={{ transitionDelay: '60ms' }}>
          <div className={styles.partnersList}>
          <div className={styles.partnerLogo}>
            <Shield size={24} />
            <span>{t('public.home.partner_police')}</span>
          </div>
          <div className={styles.partnerLogo}>
            <Shield size={24} />
            <span>{t('public.home.partner_gendarmerie')}</span>
          </div>
          <div className={styles.partnerLogo}>
            <Heart size={24} />
            <span>{t('public.home.partner_redcross')}</span>
          </div>
          <div className={styles.partnerLogo}>
            <Building2 size={24} />
            <span>{t('public.home.partner_minas')}</span>
          </div>
          <div className={styles.partnerLogo}>
            <Globe size={24} />
            <span>{t('public.home.partner_unesco')}</span>
          </div>
        </div>
        </Reveal>
      </section>

      {/* CTA Section */}
      <section id="home-cta" className={styles.ctaSection}>
        <Reveal variant="zoom">
          <div className={styles.ctaContent}>
            <h2>{t('public.home.cta_title')}</h2>
            <p>{t('public.home.cta_description')}</p>
            <div className={styles.ctaButtons}>
              <button type="button" className={styles.donateBtn} onClick={() => navigate('/donate')}>
                <Sparkles size={18} />
                <span>{t('public.home.donate_cta')}</span>
              </button>
              <button type="button" className={styles.volunteerBtn} onClick={() => navigate('/volunteer')}>
                <UserPlus size={18} />
                <span>{t('public.home.volunteer_cta')}</span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  );
};
