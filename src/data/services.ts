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

/** Nouveau menu principal (consigne) — libellés compacts, un mot par entrée. */
export const MAIN_NAV: NavItem[] = [
  { id: 'mobility', fr: 'Mobilité', en: 'Mobility', href: '#mobility' },
  { id: 'dmc', fr: 'DMC', en: 'DMC', href: '#dmc' },
  { id: 'fleet', fr: 'Flotte', en: 'Fleet', href: '#fleet' },
  { id: 'meet-greet', fr: 'Aéroports', en: 'Airports', href: '#meet-greet' },
  { id: 'events', fr: 'Événements', en: 'Events', href: '#events' },
  { id: 'tours', fr: 'Circuits', en: 'Tours', href: '#tours' },
  { id: 'contact', fr: 'Contact', en: 'Contact', href: '#contact' },
];

export interface ServiceItem {
  id: string;
  fr: string;
  en: string;
  descFr: string;
  descEn: string;
  icon: string; // clé d'icône (SVG inline)
  image: string; // image de fond (asset /public)
}

/**
 * Catalogue de services (consigne 16/07/2026) — entrée "Transport de Luxe"
 * retirée. Chaque service porte une image de fond dédiée.
 */
export const SERVICES: ServiceItem[] = [
  { id: 'fleet-ops', fr: 'Gestion de Flotte', en: 'Fleet Operations', icon: 'fleet', image: '/why-fleet.webp',
    descFr: 'Coordination de flottes pour délégations, tournées et opérations d’envergure.',
    descEn: 'Fleet coordination for delegations, tours and large-scale operations.' },
  { id: 'dmc', fr: 'Destination Management', en: 'Destination Management', icon: 'globe', image: '/why-map.webp',
    descFr: 'Organisation locale complète : logistique, itinéraires, expériences sur mesure.',
    descEn: 'Full local orchestration: logistics, itineraries, bespoke experiences.' },
  { id: 'meet-greet', fr: 'Airport Meet & Greeter', en: 'Airport Meet & Greeter', icon: 'plane', image: '/why-airport.webp',
    descFr: 'Accueil à la porte de l’avion, Fast Track et assistance jusqu’à la sortie.',
    descEn: 'Welcome at the aircraft door, Fast Track and assistance to the exit.' },
  { id: 'events', fr: 'Événements & Congrès', en: 'Events & Congresses', icon: 'star', image: '/why-paris-night.webp',
    descFr: 'Mobilité coordonnée pour congrès, sommets et événements privés.',
    descEn: 'Coordinated mobility for congresses, summits and private events.' },
  { id: 'fashion', fr: 'Fashion Weeks', en: 'Fashion Weeks', icon: 'sparkle', image: '/why-vip.webp',
    descFr: 'Logistique dédiée aux maisons, mannequins et invités durant les Fashion Weeks.',
    descEn: 'Dedicated logistics for houses, models and guests during Fashion Weeks.' },
  { id: 'corporate', fr: 'Mobilité Corporate', en: 'Corporate Mobility', icon: 'briefcase', image: '/corp-corporate.webp',
    descFr: 'Comptes entreprises, facturation centralisée et reporting.',
    descEn: 'Corporate accounts, centralized billing and reporting.' },
  { id: 'private-aviation', fr: 'Aviation Privée', en: 'Private Aviation Solutions', icon: 'jet', image: '/corp-aviation.webp',
    descFr: 'Coordination sol-air pour jets privés et aviation d’affaires.',
    descEn: 'Ground-to-air coordination for private jets and business aviation.' },
  { id: 'business-aviation', fr: 'Support Aviation d’Affaires', en: 'Business Aviation Support', icon: 'jet', image: '/corp-chauffeur.webp',
    descFr: 'Assistance FBO, handling et transferts confidentiels.',
    descEn: 'FBO assistance, handling and confidential transfers.' },
  { id: 'hospitality', fr: 'Hôtels & Hospitality', en: 'Hotels & Hospitality', icon: 'building', image: '/corp-hotel.webp',
    descFr: 'Partenariats palaces et gestion des flux clients VIP.',
    descEn: 'Palace partnerships and VIP guest flow management.' },
  { id: 'embassies', fr: 'Ambassades & Délégations', en: 'Embassies & Official Delegations', icon: 'shield', image: '/corp-embassy.webp',
    descFr: 'Protocole, sécurité et mobilité pour délégations officielles.',
    descEn: 'Protocol, security and mobility for official delegations.' },
  { id: 'tours', fr: 'Circuits & Expériences', en: 'Private Tours & Experiences', icon: 'map', image: '/corp-travel.webp',
    descFr: 'Versailles, Champagne, Normandie, châteaux — itinéraires privés.',
    descEn: 'Versailles, Champagne, Normandy, châteaux — private itineraries.' },
  { id: 'concierge', fr: 'Conciergerie', en: 'Concierge Services', icon: 'bell', image: '/why-phone.webp',
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
  trustFr: 'Maisons & partenaires de confiance',
  trustEn: 'Trusted houses & partners',
  logos: [
    { src: '/logo-ritz.webp', name: 'Ritz Paris' },
    { src: '/logo-bristol.webp', name: 'Le Bristol' },
    { src: '/logo-four-seasons.webp', name: 'Four Seasons' },
    { src: '/logo-mandarin.webp', name: 'Mandarin Oriental' },
    { src: '/logo-lvmh.webp', name: 'LVMH' },
    { src: '/logo-dior.webp', name: 'Dior' },
    { src: '/logo-kering.webp', name: 'Kering' },
    { src: '/logo-airfrance.webp', name: 'Air France' },
    { src: '/logo-netjets.webp', name: 'NetJets' },
    { src: '/logo-quintessentially.webp', name: 'Quintessentially' },
    { src: '/logo-amex.webp', name: 'American Express' },
    { src: '/logo-ak.webp', name: 'AK' },
  ],
};
