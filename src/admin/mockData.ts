/** Données de démonstration (remplacées par Supabase en production — voir docs/BACKOFFICE.md). */

export interface Booking {
  reference: string; client: string; route: string; date: string;
  vehicle: 'E-Class' | 'V-Class' | 'S-Class'; amount: number;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled'; driver?: string;
}

export const BOOKINGS: Booking[] = [
  { reference: 'OS-8F2K1A', client: 'M. Laurent', route: 'CDG ⇄ Paris', date: '2026-07-20 09:30', vehicle: 'S-Class', amount: 210, status: 'assigned', driver: 'P. Martin' },
  { reference: 'OS-7B9Q3C', client: 'Mme Nadaud', route: 'Paris ⇄ Versailles', date: '2026-07-21 14:00', vehicle: 'V-Class', amount: 120, status: 'pending' },
  { reference: 'OS-5X1L7D', client: 'Riviera Corp', route: 'Nice ⇄ Monaco', date: '2026-07-22 11:00', vehicle: 'S-Class', amount: 250, status: 'assigned', driver: 'S. Bernard' },
  { reference: 'OS-2M8P4E', client: 'M. Osei', route: 'Paris ⇄ Deauville', date: '2026-07-24 08:00', vehicle: 'E-Class', amount: 770, status: 'completed', driver: 'P. Martin' },
  { reference: 'OS-9J3R6F', client: 'Fashion House', route: 'ORY ⇄ Paris', date: '2026-07-25 18:15', vehicle: 'V-Class', amount: 130, status: 'cancelled' },
];

export interface Quote {
  reference: string; company: string; event: string; dates: string; vehicles: number;
  status: 'new' | 'in_progress' | 'sent' | 'accepted' | 'invoiced';
}

export const QUOTES: Quote[] = [
  { reference: 'DV-4402', company: 'Maison Étoile', event: 'Fashion Week', dates: '2026-09-28 → 10-06', vehicles: 8, status: 'in_progress' },
  { reference: 'DV-4403', company: 'Congrès MedFR', event: 'Congrès médical', dates: '2026-10-12 → 10-14', vehicles: 5, status: 'sent' },
  { reference: 'DV-4404', company: 'Ambassade XYZ', event: 'Délégation officielle', dates: '2026-11-03', vehicles: 3, status: 'accepted' },
];

export const KPIS = [
  { label: 'Réservations (30j)', value: '128' },
  { label: 'Chiffre estimé', value: '48 200 €' },
  { label: 'Devis en cours', value: '9' },
  { label: 'Taux d’assignation', value: '92 %' },
];

/** Classe de badge Bootstrap (AdminLTE) selon le statut. */
export const badgeClass = (s: string) =>
  s === 'completed' || s === 'accepted' || s === 'invoiced' || s === 'active' ? 'text-bg-success'
  : s === 'cancelled' || s === 'rejected' ? 'text-bg-secondary'
  : 'text-bg-warning';
