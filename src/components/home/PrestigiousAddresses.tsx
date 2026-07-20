import { useI18n, pickL } from '@/i18n';
import { PRESTIGIOUS_ADDRESSES as P } from '@/data/services';
import { usePublished } from '@/lib/cms';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Adresses prestigieuses + bande défilante (marquee) de logos partenaires. */
export default function PrestigiousAddresses() {
  const { lang } = useI18n();
  // Contenu CMS (collections « partner » et « address ») avec repli statique.
  const logos = usePublished<{ name: string; src: string }>('partner', P.logos);
  const addresses = usePublished<{ label: string }>('address', P.places.map((label) => ({ label })));
  // Duplication de la liste pour une boucle CSS sans couture.
  const loop = [...logos, ...logos];

  return (
    <section className="os-section os-addresses">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{pickL(lang, P.eyebrow)}</p>
          <h2>{pickL(lang, P.title)}</h2>
          <div className="os-addresses__list">
            {addresses.map((place, i) => (
              <span key={place.label ?? i} className="os-addresses__item">{place.label}</span>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal>
        <p className="os-marquee__label">{pickL(lang, P.trust)}</p>
        <div className="os-marquee" aria-hidden>
          <div className="os-marquee__track">
            {loop.map((logo, i) => (
              <span className="os-marquee__item" key={`${logo.name}-${i}`}>
                <img src={logo.src} alt={logo.name} loading="lazy" />
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
