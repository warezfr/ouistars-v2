/**
 * Catalogue de services & navigation — repositionnement "Premium Mobility,
 * Destination Management & Event Solutions" (consigne 16/07/2026).
 */

export interface NavItem {
  id: string;
  fr: string;
  en: string;
  es: string;
  ru: string;
  ar: string;
  href: string;
}

/** Nouveau menu principal (consigne) — libellés compacts, un mot par entrée. */
export const MAIN_NAV: NavItem[] = [
  { id: 'mobility', fr: 'Mobilité', en: 'Mobility', es: 'Movilidad', ru: 'Мобильность', ar: 'التنقّل', href: '#mobility' },
  { id: 'dmc', fr: 'DMC', en: 'DMC', es: 'DMC', ru: 'DMC', ar: 'DMC', href: '#dmc' },
  { id: 'fleet', fr: 'Flotte', en: 'Fleet', es: 'Flota', ru: 'Автопарк', ar: 'الأسطول', href: '#fleet' },
  { id: 'meet-greet', fr: 'Aéroports', en: 'Airports', es: 'Aeropuertos', ru: 'Аэропорты', ar: 'المطارات', href: '#meet-greet' },
  { id: 'events', fr: 'Événements', en: 'Events', es: 'Eventos', ru: 'События', ar: 'الفعاليات', href: '#events' },
  { id: 'tours', fr: 'Circuits', en: 'Tours', es: 'Circuitos', ru: 'Маршруты', ar: 'الجولات', href: '#tours' },
  { id: 'contact', fr: 'Contact', en: 'Contact', es: 'Contacto', ru: 'Контакты', ar: 'اتصل بنا', href: '#contact' },
];

export interface ServiceItem {
  id: string;
  fr: string;
  en: string;
  es?: string;
  ru?: string;
  ar?: string;
  descFr: string;
  descEn: string;
  descEs?: string;
  descRu?: string;
  descAr?: string;
  icon: string; // clé d'icône (SVG inline)
  image: string; // image de fond (asset /public)
}

/**
 * Catalogue de services (consigne 16/07/2026) — entrée "Transport de Luxe"
 * retirée. Chaque service porte une image de fond dédiée.
 */
