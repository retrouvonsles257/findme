import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import {
  Search,
  AlertTriangle,
  Eye,
  Users,
  MapPin,
  Phone,
  Mail,
  Map,
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
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import styles from './HomePage.module.css';

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
  const { t, language, changeLanguage } = useI18n();

  const [stats, setStats] = useState<DossierStats>({
    totalCases: 0,
    totalSignalements: 0,
    totalAvis: 0,
    totalPhotos: 0,
  });
  const [temoignages, setTemoignages] = useState<Temoignage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('nom', searchTerm);
    if (searchLocation) params.append('location', searchLocation);
    navigate(`/search?${params.toString()}`);
  };

  const handleSignalMissing = () => {
    navigate('/signaler');
  };

  const handleViewAdvices = () => {
    navigate('/disparitions');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.homePage}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>
            <Search className={styles.logoIcon} size={24} />
            <span className={styles.logoText}>RETROUVONSLES</span>
          </Link>

          <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksOpen : ''}`} aria-hidden={!mobileMenuOpen}>
            <Link to="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Search size={16} />
              {t('public.navbar.home')}
            </Link>
            <Link to="/map" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Map size={16} />
              {t('public.navbar.map')}
            </Link>
            <Link to="/disparitions" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Users size={16} />
              {t('public.navbar.search')}
            </Link>
            <Link to="/signaler" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <AlertTriangle size={16} />
              {t('public.navbar.report')}
            </Link>
            <Link to="/about" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Heart size={16} />
              {t('public.navbar.about')}
            </Link>
            <Link to="/contact" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              <Mail size={16} />
              {t('public.navbar.contact')}
            </Link>
          </div>

          <div className={styles.navActions}>
            <button className={styles.langBtn} onClick={toggleLanguage}>
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button className={styles.loginBtn} onClick={() => navigate('/auth/login')}>
              {t('public.navbar.login')}
            </button>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.heroTag}>
              <Brain size={16} />
              <span>{t('public.home.hero_tag')}</span>
            </div>
            <h1 className={styles.heroTitle}>
              {t('public.home.title').split(',')[0]},{' '}
              <span className={styles.highlight}>
                {t('public.home.title').split(',')[1] || 'Retrouvons-les'}
              </span>
            </h1>
            <p className={styles.heroDescription}>{t('public.home.subtitle')}</p>
            <p className={styles.heroCasesCount}>
              {t('public.home.cases_count').replace('{{count}}', String(stats.totalCases || 441))}
            </p>

            <div className={styles.heroCTA}>
              <button className={styles.btnPrimary} onClick={handleSignalMissing}>
                <AlertTriangle size={18} />
                <span>{t('public.home.report_btn')}</span>
              </button>
              <button className={styles.btnSecondary} onClick={handleViewAdvices}>
                <Eye size={18} />
                <span>{t('public.home.consult_btn')}</span>
              </button>
            </div>

            <div className={styles.searchBox}>
              <div className={styles.searchInputGroup}>
                <div className={styles.searchInputWrapper}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder={t('public.home.search_placeholder')}
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className={styles.searchInputWrapper}>
                  <MapPin size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder={t('public.home.location_placeholder')}
                    className={styles.searchInput}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button className={styles.searchBtn} onClick={handleSearch}>
                  <Search size={18} />
                  <span>{t('public.home.search_btn')}</span>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.heroImage}>
            <img src="/assets/images/unity.png" alt="Ensemble" className={styles.heroImg} />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>{t('public.home.stats_title')}</h2>
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Users size={32} />
            </div>
            <div className={styles.statNumber}>{stats.totalCases}</div>
            <div className={styles.statLabel}>{t('public.home.total_cases')}</div>
            <div className={styles.statSubtext}>{t('public.home.total_cases_desc')}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <MessageSquare size={32} />
            </div>
            <div className={styles.statNumber}>
              {stats.totalSignalements > 1000
                ? `${Math.floor(stats.totalSignalements / 1000)}k`
                : stats.totalSignalements}
            </div>
            <div className={styles.statLabel}>{t('public.home.total_signals')}</div>
            <div className={styles.statSubtext}>{t('public.home.total_signals_desc')}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Eye size={32} />
            </div>
            <div className={styles.statNumber}>
              {stats.totalAvis > 1000
                ? `${Math.floor(stats.totalAvis / 1000)}k`
                : stats.totalAvis}
            </div>
            <div className={styles.statLabel}>{t('public.home.total_opinions')}</div>
            <div className={styles.statSubtext}>{t('public.home.total_opinions_desc')}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Camera size={32} />
            </div>
            <div className={styles.statNumber}>
              {stats.totalPhotos > 1000
                ? `${Math.floor(stats.totalPhotos / 1000)}k`
                : stats.totalPhotos}
            </div>
            <div className={styles.statLabel}>{t('public.home.total_photos')}</div>
            <div className={styles.statSubtext}>{t('public.home.total_photos_desc')}</div>
          </div>
        </div>
      </section>

      {/* Synergy Section */}
      <section className={styles.synergySection}>
        <h2 className={styles.sectionTitle}>
          {t('public.home.synergy_title').split(' ').slice(0, -1).join(' ')}{' '}
          <span className={styles.highlight}>
            {t('public.home.synergy_title').split(' ').slice(-1)}
          </span>
        </h2>

        <div className={styles.synergyGrid}>
          <div className={styles.synergyCard}>
            <div className={styles.synergyIcon}>
              <AlertTriangle size={40} />
            </div>
            <div className={styles.synergyStep}>01</div>
            <h3>{t('public.home.synergy_step1_title')}</h3>
            <p>{t('public.home.synergy_step1_desc')}</p>
          </div>

          <div className={styles.synergyCard}>
            <div className={styles.synergyIcon}>
              <Brain size={40} />
            </div>
            <div className={styles.synergyStep}>02</div>
            <h3>{t('public.home.synergy_step2_title')}</h3>
            <p>{t('public.home.synergy_step2_desc')}</p>
          </div>

          <div className={styles.synergyCard}>
            <div className={styles.synergyIcon}>
              <Users size={40} />
            </div>
            <div className={styles.synergyStep}>03</div>
            <h3>{t('public.home.synergy_step3_title')}</h3>
            <p>{t('public.home.synergy_step3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className={styles.mapSection}>
        <div className={styles.mapContainer}>
          <div className={styles.mapContent}>
            <div className={styles.mapIcon}>
              <Map size={48} />
            </div>
            <h3 className={styles.mapTitle}>{t('public.home.map_title')}</h3>
            <p className={styles.mapDescription}>{t('public.home.map_description')}</p>
            <button className={styles.mapBtn} onClick={() => navigate('/map')}>
              <MapPin size={18} />
              <span>{t('public.home.map_cta')}</span>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className={styles.mapPlaceholder}>
            <Map size={64} />
            <span>{t('public.home.map_title')}</span>
          </div>
        </div>
      </section>

      {/* Testimonies Section */}
      <section className={styles.testimoniesSection}>
        <h2 className={styles.sectionTitle}>{t('public.home.testimonies_title')}</h2>
        <p className={styles.testimoniesSubtitle}>{t('public.home.testimonies_subtitle')}</p>

        <div className={styles.testimoniesGrid}>
          {temoignages.length > 0 ? (
            temoignages.map((temoignage) => (
              <div key={temoignage.id} className={styles.testimonyCard}>
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
            ))
          ) : (
            <div className={styles.noTestimonies}>
              <Heart size={48} />
              <p>{t('public.home.testimonies_empty')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Partners Section */}
      <section className={styles.partnersSection}>
        <p className={styles.partnersText}>{t('public.home.partners_title')}</p>
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
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>{t('public.home.cta_title')}</h2>
          <p>{t('public.home.cta_description')}</p>
          <div className={styles.ctaButtons}>
            <button className={styles.donateBtn} onClick={() => navigate('/donate')}>
              <Sparkles size={18} />
              <span>{t('public.home.donate_cta')}</span>
            </button>
            <button className={styles.volunteerBtn} onClick={() => navigate('/volunteer')}>
              <UserPlus size={18} />
              <span>{t('public.home.volunteer_cta')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <Search size={20} />
              <span>RETROUVONSLES</span>
            </div>
            <p>{t('public.footer.description')}</p>
          </div>

          <div className={styles.footerSection}>
            <h4>{t('public.footer.navigation')}</h4>
            <ul>
              <li>
                <Link to="/">{t('public.navbar.home')}</Link>
              </li>
              <li>
                <Link to="/about">{t('public.navbar.about')}</Link>
              </li>
              <li>
                <Link to="/how-it-works">{t('public.how_it_works.title')}</Link>
              </li>
              <li>
                <Link to="/contact">{t('public.navbar.contact')}</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4>{t('public.footer.resources')}</h4>
            <ul>
              <li>
                <Link to="/search">{t('public.navbar.search')}</Link>
              </li>
              <li>
                <Link to="/map">{t('public.navbar.map')}</Link>
              </li>
              <li>
                <Link to="/disparitions">{t('public.disparitions.title')}</Link>
              </li>
              <li>
                <Link to="/donate">{t('public.donate.title')}</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4>{t('public.footer.contact')}</h4>
            <p className={styles.contactItem}>
              <Mail size={16} />
              <span>{t('public.footer.email')}</span>
            </p>
            <p className={styles.contactItem}>
              <Phone size={16} />
              <span>{t('public.footer.phone')}</span>
            </p>
            <p className={styles.contactItem}>
              <MapPin size={16} />
              <span>{t('public.footer.address')}</span>
            </p>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>{t('public.footer.copyright').replace('{{year}}', String(currentYear))}</p>
          <div className={styles.footerLinks}>
            <Link to="/legal">{t('public.footer.legal')}</Link>
            <Link to="/privacy">{t('public.footer.privacy')}</Link>
            <Link to="/terms">{t('public.footer.terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
