import { useI18n } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Clés des cartes de la mosaïque (images réelles /public/why-*.webp). */
type ExperienceCardKey = 'interior' | 'vip' | 'airport' | 'map';

interface MosaicCard {
  key: ExperienceCardKey;
  src: string;
  className: string;
}

const MOSAIC: MosaicCard[] = [
  { key: 'interior', src: '/why-interior.webp', className: 'row-span-2 min-h-[320px] sm:min-h-[420px]' },
  { key: 'vip', src: '/why-vip.webp', className: 'aspect-[4/3]' },
  { key: 'airport', src: '/why-airport.webp', className: 'aspect-[4/3]' },
  { key: 'map', src: '/why-map.webp', className: 'col-span-2 aspect-[21/8]' },
];

/** Section « Expérience » — grille éditoriale + puces de réassurance. */
export default function Experience() {
  const { t } = useI18n();
  return (
    <section className="os-section" id="experience">
      <div className="os-container grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <p className="os-eyebrow">{t.experience.eyebrow}</p>
          <h2>
            {t.experience.title}{' '}
            <span className="italic text-gold-soft">{t.experience.titleAccent}</span>
          </h2>
          <p className="os-lead">{t.experience.intro}</p>
          <ul className="mt-8 grid list-none gap-4 p-0">
            {t.experience.bullets.map((b) => (
              <li key={b} className="flex items-baseline gap-3 text-[0.95rem] text-ivory/85">
                <span className="text-[0.6rem] text-gold" aria-hidden>✦</span>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal>
          <div className="grid grid-cols-2 gap-4">
            {MOSAIC.map((c) => (
              <figure
                key={c.key}
                className={`group relative m-0 overflow-hidden rounded-2xl border border-gold-deep/20 ${c.className}`}
              >
                <img
                  src={c.src}
                  alt={t.experience.cards[c.key]}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent" aria-hidden />
                <figcaption className="absolute inset-x-4 bottom-3 font-display text-[1.05rem] italic text-ivory/95">
                  {t.experience.cards[c.key]}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
