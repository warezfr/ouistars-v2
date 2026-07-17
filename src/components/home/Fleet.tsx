import { useI18n } from '@/i18n';
import { FLEET } from '@/data/fleet';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Flotte — cartes larges avec photo du véhicule, badge de classe doré. */
export default function Fleet() {
  const { t } = useI18n();
  return (
    <section className="os-section" id="fleet">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.fleet.eyebrow}</p>
          <h2>{t.fleet.title}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {FLEET.map((v) => (
            <Reveal key={v.id}>
              <article className="group relative overflow-hidden rounded-2xl border border-gold-deep/20 bg-surface/60 transition-colors duration-500 hover:border-gold-deep/60">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={v.image}
                    alt={v.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full border border-gold-deep bg-night/60 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur-sm">
                    {v.className}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="os-card-title font-display text-ivory">{v.name}</h3>
                  <p className="os-small os-flush">{v.descFr}</p>
                  <div className="mt-3 flex items-center gap-2 text-[0.8rem] tracking-wide text-gold-soft/85">
                    <span>{v.seats} {t.fleet.passengers}</span>
                    <span aria-hidden>·</span>
                    <span>{v.luggage} {t.fleet.luggage}</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
