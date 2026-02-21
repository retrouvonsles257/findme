import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DonationPageContent } from '../../features/dons/components';
import styles from './DonatePage.module.css';

export const DonatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.donatePage}>
      <DonationPageContent onLogoClick={() => navigate('/')} />
    </div>
  );
};

export default DonatePage;
