import { useState } from 'react';
import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/**
 * Expérience — « Rituel en 4 temps » interactif : cliquer sur I/II/III/IV
 * change l'image panoramique (fondu) et affiche, en bas à gauche, le titre
 * du temps choisi avec une description de 2-3 lignes.
 */
const ROMANS = ['I', 'II', 'III', 'IV'];
const RITUAL_IMAGES = ['/why-fleet.webp', '/why-airport.webp', '/why-interior.webp', '/why-phone.webp'];

export default function Experience() {
  const { t } = useI18n();
  const e = t.experience;
  const [active, setActive] = useState(2); // « Le trajet » par défaut
  const cur = e.ritual[active] ?? e.ritual[0];

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
              <button
                key={s.t}
                type="button"
                className={`os-exp__step${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                <i>{ROMANS[i]}</i>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <figure className="os-exp__band">
            {RITUAL_IMAGES.map((src, i) => (
              <img key={src} src={src} alt={e.ritual[i]?.t ?? ''} loading="lazy"
                className={i === active ? 'is-on' : ''} />
            ))}
            <div className="os-exp__band-scrim" aria-hidden />
            <figcaption className="os-exp__bandcap" key={active}>
              <b><i>{ROMANS[active]}</i>{cur.t}</b>
              <p>{cur.long}</p>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
