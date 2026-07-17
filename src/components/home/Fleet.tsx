import { useI18n } from '@/i18n';
import { FLEET } from '@/data/fleet';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

export default function Fleet() {
  const { t } = useI18n();
  return (
    <section className="os-section" id="fleet">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.fleet.eyebrow}</p>
          <h2>{t.fleet.title}</h2>
        </Reveal>
        <div className="os-grid os-grid--fleet">
          {FLEET.map((v) => (
            <Reveal key={v.id}>
              <article className="os-card os-fleet">
                <div className="os-fleet__badge">{v.className}</div>
                <h3>{v.name}</h3>
                <p>{v.descFr}</p>
                <div className="os-fleet__meta">
                  <span>{v.seats} passagers</span><span>·</span><span>{v.luggage} bagages</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
