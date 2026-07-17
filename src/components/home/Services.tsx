import { useI18n } from '@/i18n';
import { SERVICES, type ServiceItem } from '@/data/services';
import { usePublished } from '@/lib/cms';
import Icon from '@/components/ui/Icon';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/**
 * Services — grille dense de cartes à image de fond (overlay noir dégradé,
 * titre or, description révélée au survol). Contenu piloté par le CMS
 * (collection « service ») avec repli sur le catalogue statique.
 */
export default function Services() {
  const { lang, t } = useI18n();
  const services = usePublished<ServiceItem>('service', SERVICES);
  return (
    <section className="os-section os-svc" id="dmc">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.services.eyebrow}</p>
          <h2 className="os-svc__title">{t.services.title}</h2>
        </Reveal>
        <div className="os-svc__grid">
          {services.map((s, i) => (
            <Reveal key={s.id ?? i}>
              <article
                className="os-svc__card"
                style={{ backgroundImage: `url('${s.image}')` }}
              >
                <div className="os-svc__scrim" aria-hidden />
                <div className="os-svc__body">
                  <span className="os-svc__icon"><Icon name={s.icon} size={20} /></span>
                  <h3 className="os-svc__name">{lang === 'fr' ? s.fr : s.en}</h3>
                  <p className="os-svc__desc">{lang === 'fr' ? s.descFr : s.descEn}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
