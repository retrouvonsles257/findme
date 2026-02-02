/**
 * =====================================================
 * RETROUVONSLES - Don API Service
 * Appels directes à la base de données Supabase
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  Don,
  TypeDon,
  MethodePaiement,
  StatutPaiement,
} from '../../../@types';
import { StatutPaiement as StatutPaiementEnum } from '../../../@types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DonCreateInput {
  montant: number;
  devise?: string;
  type_don: TypeDon;
  donateur_anonyme?: boolean;
  nom_donateur?: string;
  email_donateur?: string;
  telephone_donateur?: string;
  organisation_donatrice?: string;
  message_donateur?: string;
  methode_paiement: MethodePaiement;
  reference_transaction?: string;
  id_transaction_externe?: string;
}

export interface DonUpdateInput {
  statut_paiement?: StatutPaiement;
  date_traitement?: string;
  remerciement_envoye?: boolean;
  date_remerciement?: string;
  recu_fiscal_genere?: boolean;
  numero_recu?: string;
  reference_transaction?: string;
}

export interface DonFilters {
  statut?: StatutPaiement[];
  type_don?: TypeDon[];
  methode_paiement?: MethodePaiement[];
  date_min?: string;
  date_max?: string;
  montant_min?: number;
  montant_max?: number;
  limit?: number;
  offset?: number;
}

export interface DonStats {
  total_dons: number;
  montant_total: number;
  montant_moyen: number;
  par_statut: Record<StatutPaiement, number>;
  par_type: Record<TypeDon, number>;
  par_methode: Record<MethodePaiement, number>;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Créer un nouveau don
 */
