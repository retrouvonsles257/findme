/**
 * =====================================================
 * RETROUVONSLES - Statistiques API Service
 * API calls for statistics operations
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  StatistiquesGlobales,
  StatistiquesRegionales,
  TendanceTemporelle,
  DemographieStats,
  DistributionType,
  DashboardMetrics,
} from '../types';

// Helper to bypass Supabase typing
const db = () => (supabase as any);

/**
 * Get global statistics
 */
export async function getStatistiquesGlobales(): Promise<StatistiquesGlobales> {
  // @ts-ignore - Supabase typing issue
  const { data: personnes } = await db().from('personne').select('id');
  // @ts-ignore
  const { data: dossiers } = await db().from('dossiers').select('id');
  // @ts-ignore
  const { data: signalements } = await db().from('signalement').select('id, etat');
  // @ts-ignore
  const { data: alertes } = await db().from('alertes').select('id');

  const total_personnes = personnes?.length || 0;
  const total_dossiers = dossiers?.length || 0;
  const total_signalements = signalements?.length || 0;
  const total_alertes = alertes?.length || 0;

  const retrouvees = (signalements || []).filter((s: any) => s.etat === 'valide').length;
  const decedees = (signalements || []).filter((s: any) => s.etat === 'rejete').length;
  const taux_resolution = total_signalements > 0 ? (retrouvees / total_signalements) * 100 : 0;

  return {
    total_personnes,
    total_dossiers,
    total_signalements,
    total_alertes,
    personnes_retrouvees: retrouvees,
    personnes_decedees: decedees,
    taux_resolution_global: Math.round(taux_resolution * 10) / 10,
    cas_en_cours: total_signalements - retrouvees - decedees,
    regions_couvertes: 0,
    dernier_maj: new Date().toISOString(),
  };
}

/**
 * Get regional statistics
 */
export async function getStatistiquesRegionales(): Promise<StatistiquesRegionales[]> {
  // @ts-ignore
  const { data: signalements } = await db()
    .from('signalement')
    .select('lieu_observation, etat')
    .order('lieu_observation');

  if (!signalements) return [];

  const regionMap = new Map<string, any>();

  (signalements || []).forEach((s: any) => {
    const region = s.lieu_observation || 'Unknown';
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        region,
        nombre_cas: 0,
        nombre_retrouves: 0,
        nombre_decedes: 0,
        temps_moyen_resolution: 0,
      });
    }
    const stats = regionMap.get(region);
    stats.nombre_cas++;
    if (s.etat === 'valide') stats.nombre_retrouves++;
    if (s.etat === 'rejete') stats.nombre_decedes++;
  });

  return Array.from(regionMap.values()).map((stats: any) => ({
    ...stats,
    taux_resolution: stats.nombre_cas > 0 ? (stats.nombre_retrouves / stats.nombre_cas) * 100 : 0,
  }));
}

/**
 * Get temporal trends
 */
export async function getTendancesTemporelles(
  dateDebut: string,
  dateFin: string
): Promise<TendanceTemporelle[]> {
  // @ts-ignore
  const { data: signalements } = await db()
    .from('signalement')
    .select('date_observation, etat')
    .gte('date_observation', dateDebut)
    .lte('date_observation', dateFin)
    .order('date_observation');

  if (!signalements) return [];

  const dateMap = new Map<string, any>();

  (signalements || []).forEach((s: any) => {
    const date = s.date_observation.split('T')[0];
    if (!dateMap.has(date)) {
      const d = new Date(date);
      const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      dateMap.set(date, {
        date,
        jour: jours[d.getDay()],
        semaine: Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7),
        mois: d.toLocaleString('fr-FR', { month: 'long' }),
        annee: d.getFullYear(),
        cas_nouveaux: 0,
        cas_resolus: 0,
      });
    }
    const trend = dateMap.get(date);
    trend.cas_nouveaux++;
    if (s.etat === 'valide') trend.cas_resolus++;
  });

  return Array.from(dateMap.values()).map((t: any) => ({
    ...t,
    taux_resolution_periode: t.cas_nouveaux > 0 ? (t.cas_resolus / t.cas_nouveaux) * 100 : 0,
  }));
}

/**
 * Get demographics statistics
 */
