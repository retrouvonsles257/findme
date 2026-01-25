/**
 * =====================================================
 * RETROUVONSLES - Dons Feature Usage Examples
 * Practical examples for implementing Dons in pages
 * =====================================================
 */

// =====================================================
// EXAMPLE 1: Donation Form Page
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DonationForm, DonationSuccess } from '@/features/dons/components';
import { useDonationCreate } from '@/features/dons/hooks';

export function DonationPageExample() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const { createdDon } = useDonationCreate();

  const handleDonationSuccess = (donId: string) => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/donations/success');
    }, 3000);
  };

  return (
    <div className="donation-page">
      <h1>Faire un Don</h1>
      <p>Votre contribution nous aide à retrouver les personnes disparues</p>

      {showSuccess && createdDon ? (
        <DonationSuccess
          donationAmount={createdDon.montant}
          donationCurrency={createdDon.devise}
          donorName={createdDon.nom_donateur || 'Donateur anonyme'}
          transactionId={createdDon.id}
          onClose={() => navigate('/')}
        />
      ) : (
        <DonationForm
          onSuccess={handleDonationSuccess}
          onCancel={() => navigate('/')}
          showPaymentOptions={true}
        />
      )}
    </div>
  );
}

// =====================================================
// EXAMPLE 2: Donation History with Recent List
// =====================================================

import React, { useEffect } from 'react';
import { DonationHistory, DonationStats } from '@/features/dons/components';
import { useDonationHistory } from '@/features/dons/hooks';

export function DonationHistoryPageExample() {
  const { fetchRecentDonations, fetchStatistics } = useDonationHistory();

  useEffect(() => {
    fetchRecentDonations(10);
    fetchStatistics();
  }, [fetchRecentDonations, fetchStatistics]);

  return (
    <div className="donation-history-page">
      <h1>Historique des Dons</h1>

      <section className="stats-section">
        <DonationStats />
      </section>

      <section className="recent-section">
        <h2>Dons Récents</h2>
        <DonationHistory showRecent={true} limit={10} />
      </section>
    </div>
  );
}

// =====================================================
// EXAMPLE 3: Donor Account - View Personal History
// =====================================================

import React, { useState } from 'react';
import { DonationHistory } from '@/features/dons/components';
import { useDonationHistory } from '@/features/dons/hooks';

export function DonorAccountPageExample({ userEmail }: { userEmail: string }) {
  const { donationHistory, isLoading, fetchDonorHistory } = useDonationHistory();

  const handleLoadHistory = () => {
    fetchDonorHistory(userEmail);
  };

  return (
    <div className="donor-account-page">
      <h1>Mon Compte Donateur</h1>

      <section className="donation-history-section">
        <div className="section-header">
          <h2>Mes Donations</h2>
          <button onClick={handleLoadHistory} disabled={isLoading}>
            {isLoading ? 'Chargement...' : 'Charger l\'historique'}
          </button>
        </div>

        {donationHistory.length > 0 ? (
          <DonationHistory email={userEmail} />
        ) : (
          <p>Vous n\'avez pas encore fait de donation</p>
        )}
      </section>

      <section className="donor-benefits">
        <h2>Avantages Donateurs</h2>
        <ul>
          <li>Reçu fiscal pour tous les dons</li>
          <li>Rapports d\'impact réguliers</li>
          <li>Reconnaissance spéciale</li>
          <li>Accès aux mises à jour prioritaires</li>
        </ul>
      </section>
    </div>
  );
}

// =====================================================
// EXAMPLE 4: Donation Dashboard (Admin)
// =====================================================

import React, { useEffect } from 'react';
import { useDons } from '@/features/dons/hooks';
import {
  selectDons,
  selectStatistics,
  selectIsLoading,
} from '@/features/dons/store';

