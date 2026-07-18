/**
 * Référentiel compagnies aériennes (codes IATA) — reconnaissance instantanée
 * du numéro de vol côté client, sans appel réseau.
 */
export const AIRLINES: Record<string, string> = {
  // France & Europe
  AF: 'Air France', TO: 'Transavia France', HV: 'Transavia', A5: 'HOP!',
  XK: 'Air Corsica', SS: 'Corsair', BF: 'French Bee', TX: 'Air Caraïbes',
  KL: 'KLM', BA: 'British Airways', LH: 'Lufthansa', LX: 'SWISS',
  OS: 'Austrian Airlines', SN: 'Brussels Airlines', LO: 'LOT Polish Airlines',
  TP: 'TAP Air Portugal', IB: 'Iberia', I2: 'Iberia Express', VY: 'Vueling',
  UX: 'Air Europa', AZ: 'ITA Airways', EN: 'Air Dolomiti', A3: 'Aegean Airlines',
  OA: 'Olympic Air', EI: 'Aer Lingus', AY: 'Finnair', SK: 'SAS',
  DY: 'Norwegian', D8: 'Norwegian', FI: 'Icelandair', LG: 'Luxair',
  U2: 'easyJet', EC: 'easyJet Europe', FR: 'Ryanair', RK: 'Ryanair UK',
  W6: 'Wizz Air', W4: 'Wizz Air Malta', PC: 'Pegasus Airlines', XQ: 'SunExpress',
  OK: 'Czech Airlines', RO: 'TAROM', BT: 'airBaltic', KM: 'Air Malta',
  // Moyen-Orient & Afrique
  TK: 'Turkish Airlines', EK: 'Emirates', QR: 'Qatar Airways', EY: 'Etihad Airways',
  SV: 'Saudia', MS: 'EgyptAir', RJ: 'Royal Jordanian', ME: 'Middle East Airlines',
  LY: 'El Al', AT: 'Royal Air Maroc', TU: 'Tunisair', AH: 'Air Algérie',
  BJ: 'Nouvelair', HC: 'Air Sénégal', ET: 'Ethiopian Airlines', KQ: 'Kenya Airways',
  GF: 'Gulf Air', KU: 'Kuwait Airways', WY: 'Oman Air', J2: 'Azerbaijan Airlines',
  // Amériques
  AA: 'American Airlines', DL: 'Delta Air Lines', UA: 'United Airlines',
  B6: 'JetBlue', AC: 'Air Canada', TS: 'Air Transat', WS: 'WestJet',
  LA: 'LATAM', AV: 'Avianca', CM: 'Copa Airlines', AM: 'Aeroméxico',
  AR: 'Aerolíneas Argentinas', G3: 'GOL', AD: 'Azul',
  // Asie & Océanie
  SQ: 'Singapore Airlines', CX: 'Cathay Pacific', JL: 'Japan Airlines',
  NH: 'ANA', KE: 'Korean Air', OZ: 'Asiana Airlines', CA: 'Air China',
  MU: 'China Eastern', CZ: 'China Southern', HU: 'Hainan Airlines',
  CI: 'China Airlines', BR: 'EVA Air', TG: 'Thai Airways', MH: 'Malaysia Airlines',
  GA: 'Garuda Indonesia', AI: 'Air India', '6E': 'IndiGo', UK: 'Vistara',
  VN: 'Vietnam Airlines', PR: 'Philippine Airlines', UL: 'SriLankan Airlines',
  PK: 'PIA', QF: 'Qantas', NZ: 'Air New Zealand', VA: 'Virgin Australia',
  VS: 'Virgin Atlantic',
};

/** Normalise un numéro de vol saisi ; null si le format est invalide. */
export function parseFlightNumber(raw: string): { code: string; num: string; iata: string; airline: string | null } | null {
  const s = raw.toUpperCase().replace(/[\s.-]/g, '');
  const m = /^([A-Z][A-Z0-9]|[0-9][A-Z])(\d{1,4})([A-Z]?)$/.exec(s);
  if (!m) return null;
  const code = m[1];
  return { code, num: m[2] + m[3], iata: code + m[2] + m[3], airline: AIRLINES[code] ?? null };
}
