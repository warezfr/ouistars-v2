/**
 * Grille tarifaire officielle Oui Stars 2026–2027.
 * Source: consigne "consigne mail v1" (16/07/2026).
 * Règles: tous prix TTC, par transfert (aller OU retour), même tarif dans les deux sens.
 * CDG / ORY / LBG = tarifs "Aéroports Paris". Beauvais (BVA) = tarifs séparés.
 */

export type VehicleClass = 'E' | 'V' | 'S';

export interface VehicleClassInfo {
  code: VehicleClass;
  name: string;
  example: string;
  seats: number;
  luggage: number;
}

export const VEHICLE_CLASSES: Record<VehicleClass, VehicleClassInfo> = {
  E: { code: 'E', name: 'E-Class', example: 'Mercedes Classe E', seats: 3, luggage: 3 },
  V: { code: 'V', name: 'V-Class', example: 'Mercedes Classe V', seats: 7, luggage: 7 },
  S: { code: 'S', name: 'S-Class', example: 'Mercedes Classe S / Maybach', seats: 2, luggage: 2 },
};

export type RouteCategory =
  | 'airport'
  | 'city'
  | 'station'
  | 'tour'
  | 'riviera'
  | 'city-to-city';

export interface RouteRate {
  id: string;
  label: string;
  category: RouteCategory;
  /** Prix TTC par classe, valable dans les deux sens. */
  prices: Record<VehicleClass, number>;
  note?: string;
}

/** Trajets à tarif fixe (grille officielle). */
export const ROUTE_RATES: RouteRate[] = [
  // --- Paris & Île-de-France ---
  { id: 'cdg-ory-lbg-paris', label: 'Aéroports Paris (CDG • ORY • LBG) ⇄ Paris', category: 'airport', prices: { E: 120, V: 130, S: 210 } },
  { id: 'bva-paris', label: 'Beauvais (BVA) ⇄ Paris', category: 'airport', prices: { E: 240, V: 250, S: 320 } },
  { id: 'paris-paris', label: 'Paris ⇄ Paris (intra-muros)', category: 'city', prices: { E: 100, V: 110, S: 140 } },
  { id: 'paris-disneyland', label: 'Paris ⇄ Disneyland', category: 'tour', prices: { E: 150, V: 170, S: 210 } },
  { id: 'paris-versailles', label: 'Paris ⇄ Versailles', category: 'tour', prices: { E: 110, V: 120, S: 190 } },
  { id: 'airports-versailles', label: 'Aéroports Paris ⇄ Versailles', category: 'airport', prices: { E: 150, V: 170, S: 220 } },
  // --- Gares de Paris ---
  { id: 'paris-stations', label: 'Paris ⇄ Gares (Nord, Est, Lyon, Montparnasse)', category: 'station', prices: { E: 100, V: 110, S: 160 } },
  { id: 'stations-airports', label: 'Gares Paris ⇄ Aéroports Paris', category: 'station', prices: { E: 140, V: 150, S: 230 } },
  { id: 'stations-disneyland', label: 'Gares Paris ⇄ Disneyland', category: 'station', prices: { E: 170, V: 190, S: 230 } },
  // --- Côte d'Azur ---
  { id: 'nce-nice', label: 'Nice (NCE) ⇄ Nice ville', category: 'riviera', prices: { E: 120, V: 130, S: 200 } },
  { id: 'nce-monaco', label: 'Nice (NCE) ⇄ Monaco', category: 'riviera', prices: { E: 200, V: 220, S: 250 } },
  { id: 'nice-st-tropez', label: 'Nice ⇄ Saint-Tropez', category: 'riviera', prices: { E: 350, V: 370, S: 450 } },
  // --- City-to-city populaires depuis Paris (E = V) ---
  { id: 'paris-giverny', label: 'Paris ⇄ Giverny', category: 'city-to-city', prices: { E: 280, V: 280, S: 360 } },
  { id: 'paris-rouen', label: 'Paris ⇄ Rouen', category: 'city-to-city', prices: { E: 490, V: 490, S: 630 } },
  { id: 'paris-reims', label: 'Paris ⇄ Reims', category: 'city-to-city', prices: { E: 520, V: 520, S: 670 } },
  { id: 'paris-epernay', label: 'Paris ⇄ Épernay', category: 'city-to-city', prices: { E: 600, V: 600, S: 770 } },
  { id: 'paris-deauville', label: 'Paris ⇄ Deauville', category: 'city-to-city', prices: { E: 770, V: 770, S: 990 } },
  { id: 'paris-honfleur', label: 'Paris ⇄ Honfleur', category: 'city-to-city', prices: { E: 820, V: 820, S: 1050 } },
  { id: 'paris-le-havre', label: 'Paris ⇄ Le Havre', category: 'city-to-city', prices: { E: 840, V: 840, S: 1080 } },
  { id: 'paris-etretat', label: 'Paris ⇄ Étretat', category: 'city-to-city', prices: { E: 910, V: 910, S: 1170 } },
  { id: 'paris-mont-saint-michel', label: 'Paris ⇄ Mont-Saint-Michel', category: 'city-to-city', prices: { E: 1260, V: 1260, S: 1620 } },
];

