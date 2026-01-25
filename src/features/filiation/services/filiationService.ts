/**
 * =====================================================
 * RETROUVONSLES - Filiation Service
 * Business logic for filiation operations
 * =====================================================
 */

import * as filiationAPI from './filiationAPI';
import type {
  FiliationLienDatabase,
  FiliationLienInput,
  FiliationTree,
  FiliationNode,
  FiliationLienDisplay,
} from '../types';

/**
 * Create a new filiation link with validation
 */
export const createFiliationLink = async (
  input: FiliationLienInput,
): Promise<FiliationLienDatabase> => {
  // Validate that source and target are different
  if (input.id_personne_source === input.id_personne_cible) {
    throw new Error('Une personne ne peut pas être liée à elle-même');
  }

  return filiationAPI.createFiliationLien(input);
};

/**
 * Build family tree from a person
 */
export const buildFamilyTree = async (idPersonne: string): Promise<FiliationTree> => {
  const liens = await filiationAPI.getFamilyTree(idPersonne);

  // Create tree structure
  const nodes: Map<string, FiliationNode> = new Map();

  // Build a map of all unique persons
  const personneIds = new Set<string>();
  liens.forEach((lien: any) => {
    personneIds.add(lien.id_personne_source);
    personneIds.add(lien.id_personne_cible);
  });

  // Initialize nodes
  personneIds.forEach((id) => {
    nodes.set(id, {
      id,
      nom: '',
      prenom: '',
      generation: 0,
      statut: 'vivant',
      enfants: [],
    });
  });

  // Populate node data from liens
  liens.forEach((lien: any) => {
    const sourceNode = nodes.get(lien.id_personne_source);
    const cibleNode = nodes.get(lien.id_personne_cible);

    if (sourceNode && lien.personne_source) {
      sourceNode.nom = lien.personne_source.nom || '';
      sourceNode.prenom = lien.personne_source.prenom || '';
      sourceNode.date_naissance = lien.personne_source.date_naissance;
      sourceNode.sexe = lien.personne_source.sexe;
      sourceNode.photo = lien.personne_source.photo;
    }

    if (cibleNode && lien.personne_cible) {
      cibleNode.nom = lien.personne_cible.nom || '';
      cibleNode.prenom = lien.personne_cible.prenom || '';
      cibleNode.date_naissance = lien.personne_cible.date_naissance;
      cibleNode.sexe = lien.personne_cible.sexe;
      cibleNode.photo = lien.personne_cible.photo;
      cibleNode.lienAvecSource = lien.type_lien;
      cibleNode.generation = lien.generation;
    }

    // Build parent-child relationships
    const isChild = [
      'enfant_biologique',
      'enfant_adoptif',
    ].includes(lien.type_lien);

    if (isChild && sourceNode && cibleNode) {
      sourceNode.enfants.push(cibleNode);
      cibleNode.parent = sourceNode;
    }
  });

  const racine = nodes.get(idPersonne) || {
    id: idPersonne,
    nom: 'Racine',
    prenom: '',
    generation: 0,
    statut: 'vivant',
    enfants: [],
  };

  return {
    racine,
    totalPersonnes: personneIds.size,
    generations: Math.max(...Array.from(nodes.values()).map((n) => n.generation || 0)),
    liens: liens as FiliationLienDisplay[],
  };
};

/**
 * Get all relationships for a person (parents, children, siblings)
 */
export const getPersonneFamilyRelations = async (idPersonne: string) => {
  const [parents, enfants, fratrie] = await Promise.all([
    filiationAPI.getParents(idPersonne),
    filiationAPI.getEnfants(idPersonne),
    filiationAPI.getFratrie(idPersonne),
  ]);

  return {
    parents,
    enfants,
    fratrie,
    totalRelations: parents.length + enfants.length + fratrie.length,
  };
};

/**
 * Verify a link with enhanced data
 */
export const verifyLinkWithProof = async (
  id: string,
  statut: string,
  typePreuve: string,
  fichierPreuve?: File,
  notes?: string,
): Promise<FiliationLienDatabase> => {
  // If proof file is provided, upload it
  if (fichierPreuve) {
    // TODO: Implement file upload to Supabase storage
    // const fileName = `filiation/${id}/${fichierPreuve.name}`;
    // await supabase.storage.from('documents').upload(fileName, fichierPreuve);
    // documentPath = fileName;
  }

  return filiationAPI.verifyFiliationLien(
    id,
    statut as any,
    typePreuve,
    notes,
  );
};

/**
 * Calculate compatibility score between two people
 */
export const calculateCompatibilityScore = (
  person1: any,
  person2: any,
): number => {
  let score = 0;

  // Age difference check
  if (person1.date_naissance && person2.date_naissance) {
    const age1 = new Date().getFullYear() - new Date(person1.date_naissance).getFullYear();
    const age2 = new Date().getFullYear() - new Date(person2.date_naissance).getFullYear();
    const ageDiff = Math.abs(age1 - age2);

    if (ageDiff > 15 && ageDiff < 50) score += 20; // Parent-child like ages
    else if (ageDiff < 5) score += 10; // Similar age
  }

  // Shared characteristics
  if (person1.sexe && person2.sexe && person1.sexe === person2.sexe) {
    score += 5;
  }

  // Physical characteristics match
  const physicalMatch = ['couleur_peau', 'type_cheveux', 'corpulence'];
  physicalMatch.forEach((characteristic) => {
    if (
      person1[characteristic] &&
      person2[characteristic] &&
      person1[characteristic] === person2[characteristic]
    ) {
      score += 15;
    }
  });

  return Math.min(score, 100);
};

/**
 * Find potential family members based on characteristics
 */
export const findFamilyMembersByCharacteristics = async (
  personneId: string,
  _region?: string,
  _ageRange?: { min: number; max: number },
) => {
  const matches = await filiationAPI.findPotentialMatches(personneId, 60);

  // Could be enhanced with additional filtering
  return matches;
};
