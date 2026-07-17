/**
 * Points d'intérêt pour l'autocomplétion du formulaire de réservation.
 * Coordonnées (lat/lng) pour l'estimation de distance (haversine).
 * type: airport | station | landmark | city — sert au tri et aux icônes.
 */
export type PoiType = 'airport' | 'station' | 'landmark' | 'city';

export interface Poi {
  id: string;
  label: string;
  sub: string;
  type: PoiType;
  lat: number;
  lng: number;
  /** clé de zone pour la correspondance avec la grille tarifaire fixe */
  zone: string;
}

export const LOCATIONS: Poi[] = [
  // Aéroports
  { id: 'cdg', label: 'Aéroport Paris-Charles de Gaulle', sub: 'CDG · Roissy-en-France', type: 'airport', lat: 49.0097, lng: 2.5479, zone: 'paris-airport' },
  { id: 'ory', label: 'Aéroport Paris-Orly', sub: 'ORY · Orly', type: 'airport', lat: 48.7262, lng: 2.3652, zone: 'paris-airport' },
  { id: 'lbg', label: 'Aéroport Paris-Le Bourget', sub: 'LBG · Aviation d’affaires', type: 'airport', lat: 48.9694, lng: 2.4414, zone: 'paris-airport' },
  { id: 'bva', label: 'Aéroport Paris-Beauvais', sub: 'BVA · Beauvais', type: 'airport', lat: 49.4544, lng: 2.1128, zone: 'beauvais' },
  { id: 'nce', label: 'Aéroport Nice Côte d’Azur', sub: 'NCE · Nice', type: 'airport', lat: 43.6584, lng: 7.2159, zone: 'nice' },
  // Gares
  { id: 'gare-nord', label: 'Gare du Nord', sub: 'Paris 10e', type: 'station', lat: 48.8809, lng: 2.3553, zone: 'paris-station' },
  { id: 'gare-est', label: 'Gare de l’Est', sub: 'Paris 10e', type: 'station', lat: 48.8768, lng: 2.3592, zone: 'paris-station' },
  { id: 'gare-lyon', label: 'Gare de Lyon', sub: 'Paris 12e', type: 'station', lat: 48.8443, lng: 2.3735, zone: 'paris-station' },
  { id: 'gare-montparnasse', label: 'Gare Montparnasse', sub: 'Paris 15e', type: 'station', lat: 48.8404, lng: 2.3196, zone: 'paris-station' },
  // Paris & Île-de-France — landmarks
  { id: 'champs-elysees', label: '78 Av. des Champs-Élysées', sub: 'Paris 8e', type: 'landmark', lat: 48.8718, lng: 2.3040, zone: 'paris' },
  { id: 'tour-eiffel', label: 'Tour Eiffel', sub: 'Paris 7e', type: 'landmark', lat: 48.8584, lng: 2.2945, zone: 'paris' },
  { id: 'louvre', label: 'Musée du Louvre', sub: 'Paris 1er', type: 'landmark', lat: 48.8606, lng: 2.3376, zone: 'paris' },
  { id: 'la-defense', label: 'Paris La Défense Arena', sub: 'Nanterre', type: 'landmark', lat: 48.8955, lng: 2.2295, zone: 'paris' },
  { id: 'opera', label: 'Opéra Garnier', sub: 'Paris 9e', type: 'landmark', lat: 48.8720, lng: 2.3316, zone: 'paris' },
  { id: 'paris', label: 'Paris', sub: 'Centre-ville', type: 'city', lat: 48.8566, lng: 2.3522, zone: 'paris' },
  { id: 'disneyland', label: 'Disneyland Paris', sub: 'Marne-la-Vallée', type: 'landmark', lat: 48.8674, lng: 2.7836, zone: 'disneyland' },
  { id: 'versailles', label: 'Château de Versailles', sub: 'Versailles', type: 'landmark', lat: 48.8049, lng: 2.1204, zone: 'versailles' },
  { id: 'chantilly', label: 'Château de Chantilly', sub: 'Chantilly', type: 'landmark', lat: 49.1936, lng: 2.4855, zone: 'chantilly' },
  { id: 'giverny', label: 'Giverny — Maison de Monet', sub: 'Giverny', type: 'landmark', lat: 49.0759, lng: 1.5335, zone: 'giverny' },
  // Normandie & Champagne
  { id: 'rouen', label: 'Rouen', sub: 'Normandie', type: 'city', lat: 49.4432, lng: 1.0993, zone: 'rouen' },
  { id: 'deauville', label: 'Deauville', sub: 'Normandie', type: 'city', lat: 49.3600, lng: 0.0752, zone: 'deauville' },
  { id: 'honfleur', label: 'Honfleur', sub: 'Normandie', type: 'city', lat: 49.4194, lng: 0.2333, zone: 'honfleur' },
  { id: 'le-havre', label: 'Le Havre', sub: 'Normandie', type: 'city', lat: 49.4944, lng: 0.1079, zone: 'le-havre' },
  { id: 'etretat', label: 'Étretat', sub: 'Normandie', type: 'city', lat: 49.7070, lng: 0.2050, zone: 'etretat' },
  { id: 'mont-saint-michel', label: 'Mont-Saint-Michel', sub: 'Normandie', type: 'landmark', lat: 48.6361, lng: -1.5115, zone: 'mont-saint-michel' },
  { id: 'reims', label: 'Reims', sub: 'Champagne', type: 'city', lat: 49.2583, lng: 4.0317, zone: 'reims' },
  { id: 'epernay', label: 'Épernay', sub: 'Champagne', type: 'city', lat: 49.0439, lng: 3.9597, zone: 'epernay' },
  // Côte d'Azur
  { id: 'nice', label: 'Nice', sub: 'Côte d’Azur', type: 'city', lat: 43.7102, lng: 7.2620, zone: 'nice' },
  { id: 'monaco', label: 'Monaco', sub: 'Monte-Carlo', type: 'city', lat: 43.7384, lng: 7.4246, zone: 'monaco' },
  { id: 'cannes', label: 'Cannes', sub: 'Côte d’Azur', type: 'city', lat: 43.5528, lng: 7.0174, zone: 'cannes' },
  { id: 'saint-tropez', label: 'Saint-Tropez', sub: 'Côte d’Azur', type: 'city', lat: 43.2677, lng: 6.6407, zone: 'saint-tropez' },
];