export const createDon = async (input: DonCreateInput): Promise<Don> => {
  const { data, error } = await supabase
    .from('don')
    .insert([
      {
        montant: input.montant,
        devise: input.devise || 'XAF',
        type_don: input.type_don,
        donateur_anonyme: input.donateur_anonyme || false,
        nom_donateur: input.nom_donateur,
        email_donateur: input.email_donateur,
        telephone_donateur: input.telephone_donateur,
        organisation_donatrice: input.organisation_donatrice,
        message_donateur: input.message_donateur,
        methode_paiement: input.methode_paiement,
        statut_paiement: StatutPaiementEnum.EN_ATTENTE,
        reference_transaction: input.reference_transaction,
        id_transaction_externe: input.id_transaction_externe,
        date_don: new Date().toISOString(),
      } as any,
    ] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Récupérer un don par ID
 */
export const getDonById = async (id: string): Promise<Don> => {
  const { data, error } = await supabase
    .from('don')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Récupérer un don par référence transaction (ex: retour gateway)
 */
export const getDonByReferenceTransaction = async (reference: string): Promise<Don> => {
  const { data, error } = await supabase
    .from('don')
    .select('*')
    .eq('reference_transaction', reference)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Récupérer tous les dons avec filtres
 */
export const getDons = async (filters?: DonFilters): Promise<Don[]> => {
  let query = supabase
    .from('don')
    .select('*');

  if (filters?.statut) {
    query = query.in('statut_paiement', filters.statut);
  }
  if (filters?.type_don) {
    query = query.in('type_don', filters.type_don);
  }
  if (filters?.methode_paiement) {
    query = query.in('methode_paiement', filters.methode_paiement);
  }
  if (filters?.date_min) {
    query = query.gte('date_don', filters.date_min);
  }
  if (filters?.date_max) {
    query = query.lte('date_don', filters.date_max);
  }
  if (filters?.montant_min !== undefined) {
    query = query.gte('montant', filters.montant_min);
  }
  if (filters?.montant_max !== undefined) {
    query = query.lte('montant', filters.montant_max);
  }

  query = query.order('date_don', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Mettre à jour un don
 */
export const updateDon = async (id: string, input: DonUpdateInput): Promise<Don> => {
  const { data, error } = (await (supabase as any)
    .from('don')
    .update({
      ...input,
    })
    .eq('id', id)
    .select()
    .single()) as any;

  if (error) throw error;
  return data;
};

/**
 * Supprimer un don
 */
export const deleteDon = async (id: string): Promise<void> => {
  const { error } = await supabase.from('don').delete().eq('id', id);
  if (error) throw error;
};

// ============================================
// PAYMENT OPERATIONS
// ============================================

/**
 * Mettre à jour le statut de paiement
 */
export const updateDonPaymentStatus = async (
  id: string,
  statut: StatutPaiement,
  reference?: string,
): Promise<Don> => {
  const updateData: any = {
    statut_paiement: statut,
  };

  if (statut === StatutPaiementEnum.REUSSI) {
    updateData.date_traitement = new Date().toISOString();
  }

  if (reference) {
    updateData.reference_transaction = reference;
  }

  const { data, error } = await (supabase as any)
    .from('don')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Marquer un don comme ayant reçu un remerciement
 */
export const markDonAsThanked = async (id: string): Promise<Don> => {
  const { data, error } = await (supabase as any)
    .from('don')
    .update({
      remerciement_envoye: true,
      date_remerciement: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Générer et enregistrer un reçu fiscal
 */
export const generateDonReceipt = async (
  id: string,
  numeroReceipt: string,
): Promise<Don> => {
  const { data, error } = await (supabase as any)
    .from('don')
    .update({
      recu_fiscal_genere: true,
      numero_recu: numeroReceipt,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// STATISTICS OPERATIONS
// ============================================

/**
 * Récupérer les statistiques des dons
 */
export const getDonStatistics = async (): Promise<DonStats> => {
  const { data, error } = await supabase
    .from('don')
    .select('*');

  if (error) throw error;

  const dons = data || [];

  // Initialiser les statistiques
  const stats: DonStats = {
    total_dons: dons.length,
    montant_total: 0,
    montant_moyen: 0,
    par_statut: {} as Record<StatutPaiement, number>,
    par_type: {} as Record<TypeDon, number>,
    par_methode: {} as Record<MethodePaiement, number>,
  };

  // Calculer les statistiques
  dons.forEach((don: Don) => {
    stats.montant_total += don.montant || 0;

    // Par statut
    if (!stats.par_statut[don.statut_paiement as StatutPaiement]) {
      stats.par_statut[don.statut_paiement as StatutPaiement] = 0;
    }
    stats.par_statut[don.statut_paiement as StatutPaiement]++;

    // Par type
    if (!stats.par_type[don.type_don as TypeDon]) {
      stats.par_type[don.type_don as TypeDon] = 0;
    }
    stats.par_type[don.type_don as TypeDon]++;

    // Par méthode
    if (!stats.par_methode[don.methode_paiement as MethodePaiement]) {
      stats.par_methode[don.methode_paiement as MethodePaiement] = 0;
    }
    stats.par_methode[don.methode_paiement as MethodePaiement]++;
  });

  stats.montant_moyen = dons.length > 0 ? stats.montant_total / dons.length : 0;

  return stats;
};

/**
 * Récupérer les dons récents
 */
export const getRecentDons = async (limit: number = 10): Promise<Don[]> => {
  const { data, error } = await supabase
    .from('don')
    .select('*')
    .eq('statut_paiement', StatutPaiementEnum.REUSSI)
    .order('date_don', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Récupérer l'historique des dons pour un email
 */
export const getDonationHistory = async (emailDonateur: string): Promise<Don[]> => {
  const { data, error } = await supabase
    .from('don')
    .select('*')
    .eq('email_donateur', emailDonateur)
    .order('date_don', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Compter les dons réussis
 */
export const countSuccessfulDons = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('don')
    .select('*', { count: 'exact', head: true })
    .eq('statut_paiement', StatutPaiementEnum.REUSSI);

  if (error) throw error;
  return count || 0;
};

/**
 * Calculer le montant total des dons réussis
 */
export const getTotalDonationsAmount = async (): Promise<number> => {
  const dons = await getDons({
    statut: [StatutPaiementEnum.REUSSI],
  });

  return dons.reduce((total, don) => total + (don.montant || 0), 0);
};
