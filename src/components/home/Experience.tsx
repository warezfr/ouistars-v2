import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/**
 * Expérience — bloc compact « bento » luxe : colonne éditoriale (titre,
 * intro, 4 engagements en chiffres romains) + mosaïque serrée 2×2
 * (1 grande image portrait, 2 tuiles) alignée, hauteur maîtrisée.
 */
const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export default function Experience() {
  const { t } = useI18n();
  const e = t.experience;
  return (
    <section className="os-section os-exp" id="experience">
      <div className="os-container">
        <div className="os-exp__layout">
          {/* Colonne éditoriale */}
          <div className="os-exp__text">
            <Reveal>
              <p className="os-eyebrow">{e.eyebrow}</p>
              <h2 className="os-exp__title">
                {e.title} <span className="italic text-gold-soft">{e.titleAccent}</span>
              </h2>
              <p className="os-exp__intro">{e.intro}</p>
            </Reveal>
            <Reveal>
              <ol className="os-exp__sig">
                {e.bullets.map((b, i) => (
                  <li key={b} className="os-exp__sigrow">
                    <span className="os-exp__signum">{ROMANS[i]}</span>
                    <span className="os-exp__sigtext">{b}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>

          {/* Bento compact : 1 grande + 2 tuiles, tout aligné */}
          <Reveal>
            <div className="os-exp__bento">
              <figure className="os-exp__cell os-exp__cell--tall">
                <img src="/why-interior.webp" alt={e.cards.interior} loading="lazy" />
                <figcaption><i>01</i>{e.cards.interior}</figcaption>
              </figure>
              <figure className="os-exp__cell">
                <img src="/why-vip.webp" alt={e.cards.vip} loading="lazy" />
                <figcaption><i>02</i>{e.cards.vip}</figcaption>
              </figure>
              <figure className="os-exp__cell">
                <img src="/why-map.webp" alt={e.cards.map} loading="lazy" />
                <figcaption><i>03</i>{e.cards.map}</figcaption>
              </figure>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
