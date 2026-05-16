/**
 * Coordonnées publiques affichées sur le site (footer, contact, prévention, etc.).
 */
export const PUBLIC_CONTACT = {
  email: 'info@retrouvonsles.te-sea.com',
  phoneDisplay: '6 91 50 3817',
  phoneTel: '+237691503817',
  address: 'Yaoundé, Cameroun',
} as const;

/** Numéros d'urgence nationaux (Cameroun). */
export const CAMEROON_EMERGENCY_NUMBERS = [
  { id: 'police', labelFr: 'Police', labelEn: 'Police', number: '117', tel: '117' },
  { id: 'fire', labelFr: 'Sapeurs-pompiers', labelEn: 'Fire brigade', number: '118', tel: '118' },
  { id: 'medical', labelFr: 'Urgences médicales (SAMU)', labelEn: 'Medical emergency (SAMU)', number: '1515', tel: '1515' },
  { id: 'gendarmerie', labelFr: 'Gendarmerie', labelEn: 'Gendarmerie', number: '1511', tel: '1511' },
] as const;
