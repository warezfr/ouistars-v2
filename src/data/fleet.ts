/** Flotte Oui Stars (aligne les classes tarifaires E / V / S + électrique et minibus). */

export interface FleetVehicle {
  id: string;
  name: string;
  category: 'business' | 'business_van' | 'first' | 'electro_business' | 'minibus';
  className: 'E-Class' | 'V-Class' | 'S-Class' | 'EQE' | 'Sprinter';
  image: string;
  seats: number;
  luggage: number;
  descFr: string;
}

/** Noms & descriptions multilingues des véhicules du catalogue statique
    (les fiches CMS restent affichées telles quelles). */
export const FLEET_I18N: Record<string, { name: Record<'fr' | 'en' | 'es' | 'ru' | 'ar', string>; desc: Record<'fr' | 'en' | 'es' | 'ru' | 'ar', string> }> = {
  'e-class': {
    name: { fr: 'Mercedes Classe E', en: 'Mercedes E-Class', es: 'Mercedes Clase E', ru: 'Mercedes E-класс', ar: 'مرسيدس الفئة E' },
    desc: {
      fr: 'Berline d’affaires — la référence discrète et confortable.',
      en: 'Business saloon — the discreet, comfortable benchmark.',
      es: 'Berlina de negocios — la referencia discreta y confortable.',
      ru: 'Бизнес-седан — эталон сдержанного комфорта.',
      ar: 'سيدان أعمال — المرجع الهادئ والمريح.',
    },
  },
  'v-class': {
    name: { fr: 'Mercedes Classe V', en: 'Mercedes V-Class', es: 'Mercedes Clase V', ru: 'Mercedes V-класс', ar: 'مرسيدس الفئة V' },
    desc: {
      fr: 'Van premium pour familles, groupes et bagages volumineux.',
      en: 'Premium van for families, groups and bulky luggage.',
      es: 'Van premium para familias, grupos y equipaje voluminoso.',
      ru: 'Премиальный вэн для семей, групп и объёмного багажа.',
      ar: 'فان فاخر للعائلات والمجموعات والأمتعة الكبيرة.',
    },
  },
  's-class': {
    name: { fr: 'Mercedes Classe S', en: 'Mercedes S-Class', es: 'Mercedes Clase S', ru: 'Mercedes S-класс', ar: 'مرسيدس الفئة S' },
    desc: {
      fr: 'Première classe — raffinement absolu pour vos trajets d’exception.',
      en: 'First class — absolute refinement for your most exceptional journeys.',
      es: 'Primera clase — refinamiento absoluto para sus trayectos de excepción.',
      ru: 'Первый класс — абсолютная изысканность для особых поездок.',
      ar: 'الدرجة الأولى — رقيّ مطلق لرحلاتكم الاستثنائية.',
    },
  },
  maybach: {
    name: { fr: 'Mercedes-Maybach', en: 'Mercedes-Maybach', es: 'Mercedes-Maybach', ru: 'Mercedes-Maybach', ar: 'مرسيدس-مايباخ' },
    desc: {
      fr: 'Le summum du luxe automobile pour vos invités les plus prestigieux.',
      en: 'The pinnacle of automotive luxury for your most prestigious guests.',
      es: 'La cima del lujo automovilístico para sus invitados más prestigiosos.',
      ru: 'Вершина автомобильной роскоши для самых почётных гостей.',
      ar: 'قمة الفخامة في عالم السيارات لضيوفكم الأرفع مقاماً.',
    },
  },
  eqe: {
    name: { fr: 'Mercedes-Benz EQE', en: 'Mercedes-Benz EQE', es: 'Mercedes-Benz EQE', ru: 'Mercedes-Benz EQE', ar: 'مرسيدس-بنز EQE' },
    desc: {
      fr: 'Électrique d’affaires — élégance silencieuse et responsable.',
      en: 'Electric business class — silent, responsible elegance.',
      es: 'Eléctrico de negocios — elegancia silenciosa y responsable.',
      ru: 'Электрический бизнес-класс — тихая и ответственная элегантность.',
      ar: 'كهربائية للأعمال — أناقة صامتة ومسؤولة.',
    },
  },
  sprinter: {
    name: { fr: 'Mercedes Sprinter', en: 'Mercedes Sprinter', es: 'Mercedes Sprinter', ru: 'Mercedes Sprinter', ar: 'مرسيدس سبرينتر' },
    desc: {
      fr: 'Minibus pour délégations et groupes jusqu’à 12 passagers.',
      en: 'Minibus for delegations and groups of up to 12 passengers.',
      es: 'Minibús para delegaciones y grupos de hasta 12 pasajeros.',
      ru: 'Микроавтобус для делегаций и групп до 12 пассажиров.',
      ar: 'حافلة صغيرة للوفود والمجموعات حتى 12 راكباً.',
    },
  },
};

export const FLEET: FleetVehicle[] = [
  { id: 'e-class', image: '/fleet-eclass.png', name: 'Mercedes Classe E', category: 'business', className: 'E-Class', seats: 3, luggage: 3,
    descFr: 'Berline d’affaires — la référence discrète et confortable.' },
  { id: 'v-class', image: '/fleet-vclass.png', name: 'Mercedes Classe V', category: 'business_van', className: 'V-Class', seats: 7, luggage: 7,
    descFr: 'Van premium pour familles, groupes et bagages volumineux.' },
  { id: 's-class', image: '/fleet-sclass.png', name: 'Mercedes Classe S', category: 'first', className: 'S-Class', seats: 2, luggage: 2,
    descFr: 'Première classe — raffinement absolu pour vos trajets d’exception.' },
  { id: 'maybach', image: '/fleet-maybach.png', name: 'Mercedes-Maybach', category: 'first', className: 'S-Class', seats: 2, luggage: 2,
    descFr: 'Le summum du luxe automobile pour vos invités les plus prestigieux.' },
  { id: 'eqe', image: '/fleet-electric.png', name: 'Mercedes-Benz EQE', category: 'electro_business', className: 'EQE', seats: 3, luggage: 3,
    descFr: 'Électrique d’affaires — élégance silencieuse et responsable.' },
  { id: 'sprinter', image: '/fleet-sprinter.png', name: 'Mercedes Sprinter', category: 'minibus', className: 'Sprinter', seats: 12, luggage: 12,
    descFr: 'Minibus pour délégations et groupes jusqu’à 12 passagers.' },
];
