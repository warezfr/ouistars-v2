import { useState } from 'react';
import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './pricing-tables.css';

interface Props { onBook: (prefill?: string) => void; }

/**
 * Destinations — mosaïque éditoriale plein cadre (remplace la grille tarifaire :
 * plus aucun prix sur le front). Tuiles asymétriques ; clic → fiche destination
 * (description complète) avec bouton Réserver prérempli.
 */
interface Destination {
  id: string;
  image: string;
  region: { fr: string; en: string };
  name: { fr: string; en: string };
  desc: { fr: string; en: string };
  /** Préremplissage du formulaire de réservation. */
  prefill: string;
  /** Taille de tuile dans la mosaïque. */
  size: 'hero' | 'wide' | 'tall' | 'std';
}

const DESTINATIONS: Destination[] = [
  {
    id: 'paris', image: '/dest-paris.webp', size: 'hero',
    region: { fr: 'Île-de-France', en: 'Île-de-France' },
    name: { fr: 'Paris', en: 'Paris' },
    desc: {
      fr: 'La capitale, ses aéroports et ses gares : transferts CDG, Orly et Le Bourget, courses intra-muros et mises à disposition — accueil pancarte, suivi des vols et attente incluse.',
      en: 'The capital, its airports and stations: CDG, Orly and Le Bourget transfers, intra-muros journeys and hourly hire — name-board welcome, flight tracking and waiting included.',
    },
    prefill: 'Paris ⇄ Aéroports (CDG · ORY · LBG)',
  },
  {
    id: 'versailles', image: '/dest-versailles.webp', size: 'std',
    region: { fr: 'Yvelines', en: 'Yvelines' },
    name: { fr: 'Versailles', en: 'Versailles' },
    desc: {
      fr: 'Le château et ses jardins à 40 minutes de Paris — mise à disposition possible pendant votre visite, retour quand vous le souhaitez.',
      en: 'The palace and its gardens, 40 minutes from Paris — chauffeur at disposal during your visit, return whenever you wish.',
    },
    prefill: 'Paris ⇄ Versailles',
  },
  {
    id: 'disneyland', image: '/dest-chantilly.webp', size: 'std',
    region: { fr: 'Marne-la-Vallée', en: 'Marne-la-Vallée' },
    name: { fr: 'Disneyland Paris', en: 'Disneyland Paris' },
    desc: {
      fr: 'Rejoignez les parcs en tout confort depuis Paris ou les aéroports — idéal pour les familles, sièges enfants sur simple demande.',
      en: 'Reach the parks in full comfort from Paris or the airports — perfect for families, child seats on request.',
    },
    prefill: 'Paris ⇄ Disneyland',
  },
  {
    id: 'giverny', image: '/dest-giverny.webp', size: 'tall',
    region: { fr: 'Normandie', en: 'Normandy' },
    name: { fr: 'Giverny', en: 'Giverny' },
    desc: {
      fr: 'Les jardins de Monet et la maison aux volets verts — une parenthèse impressionniste à une heure de Paris, arrêts photo à la demande.',
      en: 'Monet’s gardens and the green-shuttered house — an impressionist interlude an hour from Paris, photo stops on request.',
    },
    prefill: 'Paris ⇄ Giverny',
  },
  {
    id: 'champagne', image: '/dest-reims.webp', size: 'wide',
    region: { fr: 'Champagne', en: 'Champagne' },
    name: { fr: 'Reims & Épernay', en: 'Reims & Épernay' },
    desc: {
      fr: 'La cathédrale du sacre et l’avenue de Champagne : caves, dégustations et déjeuners de maison en maison, votre chauffeur toute la journée.',
      en: 'The coronation cathedral and the Avenue de Champagne: cellars, tastings and lunches from house to house, your chauffeur all day.',
    },
    prefill: 'Paris ⇄ Reims / Épernay',
  },
  {
    id: 'normandie', image: '/dest-normandy.webp', size: 'wide',
    region: { fr: 'Normandie', en: 'Normandy' },
    name: { fr: 'Deauville, Honfleur & Mont-Saint-Michel', en: 'Deauville, Honfleur & Mont-Saint-Michel' },
    desc: {
      fr: 'Les planches de Deauville, le vieux bassin d’Honfleur, les falaises d’Étretat et la Merveille de l’Occident — journées d’exception, itinéraire privé et chauffeur dédié.',
      en: 'The Deauville boardwalk, Honfleur’s old harbour, the Étretat cliffs and the Wonder of the West — exceptional day trips, private itinerary and dedicated chauffeur.',
    },
    prefill: 'Paris ⇄ Normandie (Deauville · Honfleur · Mont-Saint-Michel)',
  },
  {
    id: 'nice', image: '/dest-cannes.webp', size: 'std',
    region: { fr: 'Côte d’Azur', en: 'French Riviera' },
    name: { fr: 'Nice & Cannes', en: 'Nice & Cannes' },
    desc: {
      fr: 'De l’aéroport de Nice à la Croisette : transferts, festivals et mises à disposition sur toute la Côte d’Azur.',
      en: 'From Nice airport to the Croisette: transfers, festivals and hourly hire across the Riviera.',
    },
    prefill: 'Nice (NCE) ⇄ Cannes',
  },
  {
    id: 'monaco', image: '/dest-monaco.webp', size: 'std',
    region: { fr: 'Principauté', en: 'Principality' },
    name: { fr: 'Monaco', en: 'Monaco' },
    desc: {
      fr: 'La Principauté par la corniche — un trajet spectaculaire entre mer et falaises, jusqu’à votre hôtel, le Casino ou le Yacht Club.',
      en: 'The Principality along the corniche — a spectacular drive between sea and cliffs, to your hotel, the Casino or the Yacht Club.',
    },
    prefill: 'Nice (NCE) ⇄ Monaco',
  },
  {
    id: 'st-tropez', image: '/dest-saint-tropez.webp', size: 'std',
    region: { fr: 'Golfe de Saint-Tropez', en: 'Gulf of Saint-Tropez' },
    name: { fr: 'Saint-Tropez', en: 'Saint-Tropez' },
    desc: {
      fr: 'Le port mythique et ses plages par l’Estérel — villas, palaces et soirées, votre chauffeur vous attend aussi tard que nécessaire.',
      en: 'The legendary port and its beaches through the Estérel — villas, palaces and evenings out, your chauffeur waits as late as needed.',
    },
    prefill: 'Nice ⇄ Saint-Tropez',
  },
];

