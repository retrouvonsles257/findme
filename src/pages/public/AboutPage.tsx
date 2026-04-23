import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import {
  Heart,
  Target,
  Eye,
  Sparkles,
  Shield,
  Cpu,
  HandHeart,
  ChevronRight,
} from 'lucide-react';
import styles from './AboutPage.module.css';

export const AboutPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const values = [
    {
      icon: HandHeart,
      title: language === 'fr' ? 'Solidarité' : 'Solidarity',
      description: language === 'fr'
        ? 'Nous croyons en la force de la communauté pour retrouver les personnes disparues.'
        : 'We believe in the power of community to find missing persons.',
    },
    {
      icon: Cpu,
      title: language === 'fr' ? 'Technologie' : 'Technology',
      description: language === 'fr'
        ? "L'IA et les outils numériques au service de la recherche humanitaire."
        : 'AI and digital tools in service of humanitarian search.',
    },
    {
      icon: Shield,
      title: language === 'fr' ? 'Transparence' : 'Transparency',
      description: language === 'fr'
        ? 'Une gestion claire et responsable des données et des ressources.'
        : 'Clear and responsible management of data and resources.',
    },
    {
      icon: Sparkles,
      title: language === 'fr' ? 'Espoir' : 'Hope',
      description: language === 'fr'
        ? 'Chaque action compte, chaque espoir mérite notre engagement total.'
        : 'Every action counts, every hope deserves our full commitment.',
    },
  ];

  const steps = [
    {
      number: 1,
      title: language === 'fr' ? 'Signalement rapide' : 'Quick Report',
      description: language === 'fr'
        ? 'Signalez une disparition en quelques minutes avec toutes les informations disponibles.'
        : 'Report a disappearance in minutes with all available information.',
    },
    {
      number: 2,
      title: language === 'fr' ? 'Analyse IA' : 'AI Analysis',
      description: language === 'fr'
        ? "Nos algorithmes analysent les photos et données pour identifier des correspondances."
        : 'Our algorithms analyze photos and data to identify matches.',
    },
    {
      number: 3,
      title: language === 'fr' ? 'Mobilisation' : 'Mobilization',
      description: language === 'fr'
        ? 'La communauté reçoit des alertes et peut signaler des observations.'
        : 'The community receives alerts and can report sightings.',
    },
    {
      number: 4,
      title: language === 'fr' ? 'Retrouvailles' : 'Reunion',
      description: language === 'fr'
        ? 'Les informations sont centralisées pour faciliter les retrouvailles.'
        : 'Information is centralized to facilitate reunions.',
    },
  ];

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{t('public.about.title')}</h1>
          <p>{t('public.about.subtitle')}</p>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Mission & Vision */}
        <section className={styles.missionSection}>
          <div className={styles.container}>
            <div className={styles.missionGrid}>
              <div className={styles.missionCard}>
                <div className={styles.missionIcon}>
                  <Target size={32} />
                </div>
                <h2>{t('public.about.mission.title')}</h2>
                <p>{t('public.about.mission.content')}</p>
              </div>

              <div className={styles.missionCard}>
                <div className={styles.missionIcon}>
                  <Eye size={32} />
                </div>
                <h2>{t('public.about.vision.title')}</h2>
                <p>{t('public.about.vision.content')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className={styles.valuesSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {language === 'fr' ? 'Nos valeurs' : 'Our Values'}
            </h2>
            <div className={styles.valuesGrid}>
              {values.map((value, index) => (
                <div key={index} className={styles.valueCard}>
                  <div className={styles.valueIcon}>
                    <value.icon size={28} />
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.stepsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {language === 'fr' ? 'Comment ça marche' : 'How It Works'}
            </h2>
            <div className={styles.stepsGrid}>
              {steps.map((step) => (
                <div key={step.number} className={styles.stepCard}>
                  <div className={styles.stepNumber}>{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>{language === 'fr' ? 'Rejoignez notre mission' : 'Join Our Mission'}</h2>
              <p>
                {language === 'fr'
                  ? 'Chaque action compte. Ensemble, nous pouvons faire la différence.'
                  : 'Every action counts. Together, we can make a difference.'}
              </p>
              <div className={styles.ctaButtons}>
                <button className={styles.btnPrimary} onClick={() => navigate('/donate')}>
                  <Heart size={18} />
                  {language === 'fr' ? 'Faire un don' : 'Donate'}
                </button>
                <button className={styles.btnSecondary} onClick={() => navigate('/contact')}>
                  {language === 'fr' ? 'Devenir bénévole' : 'Volunteer'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>{t('public.footer.copyright').replace('{{year}}', String(new Date().getFullYear()))}</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
