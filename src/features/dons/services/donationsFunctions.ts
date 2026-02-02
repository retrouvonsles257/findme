/**
 * =====================================================
 * RETROUVONSLES - Donations Edge Functions Service
 * Appels vers Supabase Edge Functions (mock/live)
 * =====================================================
 */

import { supabase, envConfig } from '../../../config';
import type { Don } from '../../../@types';
import type { DonFormData } from './donService';

export type MobileMoneyOperator = 'mtn_momo' | 'orange_money';

export interface DonationsCreateResult {
  donation: Don;
  mode: 'mock' | 'live';
  payment?: {
    operator?: MobileMoneyOperator;
    providerReference?: string;
    transactionId?: string;
    checkoutUrl?: string | null;
    confirmToken?: string;
  };
}

export interface DonationsMockConfirmResult {
  donation: Don;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: envConfig.REACT_APP_SUPABASE_ANON_KEY,
  };

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    headers.Authorization = `Bearer ${accessToken || envConfig.REACT_APP_SUPABASE_ANON_KEY}`;
  } catch {
    headers.Authorization = `Bearer ${envConfig.REACT_APP_SUPABASE_ANON_KEY}`;
  }

  return headers;
}

async function invokeFunction<TResponse>(
  functionName: string,
  body: unknown,
): Promise<TResponse> {
  // Preferred path (supabase-js v2)
  try {
    const fn = (supabase as any)?.functions?.invoke;
    if (typeof fn === 'function') {
      const { data, error } = await fn(functionName, { body });
      if (error) throw error;
      return data as TResponse;
    }
  } catch (e) {
    // Continue to fetch fallback
  }

  // Fallback path (HTTP)
  const url = `${envConfig.REACT_APP_SUPABASE_URL}/functions/v1/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const details = (json as any)?.error || (json as any)?.message || res.statusText;
    throw new Error(`Edge function ${functionName} failed: ${details}`);
  }

  return json as TResponse;
}

export async function createDonation(formData: DonFormData): Promise<DonationsCreateResult> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const returnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '';
  const notifyUrl = `${envConfig.REACT_APP_SUPABASE_URL}/functions/v1/donations-webhook`;

  const payload = {
    montant: formData.montant,
    devise: formData.devise,
    type_don: formData.type_don,
    methode_paiement: formData.methode_paiement,
    donateur_anonyme: formData.donateur_anonyme,
    nom_donateur: formData.nom_donateur,
    email_donateur: formData.email_donateur,
    telephone_donateur: formData.telephone_donateur,
    organisation_donatrice: formData.organisation_donatrice,
    message_donateur: formData.message_donateur,
    mobile_money_operator: formData.mobile_money_operator,
    notify_url: notifyUrl,
    return_url: returnUrl || origin,
    lang: 'fr',
  };

  const res = await invokeFunction<any>('donations-create', payload);
  const donation: Don | undefined = res?.donation;
  if (!donation) {
    throw new Error('Invalid donations-create response (missing donation)');
  }

  return {
    donation,
    mode: (res?.mode === 'live' ? 'live' : 'mock') as 'mock' | 'live',
    payment: {
      operator: res?.payment?.operator,
      providerReference: res?.payment?.providerReference,
      transactionId: res?.payment?.transactionId,
      checkoutUrl: res?.payment?.checkoutUrl ?? res?.donation?.checkout_url ?? null,
      confirmToken: res?.payment?.mock?.confirmToken,
    },
  };
}

export async function mockConfirmDonation(args: {
  donId: string;
  status?: 'reussi' | 'echoue' | 'annule';
  confirmToken?: string;
}): Promise<DonationsMockConfirmResult> {
  const res = await invokeFunction<any>('donations-mock-confirm', {
    donId: args.donId,
    status: args.status || 'reussi',
    confirmToken: args.confirmToken,
  });
  const donation: Don | undefined = res?.donation;
  if (!donation) {
    throw new Error('Invalid donations-mock-confirm response (missing donation)');
  }
  return { donation };
}

