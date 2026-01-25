/**
 * =====================================================
 * RETROUVONSLES - Types pour les Entités
 * =====================================================
 */

import { NomRole } from './enums.types';

export type User = {
  id: string;
  name: string;
  email: string;
  role: NomRole;
};

export type Report = {
  id: string;
  userId: string;
  description: string;
  status: string;
};
