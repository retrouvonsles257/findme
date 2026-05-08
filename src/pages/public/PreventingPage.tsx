import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './PreventingPage.module.css';

interface Tip {
  title: string;
  description: string;
  icon: string;
  details: string[];
}

export const PreventingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tips: Tip[] = [
    {
      title: t('preventing.tip1_title'),
      description: t('preventing.tip1_desc'),
      icon: '👤',
      details: [
        t('preventing.tip1_detail1'),
        t('preventing.tip1_detail2'),
        t('preventing.tip1_detail3'),
      ],
    },
    {
      title: t('preventing.tip2_title'),
      description: t('preventing.tip2_desc'),
      icon: '📱',
      details: [
        t('preventing.tip2_detail1'),
        t('preventing.tip2_detail2'),
        t('preventing.tip2_detail3'),
      ],
    },
    {
      title: t('preventing.tip3_title'),
      description: t('preventing.tip3_desc'),
      icon: '🗺️',
      details: [
        t('preventing.tip3_detail1'),
        t('preventing.tip3_detail2'),
        t('preventing.tip3_detail3'),
      ],
    },
    {
      title: t('preventing.tip4_title'),
      description: t('preventing.tip4_desc'),
      icon: '👶',
      details: [
        t('preventing.tip4_detail1'),
        t('preventing.tip4_detail2'),
        t('preventing.tip4_detail3'),
      ],
    },
    {
      title: t('preventing.tip5_title'),
      description: t('preventing.tip5_desc'),
      icon: '🚗',
      details: [
        t('preventing.tip5_detail1'),
        t('preventing.tip5_detail2'),
        t('preventing.tip5_detail3'),
      ],
    },
    {
      title: t('preventing.tip6_title'),
      description: t('preventing.tip6_desc'),
      icon: '🏥',
      details: [
        t('preventing.tip6_detail1'),
        t('preventing.tip6_detail2'),
        t('preventing.tip6_detail3'),
      ],
    },
  ];

  return (
    <div className={styles.preventingPage}>
      <div className={styles.container}>
        <button 
          className={styles.backBtn}
          onClick={() => navigate('/')}
        >
          ← {t('preventing.back')}
        </button>

        <div className={styles.hero}>
          <h1>{t('preventing.title')}</h1>
          <p className={styles.subtitle}>{t('preventing.subtitle')}</p>
        </div>

        <section className={styles.introducation}>
          <p>{t('preventing.introduction')}</p>
        </section>

        <div className={styles.tipsGrid}>
          {tips.map((tip, index) => (
            <div key={index} className={styles.tipCard}>
              <div className={styles.tipHeader}>
                <div className={styles.icon}>{tip.icon}</div>
                <h3>{tip.title}</h3>
              </div>

              <p className={styles.tipDescription}>{tip.description}</p>

              <ul className={styles.detailsList}>
                {tip.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className={styles.risksSection}>
          <h2>{t('preventing.warning_signs')}</h2>
          <div className={styles.warningGrid}>
            <div className={styles.warningCard}>
              <h3>⚠️ {t('preventing.warning1_title')}</h3>
              <p>{t('preventing.warning1_desc')}</p>
            </div>
            <div className={styles.warningCard}>
              <h3>⚠️ {t('preventing.warning2_title')}</h3>
              <p>{t('preventing.warning2_desc')}</p>
            </div>
            <div className={styles.warningCard}>
              <h3>⚠️ {t('preventing.warning3_title')}</h3>
              <p>{t('preventing.warning3_desc')}</p>
            </div>
            <div className={styles.warningCard}>
              <h3>⚠️ {t('preventing.warning4_title')}</h3>
              <p>{t('preventing.warning4_desc')}</p>
            </div>
          </div>
        </section>

        <section className={styles.actionSection}>
          <h2>{t('preventing.action_plan')}</h2>
          <div className={styles.actionSteps}>
            <div className={styles.actionStep}>
              <div className={styles.stepNumber}>1</div>
              <h3>{t('preventing.action1_title')}</h3>
              <p>{t('preventing.action1_desc')}</p>
            </div>
            <div className={styles.actionStep}>
              <div className={styles.stepNumber}>2</div>
              <h3>{t('preventing.action2_title')}</h3>
              <p>{t('preventing.action2_desc')}</p>
            </div>
            <div className={styles.actionStep}>
              <div className={styles.stepNumber}>3</div>
              <h3>{t('preventing.action3_title')}</h3>
              <p>{t('preventing.action3_desc')}</p>
            </div>
            <div className={styles.actionStep}>
              <div className={styles.stepNumber}>4</div>
              <h3>{t('preventing.action4_title')}</h3>
              <p>{t('preventing.action4_desc')}</p>
            </div>
          </div>
        </section>

        <section className={styles.resourcesSection}>
          <h2>{t('preventing.useful_resources')}</h2>
          <div className={styles.resourcesGrid}>
            <div className={styles.resourceCard}>
              <h3>📞 {t('preventing.emergency_numbers')}</h3>
              <p><strong>Police:</strong> 117</p>
              <p><strong>Gendarmerie:</strong> 1511</p>
              <p><strong>Retrouvons-Les :</strong> +237 600 000 000</p>
            </div>
            <div className={styles.resourceCard}>
              <h3>🏥 {t('preventing.hospitals')}</h3>
              <p>Hôpital Général de Yaoundé</p>
              <p>Hôpital Central de Yaoundé</p>
              <p>Cliniques spécialisées</p>
            </div>
            <div className={styles.resourceCard}>
              <h3>👨‍⚖️ {t('preventing.legal')}</h3>
              <p>Ministère de la Justice</p>
              <p>Services juridiques</p>
              <p>Conseil légal gratuit</p>
            </div>
          </div>
        </section>

        <div className={styles.cta}>
          <h2>{t('preventing.share_knowledge')}</h2>
          <p>{t('preventing.share_text')}</p>
          <button 
            className={styles.shareBtn}
            onClick={() => navigate('/')}
          >
            {t('preventing.back_home')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreventingPage;
