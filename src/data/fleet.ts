/** Flotte Oui Stars (aligne les classes tarifaires E / V / S + électrique et minibus). */

export interface FleetVehicle {
  id: string;
  name: string;
  category: 'business' | 'business_van' | 'first' | 'electro_business' | 'minibus';
  className: 'E-Class' | 'V-Class' | 'S-Class' | 'EQE' | 'Sprinter';
  seats: number;
  luggage: number;
  descFr: string;
}

export const FLEET: FleetVehicle[] = [
  { id: 'e-class', name: 'Mercedes Classe E', category: 'business', className: 'E-Class', seats: 3, luggage: 3,
    descFr: 'Berline d’affaires — la référence discrète et confortable.' },
  { id: 'v-class', name: 'Mercedes Classe V', category: 'business_van', className: 'V-Class', seats: 7, luggage: 7,
    descFr: 'Van premium pour familles, groupes et bagages volumineux.' },
  { id: 's-class', name: 'Mercedes Classe S', category: 'first', className: 'S-Class', seats: 2, luggage: 2,
    descFr: 'Première classe — raffinement absolu pour vos trajets d’exception.' },
  { id: 'maybach', name: 'Mercedes-Maybach', category: 'first', className: 'S-Class', seats: 2, luggage: 2,
    descFr: 'Le summum du luxe automobile pour vos invités les plus prestigieux.' },
  { id: 'eqe', name: 'Mercedes-Benz EQE', category: 'electro_business', className: 'EQE', seats: 3, luggage: 3,
    descFr: 'Électrique d’affaires — élégance silencieuse et responsable.' },
  { id: 'sprinter', name: 'Mercedes Sprinter', category: 'minibus', className: 'Sprinter', seats: 12, luggage: 12,
    descFr: 'Minibus pour délégations et groupes jusqu’à 12 passagers.' },
];
