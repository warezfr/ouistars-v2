import { useI18n } from '@/i18n';
import { SERVICES } from '@/data/services';
import Icon from '@/components/ui/Icon';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

export default function Services() {
  const { lang, t } = useI18n();
  return (
    <section className="os-section" id="dmc">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.services.eyebrow}</p>
          <h2>{t.services.title}</h2>
        </Reveal>
        <div className="os-grid os-grid--services">
          {SERVICES.map((s) => (
            <Reveal key={s.id}>
              <article className="os-card os-service">
                <span className="os-service__icon"><Icon name={s.icon} /></span>
                <h3>{lang === 'fr' ? s.fr : s.en}</h3>
                <p>{lang === 'fr' ? s.descFr : s.descEn}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
