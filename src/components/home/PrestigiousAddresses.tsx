import { useI18n } from '@/i18n';
import { PRESTIGIOUS_ADDRESSES as P } from '@/data/services';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Remplace la section "marques prestigieuses" (consigne). */
export default function PrestigiousAddresses() {
  const { lang } = useI18n();
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
    </section>
  );
}
