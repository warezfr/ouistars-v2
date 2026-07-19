import { useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import { usePublished } from '@/lib/cms';
import { useAutoScroll } from '@/lib/useAutoScroll';
import './sections.css';

/** Événements & Congrès — split éditorial : image expressive encadrée + texte. */
export function Events({ onQuote }: { onQuote: () => void }) {
  const { lang, t } = useI18n();
  return (
    <>
      <section className="os-section os-ev" id="events">
        <div className="os-container">
          <div className="os-ev__grid">
            <Reveal>
              <figure className="os-ev__media">
                <img src="/why-paris-night.webp" alt={t.events.title} loading="lazy" />
                <figcaption><i>✦</i>{lang === 'fr' ? 'Paris, un soir de sommet' : 'Paris, summit night'}</figcaption>
              </figure>
            </Reveal>
            <Reveal>
              <div className="os-ev__content">
                <p className="os-eyebrow">{t.events.eyebrow}</p>
                <h2 className="os-ev__title">{t.events.title}</h2>
                <p className="os-lead os-ev__lead">{t.events.lead}</p>
                <ul className="os-ev__list">
                  {t.events.coordinate.map((c, i) => (
                    <li key={c}><i>{String(i + 1).padStart(2, '0')}</i>{c}</li>
                  ))}
                </ul>
                <button className="os-btn os-btn--gold" onClick={onQuote}>{t.events.cta}</button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <FashionWeeks />
      <DmcBand onQuote={onQuote} />
    </>
  );
}

/** Fashion Weeks — split miroir : texte à gauche, image expressive encadrée à droite. */
function FashionWeeks() {
  const { lang, t } = useI18n();
  return (
    <section className="os-section os-fw" id="fashion">
      <div className="os-container">
        <div className="os-fw__grid">
          <Reveal>
            <div className="os-fw__content">
              <p className="os-eyebrow">{t.fashion.eyebrow}</p>
              <h2 className="os-fw__title">{t.fashion.title}</h2>
              <p className="os-lead os-fw__lead">{t.fashion.lead}</p>
              <ul className="os-fw__points">
                {t.fashion.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <figure className="os-fw__media">
              <img src="/why-vip.webp" alt={t.fashion.title} loading="lazy" />
              <figcaption><i>✦</i>{lang === 'fr' ? 'Backstage, minute par minute' : 'Backstage, minute by minute'}</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Fiches Corporate & Institutions (rail auto + popup d'information). */
interface CorpItem { src: string; fr: string; en: string; descFr: string; descEn: string; tagFr: string; tagEn: string }
const CORP_ITEMS: CorpItem[] = [
  { src: '/corp-embassy.webp', fr: 'Ambassades & Délégations', en: 'Embassies & Delegations', tagFr: 'Protocole & préséances', tagEn: 'Protocol & precedence',
    descFr: 'Protocole, sécurité et discrétion pour délégations officielles : cortèges coordonnés, chauffeurs habilités, gestion des préséances et liaison avec les services de sécurité.',
    descEn: 'Protocol, security and discretion for official delegations: coordinated motorcades, vetted chauffeurs, precedence management and liaison with security services.' },
  { src: '/corp-corporate.webp', fr: 'Comptes Entreprises', en: 'Corporate Accounts', tagFr: 'Facturation centralisée', tagEn: 'Centralised billing',
    descFr: 'Facturation centralisée, reporting mensuel, politiques de voyage et interlocuteur dédié : la mobilité de vos équipes, sans friction administrative.',
    descEn: 'Centralised billing, monthly reporting, travel policies and a dedicated account manager: your teams’ mobility without administrative friction.' },
  { src: '/corp-travel.webp', fr: 'Agences de voyage & DMC', en: 'Travel Agencies & DMCs', tagFr: 'Marque blanche', tagEn: 'White label',
    descFr: 'Partenariats en marque blanche pour agences et DMC : tarifs négociés, disponibilité garantie et exécution irréprochable sous votre nom.',
    descEn: 'White-label partnerships for agencies and DMCs: negotiated rates, guaranteed availability and flawless execution under your name.' },
  { src: '/corp-aviation.webp', fr: 'Aviation Privée & d’Affaires', en: 'Private & Business Aviation', tagFr: 'FBO · Le Bourget', tagEn: 'FBO · Le Bourget',
    descFr: 'Assistance FBO, opérations au Bourget et coordination sol-air : vos passagers passent du jet au salon sans la moindre friction.',
    descEn: 'FBO assistance, Le Bourget operations and ground-to-air coordination: passengers move from jet to lounge without friction.' },
  { src: '/corp-hotel.webp', fr: 'Hôtels & Hospitality', en: 'Hotels & Hospitality', tagFr: 'Palaces & voituriers', tagEn: 'Palaces & valets',
    descFr: 'Partenariats palaces et gestion des flux clients VIP : voituriers, transferts invités et navettes événementielles au standard de votre maison.',
    descEn: 'Palace partnerships and VIP guest flows: valets, guest transfers and event shuttles to your house’s standard.' },
  { src: '/corp-chauffeur.webp', fr: 'Chauffeurs dédiés', en: 'Dedicated Chauffeurs', tagFr: 'À la semaine ou au mois', tagEn: 'Weekly or monthly',
    descFr: 'Un chauffeur attitré à la semaine ou au mois : mêmes visages, mêmes standards, connaissance intime de vos habitudes et de vos adresses.',
    descEn: 'A dedicated chauffeur by the week or month: same faces, same standards, intimate knowledge of your habits and addresses.' },
];

/** Bande Destination Management + Aviation Privée & Conciergerie (cartes image corp-*). */
function DmcBand({ onQuote }: { onQuote: () => void }) {
  const { lang, t } = useI18n();
  const corpRef = useRef<HTMLDivElement>(null);
  const [corpInfo, setCorpInfo] = useState<CorpItem | null>(null);
  const [corpAllOpen, setCorpAllOpen] = useState(false);
  useAutoScroll(corpRef, { speed: 0.45, paused: corpInfo !== null || corpAllOpen });
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

  return (
    <>
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

      </div>
    </section>

    {/* Corporate & Institutions — section à part entière, vitrine auto-défilante */}
    <section className="os-section" id="corporate">
      <Reveal>
        <div className="os-container">
          <div className="os-pk__head">
            <div>
              <p className="os-eyebrow">{t.corporate.eyebrow}</p>
              <h2 className="os-pk__title">
                {lang === 'fr' ? 'Des partenariats à la hauteur de vos exigences' : 'Partnerships that meet your standards'}
              </h2>
            </div>
            <div className="os-pk__headright">
              <span className="os-pk__hint">{lang === 'fr' ? 'Cliquez sur une fiche' : 'Click a card'}</span>
              <button type="button" className="os-gal__openbtn" onClick={() => setCorpAllOpen(true)}>
                {lang === 'fr' ? 'Tout afficher' : 'View all'}
                <i>{String(CORP_ITEMS.length).padStart(2, '0')}</i>
              </button>
            </div>
          </div>
        </div>
        <div className="os-pk__rail os-pk__rail--wide os-pk__rail--corp" ref={corpRef}>
          {[...CORP_ITEMS, ...CORP_ITEMS].map((c, i) => (
            <article key={`${c.src}-${i}`} className="os-pk__card os-pk__card--corp" onClick={() => setCorpInfo(c)}
              role="button" tabIndex={i < CORP_ITEMS.length ? 0 : -1}
              onKeyDown={(e) => e.key === 'Enter' && setCorpInfo(c)}>
              <img src={c.src} alt={lang === 'fr' ? c.fr : c.en} loading="lazy" />
              <div className="os-pk__scrim" aria-hidden />
              <span className="os-pk__num">{String((i % CORP_ITEMS.length) + 1).padStart(2, '0')}</span>
              <div className="os-pk__body">
                <h3 className="os-pk__route">{lang === 'fr' ? c.fr : c.en}</h3>
                <span className="os-pk__book">{lang === 'fr' ? c.tagFr : c.tagEn} →</span>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {/* Galerie « Tout afficher » — l'index complet des partenariats */}
      {corpAllOpen && (
        <div className="os-gal" role="dialog" aria-modal aria-label={t.corporate.eyebrow} onClick={() => setCorpAllOpen(false)}>
          <div className="os-gal__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setCorpAllOpen(false)} aria-label={t.common.close}>×</button>
            <header className="os-gal__head">
              <div>
                <p className="os-eyebrow">{t.corporate.eyebrow}</p>
                <h3 className="os-gal__title">
                  {lang === 'fr' ? 'Des partenariats à la hauteur de vos exigences' : 'Partnerships that meet your standards'}
                </h3>
              </div>
              <span className="os-gal__count">{String(CORP_ITEMS.length).padStart(2, '0')} {lang === 'fr' ? 'expertises' : 'areas of expertise'}</span>
            </header>
            <div className="os-gal__grid">
              {CORP_ITEMS.map((c, i) => (
                <article key={c.src} className={`os-gal__card${i === 0 ? ' os-gal__card--feat' : ''}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                  onClick={() => { setCorpAllOpen(false); setCorpInfo(c); }} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (setCorpAllOpen(false), setCorpInfo(c))}>
                  <div className="os-gal__media">
                    <img src={c.src} alt={lang === 'fr' ? c.fr : c.en} loading="lazy" />
                    <span className="os-gal__num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="os-gal__body">
                    <h4>{lang === 'fr' ? c.fr : c.en}</h4>
                    <p className="os-gal__desc">{lang === 'fr' ? c.descFr : c.descEn}</p>
                    <span className="os-gal__more">{lang === 'fr' ? c.tagFr : c.tagEn} →</span>
                  </div>
                </article>
              ))}
            </div>
            <footer className="os-gal__foot">
              <span>{lang === 'fr' ? 'Chaque partenariat s’accompagne d’un interlocuteur dédié.' : 'Every partnership comes with a dedicated account manager.'}</span>
              <a href="#corporate" onClick={() => { setCorpAllOpen(false); onQuote(); }}>{t.events.cta} →</a>
            </footer>
          </div>
        </div>
      )}

      {/* Popup fiche corporate */}
      {corpInfo && (
        <div className="os-dpop" role="dialog" aria-modal aria-label={lang === 'fr' ? corpInfo.fr : corpInfo.en} onClick={() => setCorpInfo(null)}>
          <div className="os-dpop__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setCorpInfo(null)} aria-label={t.common.close}>×</button>
            <div className="os-dpop__media">
              <img src={corpInfo.src} alt={lang === 'fr' ? corpInfo.fr : corpInfo.en} />
              <span className="os-dpop__chip">{t.corporate.eyebrow}</span>
            </div>
            <div className="os-dpop__body">
              <h3 className="os-dpop__title">{lang === 'fr' ? corpInfo.fr : corpInfo.en}</h3>
              <p className="os-dpop__desc">{lang === 'fr' ? corpInfo.descFr : corpInfo.descEn}</p>
              <button className="os-btn os-btn--gold os-dpop__cta"
                onClick={() => { setCorpInfo(null); onQuote(); }}>
                {t.events.cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
    </>
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
      <span className="os-about__ghost" aria-hidden>Maison</span>
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
    <section className="os-section os-faq2" id="faq">
      <div className="os-container">
        <div className="os-faq2__layout">
          <Reveal>
            <div className="os-faq2__intro">
              <p className="os-eyebrow">FAQ</p>
              <h2 className="os-faq2__title">{lang === 'fr' ? 'Questions fréquentes' : 'Frequently asked'}</h2>
              <p className="os-faq2__hint">
                {lang === 'fr'
                  ? 'Une autre question ? Notre conciergerie répond 24/7.'
                  : 'Another question? Our concierge answers 24/7.'}
              </p>
              <a className="os-faq2__contact" href="https://wa.me/33651030306" target="_blank" rel="noreferrer">
                WhatsApp · +33 6 51 03 03 06 →
              </a>
            </div>
          </Reveal>
          <Reveal>
            <div className="os-faq2__list">
              {items.map((f, i) => (
                <details key={f.q} className="os-faq2__item">
                  <summary>
                    <i>{String(i + 1).padStart(2, '0')}</i>
                    <span className="os-faq2__q">{f.q}</span>
                    <span className="os-faq2__plus" aria-hidden>+</span>
                  </summary>
                  <p className="os-faq2__a">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
