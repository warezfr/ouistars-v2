import { useI18n } from '@/i18n';
import { PRESTIGIOUS_ADDRESSES as P } from '@/data/services';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Adresses prestigieuses + bande défilante (marquee) de logos partenaires. */
export default function PrestigiousAddresses() {
  const { lang } = useI18n();
  // Duplication de la liste pour une boucle CSS sans couture.
  const loop = [...P.logos, ...P.logos];

  return (
    <section className="os-section os-addresses">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{lang === 'fr' ? P.eyebrowFr : P.eyebrowEn}</p>
          <h2>{lang === 'fr' ? P.titleFr : P.titleEn}</h2>
          <div className="os-addresses__list">
            {P.places.map((place) => (
              <span key={place} className="os-addresses__item">{place}</span>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal>
        <p className="os-marquee__label">{lang === 'fr' ? P.trustFr : P.trustEn}</p>
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
