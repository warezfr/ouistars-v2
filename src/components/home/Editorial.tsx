import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import { usePublished } from '@/lib/cms';
import './sections.css';

/** Bandeau Événements — image de fond fixe + voile noir, aside "verre fumé". */
export function Events({ onQuote }: { onQuote: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <section
        className="os-section relative overflow-hidden border-y border-gold-deep/20 bg-cover bg-fixed bg-center"
        style={{ backgroundImage: "url('/why-paris-night.webp')" }}
        id="events"
      >
        <div className="absolute inset-0 bg-night/82" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/70 to-transparent" aria-hidden />
        <div className="os-container os-band__grid relative">
          <Reveal>
            <p className="os-eyebrow">{t.events.eyebrow}</p>
            <h2>{t.events.title}</h2>
            <p className="os-lead">{t.events.lead}</p>
            <button className="os-btn os-btn--gold" onClick={onQuote}>{t.events.cta}</button>
          </Reveal>
          <Reveal>
            <div className="os-events__aside">
              <p className="os-events__asidetitle">{t.events.coordinateTitle}</p>
              <ul className="os-events__list">
                {t.events.coordinate.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <FashionWeeks />
      <DmcBand />
    </>
  );
}

/** Section dédiée Fashion Weeks (retirée du menu) — image de fond + éditorial. */
function FashionWeeks() {
  const { t } = useI18n();
  return (
    <section
      className="os-section os-fashion relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/why-vip.webp')" }}
      id="fashion"
    >
      <div className="absolute inset-0 bg-night/78" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/85" aria-hidden />
      <div className="os-container relative">
        <div className="os-fashion__inner">
          <Reveal>
            <p className="os-eyebrow">{t.fashion.eyebrow}</p>
            <h2 className="os-fashion__title">{t.fashion.title}</h2>
            <p className="os-lead os-fashion__lead">{t.fashion.lead}</p>
            <ul className="os-fashion__points">
              {t.fashion.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Bande Destination Management + Aviation Privée & Conciergerie (cartes image corp-*). */
function DmcBand() {
  const { lang, t } = useI18n();
  const dmcPoints = lang === 'fr'
    ? [
        'Organisation locale & logistique de terrain',
        'Itinéraires & expériences sur mesure',
        'Sélection hôtelière, palaces & hospitality',
        'Protocole ambassades & délégations officielles',
      ]
    : [
        'Local organisation & ground logistics',
        'Bespoke itineraries & experiences',
        'Hotel selection, palaces & hospitality',
        'Embassy protocol & official delegations',
      ];

  const corpTiles = [
    { src: '/corp-embassy.webp', label: t.corporate.embassy },
    { src: '/corp-corporate.webp', label: t.corporate.accounts },
    { src: '/corp-travel.webp', label: t.corporate.travel },
  ];

  return (
    <section className="os-section" id="dmc-band">
      <div className="os-container">
        <div className="os-band__grid">
          <Reveal>
            <p className="os-eyebrow">Destination Management</p>
            <h2>{lang === 'fr' ? 'Votre partenaire local, partout en France' : 'Your local partner, across France'}</h2>
            <p className="os-lead">
              {lang === 'fr'
                ? 'Oui Stars conçoit et orchestre vos programmes sur place : une seule maison, un seul interlocuteur — de l’arrivée à l’aéroport au dernier dîner.'
                : 'Oui Stars designs and orchestrates your programmes on the ground: one house, one point of contact — from airport arrival to the final dinner.'}
            </p>
            <ul className="os-dmcband__list">
              {dmcPoints.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Reveal>
          <Reveal>
            <div className="grid gap-4">
              <ImageCard
                src="/corp-aviation.webp"
                title={lang === 'fr' ? 'Aviation Privée & d’Affaires' : 'Private & Business Aviation'}
                text={lang === 'fr'
                  ? 'Assistance FBO, opérations au Bourget et coordination sol-air : vos passagers passent du jet au salon sans la moindre friction.'
                  : 'FBO assistance, Le Bourget operations and ground-to-air coordination: your passengers move from jet to lounge without a single friction.'}
              />
              <ImageCard
                src="/corp-hotel.webp"
                title={lang === 'fr' ? 'Conciergerie' : 'Concierge'}
                text={lang === 'fr'
                  ? 'Réservations, demandes sur mesure et coordination 24/7 — notre conciergerie prolonge chaque trajet en expérience.'
                  : 'Reservations, bespoke requests and 24/7 coordination — our concierge turns every journey into an experience.'}
              />
            </div>
          </Reveal>
        </div>

        {/* Bande Corporate & Institutions — tuiles image */}
        <Reveal>
          <div className="mt-16">
            <p className="os-eyebrow">{t.corporate.eyebrow}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {corpTiles.map((c) => (
                <figure key={c.src} className="group relative m-0 aspect-[16/9] overflow-hidden rounded-2xl border border-gold-deep/20">
                  <img
                    src={c.src}
                    alt={c.label}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" aria-hidden />
                  <figcaption className="absolute inset-x-4 bottom-3 font-display text-[1.1rem] text-ivory">
                    {c.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Carte horizontale image + texte (aviation, conciergerie…). */
function ImageCard({ src, title, text }: { src: string; title: string; text: string }) {
  return (
    <article className="group grid overflow-hidden rounded-2xl border border-gold-deep/20 bg-surface/60 transition-colors duration-500 hover:border-gold-deep/60 sm:grid-cols-[190px_1fr]">
      <div className="relative min-h-[130px] overflow-hidden">
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="os-card-title font-display text-ivory">{title}</h3>
        <p className="os-small os-flush">{text}</p>
      </div>
    </article>
  );
}

/** La maison — éditorial deux colonnes : image + texte, filet doré, chiffres-clés. */
export function About() {
  const { t } = useI18n();
  return (
    <section className="os-section os-about" id="about">
      <div className="os-container">
        <div className="os-about__grid">
          <Reveal>
            <figure className="os-about__media">
              <img src="/why-interior.webp" alt="Oui Stars" loading="lazy" />
            </figure>
          </Reveal>
          <Reveal>
            <div className="os-about__content">
              <p className="os-eyebrow">{t.about.eyebrow}</p>
              <h2 className="os-about__name">{t.about.name}</h2>
              <span className="os-about__rule" aria-hidden />
              <p className="os-lead">{t.about.body}</p>
              <div className="os-about__stats">
                {t.about.stats.map((s) => (
                  <div className="os-about__stat" key={s.label}>
                    <b>{s.value}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  { q: 'Les tarifs affichés sont-ils TTC ?', a: 'Oui, tous les prix de la grille 2026-2027 sont affichés TTC, par transfert dans un sens ou dans l’autre.' },
  { q: 'Un aller-retour, comment est-il facturé ?', a: 'Un aller-retour est facturé comme deux transferts distincts.' },
  { q: 'Le Meet & Greeter inclut-il le véhicule ?', a: 'Non. Le service Meet & Greeter n’inclut ni le véhicule ni le chauffeur : le transport se réserve et se facture séparément.' },
  { q: 'Quelle est la durée minimale d’une mise à disposition ?', a: 'Les mises à disposition horaires requièrent un minimum de 3 heures consécutives.' },
  { q: 'Des suppléments peuvent-ils s’appliquer ?', a: 'Oui. L’attente supplémentaire, les arrêts additionnels, le parking, les péages, les services de nuit et les périodes d’événements peuvent entraîner des frais additionnels, toujours annoncés en amont.' },
  { q: 'Opérez-vous partout en France ?', a: 'Oui — nos opérations sont nationales : Paris et Île-de-France, Côte d’Azur, et l’ensemble du territoire pour vos transferts, tournées et événements.' },
];

export function Faq() {
  const { lang } = useI18n();
  const items = usePublished<{ q: string; a: string }>('faq', FAQ_ITEMS);
  return (
    <section className="os-section" id="faq">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">FAQ</p>
          <h2>{lang === 'fr' ? 'Questions fréquentes' : 'Frequently asked'}</h2>
        </Reveal>
        <div style={{ marginTop: 30, maxWidth: 760 }}>
          {items.map((f) => (
            <details key={f.q} className="os-faq__item">
              <summary className="os-faq__q">{f.q}<span>+</span></summary>
              <p className="os-faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
