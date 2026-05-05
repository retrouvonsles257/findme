/**
 * Anciennes valeurs (metadata JWT, ancien enum) → rôles app (citoyen | autorite | admin_systeme).
 * Source unique pour auth, helpers Supabase, etc. (évite dérive entre fichiers — étape B).
 */
export function normalizeAppRole(role: string | null | undefined): string {
  if (role == null || String(role).trim() === '') return 'citoyen';
  const r = String(role).trim().toLowerCase();
  if (r === 'citoyen' || r === 'autorite' || r === 'admin_systeme') return r;
  const legacy: Record<string, string> = {
    citoyen_standard: 'citoyen',
    citoyen_verifie: 'citoyen',
    super_admin: 'admin_systeme',
    superadmin: 'admin_systeme',
    admin_organisation: 'admin_systeme',
    admin: 'admin_systeme',
    organisation_admin: 'admin_systeme',
    officier_police: 'autorite',
    agent_gendarmerie: 'autorite',
    responsable_ong: 'autorite',
    operateur_saisie: 'autorite',
    moderateur: 'autorite',
  };
  return legacy[r] ?? 'citoyen';
}

export function normalizeAppRoles(roles: string[] | null | undefined): string[] {
  if (!roles?.length) return ['citoyen'];
  const next = roles.map((x) => normalizeAppRole(x));
  return Array.from(new Set(next));
}
