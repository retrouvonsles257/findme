/**
 * Tests du service dons (validation, historique par userId / email)
 */

import * as donAPI from './donAPI';
import { validateDonForm, getDonorDonationHistory } from './donService';
import type { DonFormData } from './donService';

jest.mock('./donAPI');

const mockGetDonsByUserId = donAPI.getDonsByUserId as jest.MockedFunction<typeof donAPI.getDonsByUserId>;
const mockGetDonationHistory = donAPI.getDonationHistory as jest.MockedFunction<typeof donAPI.getDonationHistory>;

describe('donService', () => {
  describe('validateDonForm', () => {
    const baseForm: DonFormData = {
      montant: 5000,
      devise: 'XAF',
      type_don: 'ponctuel',
      methode_paiement: 'mobile_money',
      mobile_money_operator: 'mtn_momo',
      donateur_anonyme: false,
      nom_donateur: 'Test',
      telephone_donateur: '690000000',
    };

    it('accepte un montant multiple de 5 en XAF (ex: 5000)', () => {
      const errors = validateDonForm({ ...baseForm, montant: 5000 });
      expect(errors.montant).toBeUndefined();
    });

    it('accepte 10000, 25000 en XAF', () => {
      expect(validateDonForm({ ...baseForm, montant: 10000 }).montant).toBeUndefined();
      expect(validateDonForm({ ...baseForm, montant: 25000 }).montant).toBeUndefined();
    });

    it('rejette un montant non multiple de 5 en XAF (ex: 5001)', () => {
      const errors = validateDonForm({ ...baseForm, montant: 5001 });
      expect(errors.montant).toMatch(/multiple de 5/);
    });

    it('rejette un montant non multiple de 5 en EUR (après arrondi)', () => {
      const errors = validateDonForm({ ...baseForm, montant: 102, devise: 'EUR' });
      expect(errors.montant).toMatch(/multiple de 5/);
    });

    it('n\'exige pas de multiple de 5 pour USD', () => {
      const errors = validateDonForm({ ...baseForm, montant: 99, devise: 'USD' });
      expect(errors.montant).toBeUndefined();
    });

    it('rejette un montant <= 0', () => {
      expect(validateDonForm({ ...baseForm, montant: 0 }).montant).toBeDefined();
      expect(validateDonForm({ ...baseForm, montant: -1 }).montant).toBeDefined();
    });
  });

  describe('getDonorDonationHistory', () => {
    const mockDon = {
      id: 'don-1',
      montant: 5000,
      devise: 'XAF',
      type_don: 'ponctuel',
      statut_paiement: 'reussi',
      date_don: new Date().toISOString(),
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('utilise getDonsByUserId quand userId est fourni', async () => {
      mockGetDonsByUserId.mockResolvedValue([mockDon]);
      mockGetDonationHistory.mockResolvedValue([]);

      const result = await getDonorDonationHistory({ userId: 'user-123' });

      expect(mockGetDonsByUserId).toHaveBeenCalledWith('user-123', undefined);
      expect(mockGetDonationHistory).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('montant_formate');
    });

    it('utilise getDonationHistory quand seul email est fourni', async () => {
      mockGetDonsByUserId.mockResolvedValue([]);
      mockGetDonationHistory.mockResolvedValue([mockDon]);

      const result = await getDonorDonationHistory({ email: 'donor@test.com' });

      expect(mockGetDonationHistory).toHaveBeenCalledWith('donor@test.com');
      expect(mockGetDonsByUserId).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('priorise userId sur email quand les deux sont fournis', async () => {
      mockGetDonsByUserId.mockResolvedValue([mockDon]);
      mockGetDonationHistory.mockResolvedValue([]);

      await getDonorDonationHistory({ userId: 'user-1', email: 'a@b.com' });

      expect(mockGetDonsByUserId).toHaveBeenCalledWith('user-1', undefined);
      expect(mockGetDonationHistory).not.toHaveBeenCalled();
    });

    it('retourne un tableau vide quand ni userId ni email', async () => {
      const result = await getDonorDonationHistory({});

      expect(mockGetDonsByUserId).not.toHaveBeenCalled();
      expect(mockGetDonationHistory).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
