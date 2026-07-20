import { useState } from 'react';
import { useI18n, type Lang } from '@/i18n';
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
  // Les fiches publiées par le CMS ne portent que fr/en : pour es/ru/ar on
  // retombe sur la traduction du catalogue statique (même id), puis sur l'anglais.
  const staticById = new Map(SERVICES.map((x) => [x.id, x]));
  const svcName = (x: ServiceItem) => {
    const st = staticById.get(x.id ?? '');
    return (({ fr: x.fr, en: x.en, es: x.es ?? st?.es, ru: x.ru ?? st?.ru, ar: x.ar ?? st?.ar } as Record<Lang, string | undefined>)[lang]) ?? x.en;
  };
  const svcDesc = (x: ServiceItem) => {
    const st = staticById.get(x.id ?? '');
    return (({ fr: x.descFr, en: x.descEn, es: x.descEs ?? st?.descEs, ru: x.descRu ?? st?.descRu, ar: x.descAr ?? st?.descAr } as Record<Lang, string | undefined>)[lang]) ?? x.descEn;
  };
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
            <span className="os-svx__count">{String(services.length).padStart(2, '0')} {({ fr: 'expertises', en: 'services', es: 'servicios', ru: 'услуг', ar: 'خدمة' } as Record<Lang, string>)[lang]}</span>
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
                <span className="os-svx__caption-name">{current ? svcName(current) : ''}</span>
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
                  <h3 className="os-svx__name">{svcName(s)}</h3>
                  <p className="os-svx__desc">{svcDesc(s)}</p>
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