/** Tarif horaire (mise à disposition), minimum 3 heures consécutives. */
export const HOURLY_RATES: Record<VehicleClass, number> = { E: 80, V: 90, S: 110 };
export const HOURLY_MIN_HOURS = 3;

/** Tarif au kilomètre pour les autres city-to-city (à partir de). */
export const PER_KM_RATES: Record<VehicleClass, number> = { E: 3.5, V: 3.5, S: 4.5 };

/** Meet & Greeter — hors véhicule et chauffeur (à réserver séparément). */
export interface MeetGreetRate {
  id: string;
  airport: string;
  base: number | null;
  includedPax: number;
  includedBags: number;
  extraPaxSurcharge: number | null;
}

export const MEET_GREET_RATES: MeetGreetRate[] = [
  { id: 'cdg-ory', airport: 'Paris — CDG & ORY', base: 280, includedPax: 3, includedBags: 3, extraPaxSurcharge: 50 },
  { id: 'nce', airport: 'Nice — NCE', base: 320, includedPax: 3, includedBags: 3, extraPaxSurcharge: 70 },
  { id: 'lbg', airport: 'Paris-Le Bourget — LBG', base: null, includedPax: 3, includedBags: 3, extraPaxSurcharge: null },
];

export const MEET_GREET_INCLUDES = [
  'Accueil directement à la porte de l’avion',
  'Accès prioritaire Fast Track',
  'Assistance au passage des contrôles de police aux frontières',
  'Assistance à la récupération des bagages',
  'Accompagnement des passagers jusqu’à la sortie du terminal',
  'Coordination avec le service de transport réservé séparément',
];

export const MEET_GREET_DISCLAIMER =
  'Le tarif du service Meet & Greeter n’inclut ni le véhicule ni le chauffeur. Le transport doit être réservé et facturé séparément.';

/** Version multilingue de la liste incluse + avertissement (affichage front). */
export const MEET_GREET_INCLUDES_I18N: Record<'fr' | 'en' | 'es' | 'ru' | 'ar', string[]> = {
  fr: MEET_GREET_INCLUDES,
  en: [
    'Welcome directly at the aircraft door',
    'Priority Fast Track access',
    'Assistance through border police controls',
    'Assistance with luggage retrieval',
    'Escort of passengers to the terminal exit',
    'Coordination with the separately booked transport service',
  ],
  es: [
    'Recibimiento directamente en la puerta del avión',
    'Acceso prioritario Fast Track',
    'Asistencia en los controles de la policía de fronteras',
    'Asistencia en la recogida del equipaje',
    'Acompañamiento de los pasajeros hasta la salida de la terminal',
    'Coordinación con el servicio de transporte reservado por separado',
  ],
  ru: [
    'Встреча прямо у трапа самолёта',
    'Приоритетный проход Fast Track',
    'Сопровождение при прохождении пограничного контроля',
    'Помощь с получением багажа',
    'Сопровождение пассажиров до выхода из терминала',
    'Координация с отдельно забронированным транспортом',
  ],
  ar: [
    'استقبال مباشرة عند باب الطائرة',
    'دخول أولوية عبر المسار السريع',
    'مساعدة عند عبور مراقبة شرطة الحدود',
    'مساعدة في استلام الأمتعة',
    'مرافقة الركاب حتى مخرج الصالة',
    'تنسيق مع خدمة النقل المحجوزة بشكل منفصل',
  ],
};

export const MEET_GREET_DISCLAIMER_I18N: Record<'fr' | 'en' | 'es' | 'ru' | 'ar', string> = {
  fr: MEET_GREET_DISCLAIMER,
  en: 'The Meet & Greeter fare includes neither the vehicle nor the chauffeur. Transport must be booked and billed separately.',
  es: 'La tarifa del servicio Meet & Greeter no incluye ni el vehículo ni el chófer. El transporte debe reservarse y facturarse por separado.',
  ru: 'Тариф услуги Meet & Greeter не включает ни автомобиль, ни шофёра. Транспорт бронируется и оплачивается отдельно.',
  ar: 'سعر خدمة الاستقبال والمرافقة لا يشمل السيارة ولا السائق. يجب حجز النقل ودفعه بشكل منفصل.',
};

export const PRICING_NOTES = [
  'Tous les prix affichés sont TTC.',
  'Chaque prix s’applique à un transfert dans un sens ou dans l’autre.',
  'Un aller-retour est facturé comme deux transferts distincts.',
  'CDG, ORY et Le Bourget utilisent les mêmes tarifs aéroports Paris.',
  'L’aéroport de Beauvais dispose de tarifs séparés.',
  'Les mises à disposition horaires requièrent un minimum de 3 heures consécutives.',
  'Attente supplémentaire, arrêts additionnels, parking, péages, services de nuit et périodes d’événements peuvent entraîner des frais additionnels.',
  'Le tarif final peut varier selon l’itinéraire, la disponibilité et les contraintes opérationnelles.',
];

export const PRICE_LIST_VERSION = '2026-2027';
