/**
 * Catalogue de services & navigation — repositionnement "Premium Mobility,
 * Destination Management & Event Solutions" (consigne 16/07/2026).
 */

export interface NavItem {
  id: string;
  fr: string;
  en: string;
  href: string;
}

/** Nouveau menu principal (consigne). */
export const MAIN_NAV: NavItem[] = [
  { id: 'mobility', fr: 'Mobilité Premium', en: 'Premium Mobility', href: '#mobility' },
  { id: 'dmc', fr: 'Destination Management (DMC)', en: 'Destination Management (DMC)', href: '#dmc' },
  { id: 'fleet', fr: 'Gestion de Flotte', en: 'Fleet Operations', href: '#fleet' },
  { id: 'meet-greet', fr: 'Aéroports & Meet & Greeter', en: 'Airports & Meet & Greeter', href: '#meet-greet' },
  { id: 'events', fr: 'Événements & Congrès', en: 'Events & Congresses', href: '#events' },
  { id: 'fashion', fr: 'Fashion Weeks', en: 'Fashion Weeks', href: '#fashion' },
  { id: 'tours', fr: 'Circuits & Expériences', en: 'Tours & Experiences', href: '#tours' },
  { id: 'contact', fr: 'Contact', en: 'Contact', href: '#contact' },
];

export interface ServiceItem {
  id: string;
  fr: string;
  en: string;
  descFr: string;
  descEn: string;
  icon: string; // clé d'icône (SVG inline)
}

/** Catalogue élargi de services (consigne). */
export const SERVICES: ServiceItem[] = [
  { id: 'luxury-transport', fr: 'Transport de Luxe', en: 'Luxury Transportation', icon: 'car',
    descFr: 'Chauffeurs privés en berlines et vans haut de gamme, à travers la France.',
    descEn: 'Private chauffeurs in premium sedans and vans, across France.' },
  { id: 'fleet-ops', fr: 'Gestion de Flotte', en: 'Fleet Operations', icon: 'fleet',
    descFr: 'Coordination de flottes pour délégations, tournées et opérations d’envergure.',
    descEn: 'Fleet coordination for delegations, tours and large-scale operations.' },
  { id: 'dmc', fr: 'Destination Management (DMC)', en: 'Destination Management (DMC)', icon: 'globe',
    descFr: 'Organisation locale complète : logistique, itinéraires, expériences sur mesure.',
    descEn: 'Full local orchestration: logistics, itineraries, bespoke experiences.' },
  { id: 'meet-greet', fr: 'Airport Meet & Greeter', en: 'Airport Meet & Greeter', icon: 'plane',
    descFr: 'Accueil à la porte de l’avion, Fast Track et assistance jusqu’à la sortie.',
    descEn: 'Welcome at the aircraft door, Fast Track and assistance to the exit.' },
  { id: 'events', fr: 'Événements & Congrès', en: 'Events & Congresses', icon: 'star',
    descFr: 'Mobilité coordonnée pour congrès, sommets et événements privés.',
    descEn: 'Coordinated mobility for congresses, summits and private events.' },
  { id: 'fashion', fr: 'Fashion Weeks', en: 'Fashion Weeks', icon: 'sparkle',
    descFr: 'Logistique dédiée aux maisons, mannequins et invités durant les Fashion Weeks.',
    descEn: 'Dedicated logistics for houses, models and guests during Fashion Weeks.' },
  { id: 'corporate', fr: 'Mobilité Corporate', en: 'Corporate Mobility', icon: 'briefcase',
    descFr: 'Comptes entreprises, facturation centralisée et reporting.',
    descEn: 'Corporate accounts, centralized billing and reporting.' },
  { id: 'private-aviation', fr: 'Aviation Privée', en: 'Private Aviation Solutions', icon: 'jet',
    descFr: 'Coordination sol-air pour jets privés et aviation d’affaires.',
    descEn: 'Ground-to-air coordination for private jets and business aviation.' },
  { id: 'business-aviation', fr: 'Support Aviation d’Affaires', en: 'Business Aviation Support', icon: 'jet',
    descFr: 'Assistance FBO, handling et transferts confidentiels.',
    descEn: 'FBO assistance, handling and confidential transfers.' },
  { id: 'hospitality', fr: 'Hôtels & Hospitality', en: 'Hotels & Hospitality', icon: 'building',
    descFr: 'Partenariats palaces et gestion des flux clients VIP.',
    descEn: 'Palace partnerships and VIP guest flow management.' },
  { id: 'embassies', fr: 'Ambassades & Délégations', en: 'Embassies & Official Delegations', icon: 'shield',
    descFr: 'Protocole, sécurité et mobilité pour délégations officielles.',
    descEn: 'Protocol, security and mobility for official delegations.' },
  { id: 'tours', fr: 'Circuits & Expériences', en: 'Private Tours & Experiences', icon: 'map',
    descFr: 'Versailles, Champagne, Normandie, châteaux — itinéraires privés.',
    descEn: 'Versailles, Champagne, Normandy, châteaux — private itineraries.' },
  { id: 'concierge', fr: 'Conciergerie', en: 'Concierge Services', icon: 'bell',
    descFr: 'Demandes sur mesure, réservations et coordination 24/7.',
    descEn: 'Bespoke requests, reservations and 24/7 coordination.' },
];

/** Section "Prestigieuses Adresses" (remplace les marques mondiales — consigne). */
export const PRESTIGIOUS_ADDRESSES = {
  eyebrowFr: 'Nous opérons à travers',
  eyebrowEn: 'We operate across',
  titleFr: 'Les Plus Prestigieuses Adresses de France',
  titleEn: 'France’s Most Prestigious Addresses',
  places: [
    'Avenue des Champs-Élysées',
    'Place Vendôme',
    'Le Bourget · Aviation d’Affaires',
    'Monaco · Monte-Carlo',
    'Côte d’Azur',
    'Versailles',
    'Deauville',
    'Courchevel',
  ],
};