export function DonationDashboardExample() {
  const {
    dons,
    statistics,
    isLoading,
    fetchDons,
    getStatistics,
    updateDonStatus,
    markAsThanked,
  } = useDons();

  useEffect(() => {
    fetchDons({ statut: ['en_attente', 'reussi'] });
    getStatistics();
  }, [fetchDons, getStatistics]);

  const handleMarkAsThanked = async (donId: string) => {
    await markAsThanked(donId);
    // Refresh the list
    fetchDons({ statut: ['en_attente', 'reussi'] });
  };

  const handleGenerateReceipt = async (donId: string) => {
    // TODO: Generate receipt
    console.log('Generate receipt for:', donId);
  };

  return (
    <div className="donation-dashboard">
      <h1>Tableau de Bord des Dons</h1>

      {statistics && (
        <div className="stats-overview">
          <div className="stat-card">
            <h3>Total collecté</h3>
            <p className="amount">
              {statistics.total_dons.toLocaleString('fr-CM')} XAF
            </p>
          </div>
          <div className="stat-card">
            <h3>Nombre de dons</h3>
            <p className="count">{Object.values(statistics.par_statut).reduce((a, b) => a + b, 0)}</p>
          </div>
          <div className="stat-card">
            <h3>Montant moyen</h3>
            <p className="amount">
              {statistics.total_dons.toLocaleString('fr-CM')} XAF
            </p>
          </div>
        </div>
      )}

      <div className="donations-list">
        <h2>Dons en attente</h2>

        {isLoading ? (
          <p>Chargement...</p>
        ) : dons.length === 0 ? (
          <p>Aucun don en attente</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Montant</th>
                <th>Donateur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dons.map((don) => (
                <tr key={don.id}>
                  <td>{new Date(don.date_don).toLocaleDateString('fr-CM')}</td>
                  <td>{don.montant.toLocaleString('fr-CM')} {don.devise}</td>
                  <td>{don.donateur_anonyme ? 'Anonyme' : don.nom_donateur}</td>
                  <td>
                    <span className={`status status-${don.statut_paiement}`}>
                      {don.statut_paiement}
                    </span>
                  </td>
                  <td className="actions">
                    {don.statut_paiement === 'en_attente' && (
                      <button
                        onClick={() => updateDonStatus(don.id, 'reussi')}
                        className="btn-success"
                      >
                        Valider
                      </button>
                    )}
                    {!don.remerciement_envoye && (
                      <button
                        onClick={() => handleMarkAsThanked(don.id)}
                        className="btn-secondary"
                      >
                        Envoyer remerciement
                      </button>
                    )}
                    {!don.recu_fiscal_genere && (
                      <button
                        onClick={() => handleGenerateReceipt(don.id)}
                        className="btn-secondary"
                      >
                        Générer reçu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 5: Donation Campaign Page
// =====================================================

import React from 'react';
import { DonationForm } from '@/features/dons/components';

export function CampaignDonationPageExample({
  campaignName,
  goalAmount,
  currentAmount,
}: {
  campaignName: string;
  goalAmount: number;
  currentAmount: number;
}) {
  const progressPercentage = (currentAmount / goalAmount) * 100;

  return (
    <div className="campaign-donation-page">
      <div className="campaign-header">
        <h1>{campaignName}</h1>
        <p>Aidez-nous à atteindre notre objectif</p>
      </div>

      <div className="campaign-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-text">
          <strong>{currentAmount.toLocaleString('fr-CM')} XAF</strong> sur{' '}
          <strong>{goalAmount.toLocaleString('fr-CM')} XAF</strong>
          <span className="percentage">{Math.round(progressPercentage)}%</span>
        </div>
      </div>

      <div className="campaign-content">
        <div className="campaign-description">
          <h2>À propos de cette campagne</h2>
          <p>
            Cette campagne vise à financer l\'extension de nos services de recherche
            dans les régions reculées du Cameroun.
          </p>
          <ul>
            <li>Améliorer la capacité d\'investigation</li>
            <li>Former les agents locaux</li>
            <li>Renforcer la coordination avec les autorités</li>
          </ul>
        </div>

        <div className="donation-form-section">
          <h2>Faire un Don</h2>
          <DonationForm
            prefilledType="ponctuel"
            showPaymentOptions={true}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 6: Quick Donation Widget
// =====================================================

import React, { useState } from 'react';
import { PaymentMethods, DonationSuccess } from '@/features/dons/components';
import { useDonationCreate } from '@/features/dons/hooks';

export function QuickDonationWidgetExample() {
  const [step, setStep] = useState<'amount' | 'method' | 'success'>('amount');
  const [amount, setAmount] = useState(10000);
  const [selectedMethod, setSelectedMethod] = useState('carte_bancaire');
  const { submitDonation, processPayment, createdDon } = useDonationCreate();

  const handleSubmitAmount = async () => {
    const don = await submitDonation({
      montant: amount,
      devise: 'XAF',
      type_don: 'ponctuel',
      methode_paiement: selectedMethod as any,
      donateur_anonyme: true,
    });

    if (don) {
      const success = await processPayment(don.id, {
        montant: amount,
        devise: 'XAF',
        methode: selectedMethod as any,
      });

      if (success) {
        setStep('success');
      }
    }
  };

  return (
    <div className="quick-donation-widget">
      {step === 'amount' && (
        <div className="amount-step">
          <h3>Faire un don rapide</h3>
          <div className="amount-presets">
            {[5000, 10000, 25000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                className={amount === preset ? 'selected' : ''}
                onClick={() => setAmount(preset)}
              >
                {preset.toLocaleString('fr-CM')} XAF
              </button>
            ))}
          </div>
          <div className="custom-amount">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
            />
          </div>
          <button className="btn-primary" onClick={() => setStep('method')}>
            Continuer
          </button>
        </div>
      )}

      {step === 'method' && (
        <div className="method-step">
          <PaymentMethods
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />
          <button className="btn-primary" onClick={handleSubmitAmount}>
            Payer {amount.toLocaleString('fr-CM')} XAF
          </button>
        </div>
      )}

      {step === 'success' && createdDon && (
        <DonationSuccess
          donationAmount={createdDon.montant}
          onClose={() => setStep('amount')}
        />
      )}
    </div>
  );
}

// =====================================================
// EXAMPLE 7: Using Redux Selectors in Components
// =====================================================

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectTotalAmount,
  selectSuccessfulDonsCount,
  selectAverageDonAmount,
  selectIsLoading,
  DON_ACTIONS,
} from '@/features/dons/store';

export function DonationStatsWidgetExample() {
  const dispatch = useDispatch();
  const totalAmount = useSelector(selectTotalAmount);
  const successfulCount = useSelector(selectSuccessfulDonsCount);
  const averageAmount = useSelector(selectAverageDonAmount);
  const isLoading = useSelector(selectIsLoading);

  useEffect(() => {
    dispatch({ type: DON_ACTIONS.FETCH_STATISTICS_REQUEST });
    // In real usage, dispatch action to fetch statistics
  }, [dispatch]);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="stats-widget">
      <div className="stat">
        <label>Total collecté</label>
        <span className="value">{totalAmount.toLocaleString('fr-CM')} XAF</span>
      </div>
      <div className="stat">
        <label>Nombre de dons</label>
        <span className="value">{successfulCount}</span>
      </div>
      <div className="stat">
        <label>Montant moyen</label>
        <span className="value">{averageAmount.toLocaleString('fr-CM')} XAF</span>
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 8: Integration with Routes
// =====================================================

/*
Add to routes.config.ts:

{
  path: '/donations',
  label: 'Donations',
  icon: 'gift',
  children: [
    {
      path: '/donations/create',
      label: 'Faire un don',
      component: DonationPageExample,
      accessLevel: 'public',
    },
    {
      path: '/donations/history',
      label: 'Historique',
      component: DonationHistoryPageExample,
      accessLevel: 'authenticated',
    },
    {
      path: '/donations/dashboard',
      label: 'Tableau de bord',
      component: DonationDashboardExample,
      accessLevel: 'admin',
    },
  ],
}
*/

export {};
