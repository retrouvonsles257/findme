import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './HowItWorksPage.module.css';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export const HowItWorksPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps: Step[] = [
    {
      number: 1,
      title: t('how_it_works.step1_title'),
      description: t('how_it_works.step1_desc'),
      icon: '📱',
    },
    {
      number: 2,
      title: t('how_it_works.step2_title'),
      description: t('how_it_works.step2_desc'),
      icon: '🤖',
    },
    {
      number: 3,
      title: t('how_it_works.step3_title'),
      description: t('how_it_works.step3_desc'),
      icon: '👥',
    },
    {
      number: 4,
      title: t('how_it_works.step4_title'),
      description: t('how_it_works.step4_desc'),
      icon: '✅',
    },
  ];

  const features = [
    {
      title: t('how_it_works.feature1_title'),
      description: t('how_it_works.feature1_desc'),
      icon: '🔍',
    },
    {
      title: t('how_it_works.feature2_title'),
      description: t('how_it_works.feature2_desc'),
      icon: '🌐',
    },
    {
      title: t('how_it_works.feature3_title'),
      description: t('how_it_works.feature3_desc'),
      icon: '⚡',
    },
    {
      title: t('how_it_works.feature4_title'),
      description: t('how_it_works.feature4_desc'),
      icon: '🔒',
    },
    {
      title: t('how_it_works.feature5_title'),
      description: t('how_it_works.feature5_desc'),
      icon: '📊',
    },
    {
      title: t('how_it_works.feature6_title'),
      description: t('how_it_works.feature6_desc'),
      icon: '🤝',
    },
  ];

  return (
    <div className={styles.howItWorksPage}>
      <div className={styles.container}>
        <button 
          className={styles.backBtn}
          onClick={() => navigate('/')}
        >
          ← {t('how_it_works.back')}
        </button>

        <div className={styles.hero}>
          <h1>{t('how_it_works.title')}</h1>
          <p className={styles.subtitle}>{t('how_it_works.subtitle')}</p>
        </div>

        <section className={styles.stepsSection}>
          <h2>{t('how_it_works.process')}</h2>
          <div className={styles.stepsContainer}>
            {steps.map((step, index) => (
              <div key={step.number} className={styles.stepCard}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < steps.length - 1 && (
                  <div className={styles.arrow}>→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.featuresSection}>
          <h2>{t('how_it_works.features')}</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.technologySection}>
          <h2>{t('how_it_works.technology')}</h2>
          <div className={styles.techGrid}>
            <div className={styles.techCard}>
              <h3>🤖 {t('how_it_works.ai_recognition')}</h3>
              <p>{t('how_it_works.ai_recognition_desc')}</p>
            </div>
            <div className={styles.techCard}>
              <h3>📡 {t('how_it_works.real_time')}</h3>
              <p>{t('how_it_works.real_time_desc')}</p>
            </div>
            <div className={styles.techCard}>
              <h3>🔗 {t('how_it_works.blockchain')}</h3>
              <p>{t('how_it_works.blockchain_desc')}</p>
            </div>
            <div className={styles.techCard}>
              <h3>📍 {t('how_it_works.geolocation')}</h3>
              <p>{t('how_it_works.geolocation_desc')}</p>
            </div>
          </div>
        </section>

        <section className={styles.statsSection}>
          <h2>{t('how_it_works.stats_title')}</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <strong>98%</strong>
              <p>{t('how_it_works.stat1')}</p>
            </div>
            <div className={styles.statCard}>
              <strong>24/7</strong>
              <p>{t('how_it_works.stat2')}</p>
            </div>
            <div className={styles.statCard}>
              <strong>50+</strong>
              <p>{t('how_it_works.stat3')}</p>
            </div>
            <div className={styles.statCard}>
              <strong>10k+</strong>
              <p>{t('how_it_works.stat4')}</p>
            </div>
          </div>
        </section>

        <div className={styles.cta}>
          <h2>{t('how_it_works.get_started')}</h2>
          <div className={styles.ctaButtons}>
            <button 
              className={styles.btnPrimary}
              onClick={() => navigate('/disparitions')}
            >
              {t('how_it_works.search')}
            </button>
            <button 
              className={styles.btnSecondary}
              onClick={() => navigate('/auth/login')}
            >
              {t('how_it_works.report')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