export default function PricingTables({ onBook }: Props) {
  const { lang } = useI18n();
  const [info, setInfo] = useState<Destination | null>(null);
  const L = (v: { fr: string; en: string }) => (lang === 'fr' ? v.fr : v.en);

  return (
    <section className="os-section os-dst" id="tarifs">
      <div className="os-container">
        <Reveal>
          <header className="os-dst__head">
            <div>
              <p className="os-eyebrow">Destinations</p>
              <h2 className="os-dst__title">
                {lang === 'fr' ? 'La France, porte à porte' : 'France, door to door'}
              </h2>
            </div>
            <p className="os-dst__lead">
              {lang === 'fr'
                ? 'Neuf territoires que nos chauffeurs connaissent par cœur — choisissez le vôtre, nous nous occupons du reste.'
                : 'Nine territories our chauffeurs know by heart — choose yours, we take care of the rest.'}
            </p>
          </header>
        </Reveal>

        {/* Mosaïque éditoriale asymétrique */}
        <Reveal>
          <div className="os-dst__mosaic">
            {DESTINATIONS.map((d, i) => (
              <article key={d.id} className={`os-dst__tile os-dst__tile--${d.size}`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => setInfo(d)} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setInfo(d)}>
                <img src={d.image} alt={L(d.name)} loading="lazy" />
                <div className="os-dst__scrim" aria-hidden />
                <span className="os-dst__region">{L(d.region)}</span>
                <div className="os-dst__body">
                  <h3>{L(d.name)}</h3>
                  <span className="os-dst__go">{lang === 'fr' ? 'Découvrir' : 'Discover'} →</span>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Fiche destination */}
      {info && (
        <div className="os-dpop" role="dialog" aria-modal aria-label={L(info.name)} onClick={() => setInfo(null)}>
          <div className="os-dpop__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setInfo(null)} aria-label={lang === 'fr' ? 'Fermer' : 'Close'}>×</button>
            <div className="os-dpop__media">
              <img src={info.image} alt={L(info.name)} />
              <span className="os-dpop__chip">{L(info.region)}</span>
            </div>
            <div className="os-dpop__body">
              <h3 className="os-dpop__title">{L(info.name)}</h3>
              <p className="os-dpop__desc">{L(info.desc)}</p>
              <p className="os-dpop__note">
                {lang === 'fr'
                  ? 'E-Class, V-Class ou S-Class — notre équipe vous confirme le tarif à la réservation.'
                  : 'E-Class, V-Class or S-Class — our team confirms the fare upon booking.'}
              </p>
              <button className="os-btn os-btn--gold os-dpop__cta"
                onClick={() => { const p = info.prefill; setInfo(null); onBook(p); }}>
                {lang === 'fr' ? 'Réserver' : 'Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