export const SERVICES: ServiceItem[] = [
  { id: 'fleet-ops', fr: 'Gestion de Flotte', en: 'Fleet Operations', es: 'Gestión de Flota', ru: 'Управление автопарком', ar: 'إدارة الأسطول', icon: 'fleet', image: '/corp-chauffeur.webp',
    descFr: 'Coordination de flottes pour délégations, tournées et opérations d’envergure.',
    descEn: 'Fleet coordination for delegations, tours and large-scale operations.',
    descEs: 'Coordinación de flotas para delegaciones, giras y operaciones de gran escala.', descRu: 'Координация автопарков для делегаций, туров и масштабных операций.', descAr: 'تنسيق الأساطيل للوفود والجولات والعمليات الكبرى.' },
  { id: 'dmc', fr: 'Destination Management', en: 'Destination Management', es: 'Destination Management', ru: 'Destination Management', ar: 'إدارة الوجهات', icon: 'globe', image: '/why-map.webp',
    descFr: 'Organisation locale complète : logistique, itinéraires, expériences sur mesure.',
    descEn: 'Full local orchestration: logistics, itineraries, bespoke experiences.',
    descEs: 'Organización local completa: logística, itinerarios, experiencias a medida.', descRu: 'Полная локальная организация: логистика, маршруты, индивидуальные впечатления.', descAr: 'تنظيم محلي كامل: لوجستيات، مسارات وتجارب مخصصة.' },
  { id: 'meet-greet', fr: 'Airport Meet & Greeter', en: 'Airport Meet & Greeter', es: 'Meet & Greeter Aeropuertos', ru: 'Meet & Greeter в аэропортах', ar: 'استقبال ومرافقة في المطارات', icon: 'plane', image: '/why-airport.webp',
    descFr: 'Accueil à la porte de l’avion, Fast Track et assistance jusqu’à la sortie.',
    descEn: 'Welcome at the aircraft door, Fast Track and assistance to the exit.',
    descEs: 'Recibimiento en la puerta del avión, Fast Track y asistencia hasta la salida.', descRu: 'Встреча у трапа, Fast Track и сопровождение до выхода.', descAr: 'استقبال عند باب الطائرة، مسار سريع ومساعدة حتى الخروج.' },
  { id: 'events', fr: 'Événements & Congrès', en: 'Events & Congresses', es: 'Eventos & Congresos', ru: 'Мероприятия и конгрессы', ar: 'الفعاليات والمؤتمرات', icon: 'star', image: '/why-paris-night.webp',
    descFr: 'Mobilité coordonnée pour congrès, sommets et événements privés.',
    descEn: 'Coordinated mobility for congresses, summits and private events.',
    descEs: 'Movilidad coordinada para congresos, cumbres y eventos privados.', descRu: 'Слаженная мобильность для конгрессов, саммитов и частных мероприятий.', descAr: 'تنقّل منسّق للمؤتمرات والقمم والفعاليات الخاصة.' },
  { id: 'fashion', fr: 'Fashion Weeks', en: 'Fashion Weeks', es: 'Fashion Weeks', ru: 'Недели моды', ar: 'أسابيع الموضة', icon: 'sparkle', image: 'https://images.unsplash.com/photo-1543728069-a3f97c5a2f32?w=1600&q=78&auto=format',
    descFr: 'Logistique dédiée aux maisons, mannequins et invités durant les Fashion Weeks.',
    descEn: 'Dedicated logistics for houses, models and guests during Fashion Weeks.',
    descEs: 'Logística dedicada a casas de moda, modelos e invitados durante las Fashion Weeks.', descRu: 'Выделенная логистика для домов моды, моделей и гостей во время Недель моды.', descAr: 'لوجستيات مخصصة لدور الأزياء والعارضين والضيوف خلال أسابيع الموضة.' },
  { id: 'corporate', fr: 'Mobilité Corporate', en: 'Corporate Mobility', es: 'Movilidad Corporativa', ru: 'Корпоративная мобильность', ar: 'تنقّل الشركات', icon: 'briefcase', image: '/corp-corporate.webp',
    descFr: 'Comptes entreprises, facturation centralisée et reporting.',
    descEn: 'Corporate accounts, centralized billing and reporting.',
    descEs: 'Cuentas de empresa, facturación centralizada e informes.', descRu: 'Корпоративные счета, единая фактурация и отчётность.', descAr: 'حسابات الشركات، فوترة مركزية وتقارير.' },
  { id: 'private-aviation', fr: 'Aviation Privée', en: 'Private Aviation Solutions', es: 'Aviación Privada', ru: 'Частная авиация', ar: 'الطيران الخاص', icon: 'jet', image: '/corp-aviation.webp',
    descFr: 'Coordination sol-air pour jets privés et aviation d’affaires.',
    descEn: 'Ground-to-air coordination for private jets and business aviation.',
    descEs: 'Coordinación tierra-aire para jets privados y aviación de negocios.', descRu: 'Координация «земля-воздух» для частных джетов и деловой авиации.', descAr: 'تنسيق بري-جوي للطائرات الخاصة وطيران الأعمال.' },
  { id: 'business-aviation', fr: 'Support Aviation d’Affaires', en: 'Business Aviation Support', es: 'Soporte Aviación de Negocios', ru: 'Поддержка деловой авиации', ar: 'دعم طيران الأعمال', icon: 'jet', image: '/corp-chauffeur.webp',
    descFr: 'Assistance FBO, handling et transferts confidentiels.',
    descEn: 'FBO assistance, handling and confidential transfers.',
    descEs: 'Asistencia FBO, handling y traslados confidenciales.', descRu: 'FBO-сопровождение, хендлинг и конфиденциальные трансферы.', descAr: 'مساعدة FBO ومناولة وتوصيلات سرّية.' },
  { id: 'hospitality', fr: 'Hôtels & Hospitality', en: 'Hotels & Hospitality', es: 'Hoteles & Hospitality', ru: 'Отели и гостеприимство', ar: 'الفنادق والضيافة', icon: 'building', image: '/corp-hotel.webp',
    descFr: 'Partenariats palaces et gestion des flux clients VIP.',
    descEn: 'Palace partnerships and VIP guest flow management.',
    descEs: 'Alianzas con grandes hoteles y gestión de flujos de clientes VIP.', descRu: 'Партнёрства с дворцовыми отелями и управление потоками VIP-гостей.', descAr: 'شراكات مع الفنادق الفاخرة وإدارة تدفق كبار الضيوف.' },
  { id: 'embassies', fr: 'Ambassades & Délégations', en: 'Embassies & Official Delegations', es: 'Embajadas & Delegaciones', ru: 'Посольства и делегации', ar: 'السفارات والوفود', icon: 'shield', image: '/corp-embassy.webp',
    descFr: 'Protocole, sécurité et mobilité pour délégations officielles.',
    descEn: 'Protocol, security and mobility for official delegations.',
    descEs: 'Protocolo, seguridad y movilidad para delegaciones oficiales.', descRu: 'Протокол, безопасность и мобильность для официальных делегаций.', descAr: 'بروتوكول وأمن وتنقّل للوفود الرسمية.' },
  { id: 'tours', fr: 'Circuits & Expériences', en: 'Private Tours & Experiences', es: 'Circuitos & Experiencias', ru: 'Маршруты и впечатления', ar: 'الجولات والتجارب', icon: 'map', image: '/corp-travel.webp',
    descFr: 'Versailles, Champagne, Normandie, châteaux — itinéraires privés.',
    descEn: 'Versailles, Champagne, Normandy, châteaux — private itineraries.',
    descEs: 'Versalles, Champaña, Normandía, castillos — itinerarios privados.', descRu: 'Версаль, Шампань, Нормандия, замки — частные маршруты.', descAr: 'فرساي، الشامبانيا، النورماندي والقلاع — مسارات خاصة.' },
  { id: 'concierge', fr: 'Conciergerie', en: 'Concierge Services', es: 'Conserjería', ru: 'Консьерж-сервис', ar: 'الكونسيرج', icon: 'bell', image: '/why-phone.webp',
    descFr: 'Demandes sur mesure, réservations et coordination 24/7.',
    descEn: 'Bespoke requests, reservations and 24/7 coordination.',
    descEs: 'Peticiones a medida, reservas y coordinación 24/7.', descRu: 'Индивидуальные запросы, бронирования и координация 24/7.', descAr: 'طلبات مخصصة وحجوزات وتنسيق على مدار الساعة.' },
];

/** Section "Prestigieuses Adresses" (remplace les marques mondiales — consigne). */
export const PRESTIGIOUS_ADDRESSES = {
  eyebrow: {
    fr: 'Nous opérons à travers', en: 'We operate across', es: 'Operamos en',
    ru: 'Мы работаем по адресам', ar: 'نعمل عبر',
  },
  title: {
    fr: 'Les Plus Prestigieuses Adresses de France', en: 'France’s Most Prestigious Addresses',
    es: 'Las direcciones más prestigiosas de Francia', ru: 'Самые престижные адреса Франции',
    ar: 'أرقى عناوين فرنسا',
  },
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
  trust: {
    fr: 'Maisons & partenaires de confiance', en: 'Trusted houses & partners',
    es: 'Casas & socios de confianza', ru: 'Дома и партнёры, которым доверяют',
    ar: 'دور وشركاء موثوقون',
  },
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
