import { useState } from 'react';
import { useI18n } from '@/i18n';
import { SERVICES, type ServiceItem } from '@/data/services';
import { usePublished } from '@/lib/cms';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/**
 * Services — « index éditorial » luxe : liste numérotée pleine largeur
 * (filets dorés, serif display) + panneau visuel sticky qui révèle l'image
 * du service survolé en fondu. Contenu piloté par le CMS (collection
 * « service ») avec repli sur le catalogue statique.
 */
export default function Services() {
  const { lang, t } = useI18n();
  const services = usePublished<ServiceItem>('service', SERVICES);
  const [active, setActive] = useState(0);
  const current = services[active] ?? services[0];

  return (
    <section className="os-section os-svx" id="dmc">
      <div className="os-container">
        <Reveal>
          <div className="os-svx__head">
            <div>
              <p className="os-eyebrow">{t.services.eyebrow}</p>
              <h2 className="os-svx__title">{t.services.title}</h2>
            </div>
            <span className="os-svx__count">{String(services.length).padStart(2, '0')} expertises</span>
          </div>
        </Reveal>

        <div className="os-svx__layout">
          {/* Panneau visuel sticky — l'image du service survolé */}
          <div className="os-svx__visual" aria-hidden>
            <div className="os-svx__frame">
              {services.map((s, i) => (
                <div
                  key={s.id ?? i}
                  className={`os-svx__img${i === active ? ' is-on' : ''}`}
                  style={{ backgroundImage: `url('${s.image}')` }}
                />
              ))}
              <div className="os-svx__frame-scrim" />
              <div className="os-svx__caption">
                <span className="os-svx__caption-num">{String(active + 1).padStart(2, '0')}</span>
                <span className="os-svx__caption-name">{current ? (lang === 'fr' ? current.fr : current.en) : ''}</span>
              </div>
            </div>
          </div>

          {/* Index numéroté — filets dorés, serif display */}
          <ol className="os-svx__list">
            {services.map((s, i) => (
              <li key={s.id ?? i}>
                <div
                  className={`os-svx__row${i === active ? ' is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={0}
                >
                  <span className="os-svx__num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="os-svx__name">{lang === 'fr' ? s.fr : s.en}</h3>
                  <p className="os-svx__desc">{lang === 'fr' ? s.descFr : s.descEn}</p>
                  <span className="os-svx__arrow" aria-hidden>→</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
