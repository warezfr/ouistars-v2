import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/**
 * Expérience — « Rituel en 4 temps » : quatre temps du trajet en colonnes
 * séparées de filets or (numéros romains italiques), bande photo
 * panoramique en pied. Compact : une hauteur d'écran.
 */
const ROMANS = ['I', 'II', 'III', 'IV'];

export default function Experience() {
  const { t } = useI18n();
  const e = t.experience;
  return (
    <section className="os-section os-exp" id="experience">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{e.eyebrow}</p>
          <h2 className="os-exp__title">
            {e.title} <span className="italic text-gold-soft">{e.titleAccent}</span>
          </h2>
        </Reveal>

        <Reveal>
          <div className="os-exp__ritual">
            {e.ritual.map((s, i) => (
              <div key={s.t} className="os-exp__step">
                <i>{ROMANS[i]}</i>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <figure className="os-exp__band">
            <img src="/why-interior.webp" alt={e.cards.interior} loading="lazy" />
            <figcaption><i>✦</i>{e.cards.interior}</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
