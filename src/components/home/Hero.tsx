import { useI18n } from '@/i18n';
import FareCalculator from './FareCalculator';
import './hero.css';

interface Props { onBook: (prefill?: string) => void; onQuote: () => void; }

/** Hero vidéo plein écran — imagerie luxe, voile noir → transparent + halo doré. */
export default function Hero({ onBook, onQuote }: Props) {
  const { t } = useI18n();
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pb-16 pt-32" id="top">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/herolast.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      {/* Dégradé noir → transparent (lisibilité du contenu) */}
      <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/65 to-night/25" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/55" aria-hidden />
      {/* Voile doré subtil */}
      <div
        className="absolute inset-0 bg-[radial-gradient(62%_52%_at_76%_24%,rgba(201,162,75,0.14),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1560px] items-center gap-14 px-[clamp(18px,3vw,44px)] lg:grid-cols-[1.22fr_0.86fr]">
        <div>
          <p className="os-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="os-title-hero font-display font-semibold text-ivory">
            {t.hero.title}{' '}
            <span className="italic text-gold-soft">{t.hero.titleAccent}</span>
          </h1>
          <a className="os-hero__pricing-link" href="#tarifs">{t.hero.pricingLink}</a>
          <p className="os-lead os-hero__sub max-w-[62ch]">{t.hero.subtitle}</p>
          <div className="flex flex-wrap gap-3.5">
            <button className="os-btn os-btn--gold" onClick={() => onBook()}>{t.hero.ctaBook}</button>
            <button className="os-btn os-btn--ghost" onClick={onQuote}>{t.hero.ctaQuote}</button>
          </div>
        </div>

        {/* Calculateur en carte « verre fumé » (voir calculator.css) */}
        <FareCalculator />
      </div>
    </section>
  );
}
