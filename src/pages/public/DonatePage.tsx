import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './DonatePage.module.css';

interface DonationPackage {
  id: string;
  amount: number;
  label: string;
  description: string;
  icon: string;
}

export const DonatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationType, setDonationType] = useState('once');

  const donationPackages: DonationPackage[] = [
    {
      id: '1',
      amount: 5000,
      label: '5,000 XAF',
      description: 'Contribuez à une recherche',
      icon: '🔍',
    },
    {
      id: '2',
      amount: 10000,
      label: '10,000 XAF',
      description: 'Financez une alerte',
      icon: '🚨',
    },
    {
      id: '3',
      amount: 25000,
      label: '25,000 XAF',
      description: 'Supportez 1 mois d\'opérations',
      icon: '💪',
    },
    {
      id: '4',
      amount: 50000,
      label: '50,000 XAF',
      description: 'Impact mensuel significatif',
      icon: '⭐',
    },
  ];

  const handleDonate = () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount <= 0) {
      alert(t('donate.error_amount'));
      return;
    }

    // Simulate payment gateway integration
    console.log('Processing donation:', {
      amount,
      type: donationType,
    });

    alert(t('donate.payment_redirect'));
  };

  return (
    <div className={styles.donatePage}>
      <div className={styles.container}>
        <button 
          className={styles.backBtn}
          onClick={() => navigate('/')}
        >
          ← {t('donate.back')}
        </button>

        <div className={styles.hero}>
          <h1>{t('donate.title')}</h1>
          <p className={styles.subtitle}>{t('donate.subtitle')}</p>
          <div className={styles.impact}>
            <div className={styles.impactItem}>
              <strong>10,000 XAF</strong>
              <p>{t('donate.impact_1')}</p>
            </div>
            <div className={styles.impactItem}>
              <strong>50,000 XAF</strong>
              <p>{t('donate.impact_2')}</p>
            </div>
            <div className={styles.impactItem}>
              <strong>100,000 XAF</strong>
              <p>{t('donate.impact_3')}</p>
            </div>
          </div>
        </div>

        <div className={styles.donationSection}>
          <div className={styles.typeSelection}>
            <h2>{t('donate.donation_type')}</h2>
            <div className={styles.typeButtons}>
              <button
                className={`${styles.typeBtn} ${donationType === 'once' ? styles.active : ''}`}
                onClick={() => setDonationType('once')}
              >
                {t('donate.one_time')}
              </button>
              <button
                className={`${styles.typeBtn} ${donationType === 'monthly' ? styles.active : ''}`}
                onClick={() => setDonationType('monthly')}
              >
                {t('donate.monthly')}
              </button>
            </div>
          </div>

          <div className={styles.amountSelection}>
            <h2>{t('donate.select_amount')}</h2>
            <div className={styles.packagesGrid}>
              {donationPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`${styles.package} ${selectedAmount === pkg.amount ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedAmount(pkg.amount);
                    setCustomAmount('');
                  }}
                >
                  <div className={styles.icon}>{pkg.icon}</div>
                  <h3>{pkg.label}</h3>
                  <p>{pkg.description}</p>
                </div>
              ))}
            </div>

            <div className={styles.customAmount}>
              <label>{t('donate.custom_amount')}</label>
              <div className={styles.customInput}>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  placeholder={t('donate.enter_amount')}
                  min="100"
                />
                <span> XAF</span>
              </div>
            </div>
          </div>

          <div className={styles.donorInfo}>
            <h2>{t('donate.donor_info')}</h2>
            <div className={styles.infoNote}>
              <p>{t('donate.info_optional')}</p>
            </div>
            <button 
              className={styles.donateBtn}
              onClick={handleDonate}
            >
              {t('donate.proceed_payment')}
            </button>
          </div>
        </div>

        <div className={styles.benefitsSection}>
          <h2>{t('donate.why_donate')}</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefit}>
              <h3>🎯 {t('donate.benefit_1_title')}</h3>
              <p>{t('donate.benefit_1_desc')}</p>
            </div>
            <div className={styles.benefit}>
              <h3>🔐 {t('donate.benefit_2_title')}</h3>
              <p>{t('donate.benefit_2_desc')}</p>
            </div>
            <div className={styles.benefit}>
              <h3>🤝 {t('donate.benefit_3_title')}</h3>
              <p>{t('donate.benefit_3_desc')}</p>
            </div>
            <div className={styles.benefit}>
              <h3>📊 {t('donate.benefit_4_title')}</h3>
              <p>{t('donate.benefit_4_desc')}</p>
            </div>
          </div>
        </div>

        <div className={styles.faqSection}>
          <h2>{t('donate.faq')}</h2>
          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>{t('donate.faq_1_q')}</summary>
              <p>{t('donate.faq_1_a')}</p>
            </details>
            <details className={styles.faqItem}>
              <summary>{t('donate.faq_2_q')}</summary>
              <p>{t('donate.faq_2_a')}</p>
            </details>
            <details className={styles.faqItem}>
              <summary>{t('donate.faq_3_q')}</summary>
              <p>{t('donate.faq_3_a')}</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;
