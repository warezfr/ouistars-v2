import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/**
 * Expérience — collage éditorial luxe : texte + liste « signature » en
 * chiffres romains (filets or) à gauche, collage de deux images à cadres
 * dorés décalés qui se chevauchent à droite, bannière panoramique en pied.
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

          {/* Collage — cadres dorés décalés qui se chevauchent */}
          <div className="os-exp__collage">
            <Reveal>
              <figure className="os-exp__fig os-exp__fig--main">
                <img src="/why-interior.webp" alt={e.cards.interior} loading="lazy" />
                <figcaption><i>01</i>{e.cards.interior}</figcaption>
              </figure>
            </Reveal>
            <Reveal>
              <figure className="os-exp__fig os-exp__fig--over">
                <img src="/why-vip.webp" alt={e.cards.vip} loading="lazy" />
                <figcaption><i>02</i>{e.cards.vip}</figcaption>
              </figure>
            </Reveal>
          </div>
        </div>

        {/* Bannière panoramique */}
        <Reveal>
          <figure className="os-exp__wide">
            <img src="/why-map.webp" alt={e.cards.map} loading="lazy" />
            <div className="os-exp__wide-scrim" aria-hidden />
            <figcaption><i>03</i>{e.cards.map}</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