/** Correspondance {zoneA|zoneB} → id de trajet fixe (grille officielle). Ordre indifférent. */
export const ZONE_ROUTE_MAP: Record<string, string> = {
  'paris-airport|paris': 'cdg-ory-lbg-paris',
  'beauvais|paris': 'bva-paris',
  'paris|paris': 'paris-paris',
  'paris-airport|disneyland': 'paris-disneyland', // approx via grille
  'paris|disneyland': 'paris-disneyland',
  'paris|versailles': 'paris-versailles',
  'paris-airport|versailles': 'airports-versailles',
  'paris|paris-station': 'paris-stations',
  'paris-station|paris-airport': 'stations-airports',
  'paris-station|disneyland': 'stations-disneyland',
  'nice|nice': 'nce-nice',
  'nice|monaco': 'nce-monaco',
  'nice|saint-tropez': 'nice-st-tropez',
  'paris|giverny': 'paris-giverny',
  'paris|rouen': 'paris-rouen',
  'paris|reims': 'paris-reims',
  'paris|epernay': 'paris-epernay',
  'paris|deauville': 'paris-deauville',
  'paris|honfleur': 'paris-honfleur',
  'paris|le-havre': 'paris-le-havre',
  'paris|etretat': 'paris-etretat',
  'paris|mont-saint-michel': 'paris-mont-saint-michel',
};