export async function getDemographieStats(): Promise<DemographieStats[]> {
  // @ts-ignore
  const { data: personnes } = await db()
    .from('personne')
    .select('date_naissance, sexe, id');

  if (!personnes) return [];

  const demographyMap = new Map<string, any>();

  (personnes || []).forEach((p: any) => {
    const age = calculateAge(p.date_naissance);
    const tranche = getAgeGroup(age);
    const sexe = p.sexe || 'Unknown';
    const key = `${tranche}|${sexe}`;

    if (!demographyMap.has(key)) {
      demographyMap.set(key, {
        tranche_age: tranche,
        sexe,
        nombre_cas: 0,
        nombre_retrouves: 0,
      });
    }
    demographyMap.get(key).nombre_cas++;
  });

  return Array.from(demographyMap.values()).map((d: any) => ({
    ...d,
    taux_resolution: d.nombre_cas > 0 ? (d.nombre_retrouves / d.nombre_cas) * 100 : 0,
  }));
}

/**
 * Get distribution by case type
 */
export async function getDistributionType(): Promise<DistributionType[]> {
  // @ts-ignore
  const { data: dossiers } = await db()
    .from('dossiers')
    .select('type_cas, id')
    .order('type_cas');

  if (!dossiers) return [];

  const typeMap = new Map<string, any>();

  (dossiers || []).forEach((d: any) => {
    const type = d.type_cas || 'autre';
    if (!typeMap.has(type)) {
      typeMap.set(type, {
        type,
        nombre_cas: 0,
        nombre_retrouves: 0,
        temps_moyen_resolution: 0,
      });
    }
    typeMap.get(type).nombre_cas++;
  });

  return Array.from(typeMap.values()).map((d: any) => ({
    ...d,
    taux_resolution: d.nombre_cas > 0 ? (d.nombre_retrouves / d.nombre_cas) * 100 : 0,
  }));
}

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(
  daysBack: number = 7
): Promise<DashboardMetrics> {
  const stats = await getStatistiquesGlobales();
  const dateDebut = new Date();
  dateDebut.setDate(dateDebut.getDate() - daysBack);

  // @ts-ignore
  const { data: recentSignalements } = await db()
    .from('signalement')
    .select('created_at, etat')
    .gte('created_at', dateDebut.toISOString());

  const sparklines = {
    cas_7j: [0, 0, 0, 0, 0, 0, 0],
    resolution_7j: [0, 0, 0, 0, 0, 0, 0],
    alertes_7j: [0, 0, 0, 0, 0, 0, 0],
  };

  (recentSignalements || []).forEach((s: any) => {
    const dayIndex = Math.floor(
      (new Date().getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayIndex < 7) {
      sparklines.cas_7j[6 - dayIndex]++;
      if (s.etat === 'valide') sparklines.resolution_7j[6 - dayIndex]++;
    }
  });

  return {
    kpis: {
      total_personnes: stats.total_personnes,
      total_dossiers: stats.total_dossiers,
      total_signalements: stats.total_signalements,
      taux_resolution: stats.taux_resolution_global,
      tendance_resolution: 'stable',
    },
    sparklines,
  };
}

/**
 * Export statistics to file
 */
export async function exportStatistics(
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
): Promise<Blob> {
  const stats = await getStatistiquesGlobales();
  const regionales = await getStatistiquesRegionales();
  const tendances = await getTendancesTemporelles(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString()
  );
  const demographics = await getDemographieStats();

  const data = {
    globales: stats,
    regionales,
    tendances,
    demographics,
  };

  if (format === 'json') {
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  if (format === 'csv') {
    const rows: string[] = [];
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    rows.push('Section,Indicateur,Valeur');
    const g = data.globales as unknown as Record<string, unknown>;
    Object.entries(g).forEach(([k, v]) => rows.push(['globales', k, v].map(escape).join(',')));
    if (Array.isArray(data.regionales) && data.regionales.length) {
      const head = ['region', 'nombre_cas', 'nombre_retrouves', 'nombre_decedes', 'temps_moyen_resolution'].join(',');
      rows.push('regionales,' + head);
      (data.regionales as unknown as Record<string, unknown>[]).forEach((r) =>
        rows.push('regionales,' + [r.region, r.nombre_cas, r.nombre_retrouves, r.nombre_decedes, r.temps_moyen_resolution].map(escape).join(','))
      );
    }
    const csv = '\uFEFF' + rows.join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
  }

  // PDF, XLSX - return JSON for now
  return new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' });
}

/**
 * Helper: Calculate age from birth date
 */
function calculateAge(birthDate?: string): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Helper: Get age group string
 */
function getAgeGroup(age: number): string {
  if (age < 18) return '0-18';
  if (age < 30) return '18-30';
  if (age < 60) return '30-60';
  if (age >= 60) return '60+';
  return 'Unknown';
}
