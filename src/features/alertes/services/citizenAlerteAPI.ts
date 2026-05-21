/**
 * Alertes côté citoyen — lecture via RPC (RLS prod) + repli select.
 */
import { supabase } from '../../../config';
import type { Alerte } from '../../../@types/alertes.types';

const db = { from: (table: string) => (supabase.from(table) as any) };

function mapRowToAlerte(row: Record<string, unknown>): Alerte {
  const statut = (row.statut_alerte ?? row.statut) as Alerte['statut_alerte'];
  return {
    ...(row as unknown as Alerte),
    statut_alerte: statut,
  };
}

export async function listCitizenAlertes(limit = 80): Promise<Alerte[]> {
  const { data: rpcRows, error: rpcErr } = await (supabase as any).rpc('list_citizen_alertes', {
    p_limit: limit,
  });

  if (!rpcErr && Array.isArray(rpcRows)) {
    return rpcRows.map((r: Record<string, unknown>) => mapRowToAlerte(r));
  }

  if (rpcErr && !String(rpcErr.message || '').includes('Could not find the function')) {
    console.warn('[citizenAlerteAPI] list_citizen_alertes:', rpcErr.message);
  }

  const { data, error } = await db
    .from('alerte')
    .select('*, dossier_disparition:id_dossier(id, id_organisation_responsable)')
    .in('statut_alerte', ['en_cours', 'terminee', 'annulee'])
    .order('date_diffusion', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((r: Record<string, unknown>) => mapRowToAlerte(r));
}

export async function getCitizenAlerteById(alerteId: string): Promise<Alerte | null> {
  const { data: rpcJson, error: rpcErr } = await (supabase as any).rpc('get_citizen_alerte_by_id', {
    p_alerte_id: alerteId,
  });

  if (!rpcErr && rpcJson) {
    return mapRowToAlerte(rpcJson as Record<string, unknown>);
  }

  if (rpcErr && !String(rpcErr.message || '').includes('Could not find the function')) {
    console.warn('[citizenAlerteAPI] get_citizen_alerte_by_id:', rpcErr.message);
  }

  const { data, error } = await db
    .from('alerte')
    .select('*, dossier_disparition:id_dossier(id, id_organisation_responsable)')
    .eq('id', alerteId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRowToAlerte(data as Record<string, unknown>);
}
