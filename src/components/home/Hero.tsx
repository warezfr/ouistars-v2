import { useI18n } from '@/i18n';
import FareCalculator from './FareCalculator';
import './hero.css';

/** Hero vidéo plein écran — imagerie luxe, voile noir → transparent + halo doré.
    Le calculateur (barre horizontale) vit dans le hero : le contenu au-dessus
    reste compact (titre + chips services). */
export default function Hero() {
  const { t } = useI18n();
  const services = t.hero.subtitle.split('•').map((s) => s.trim()).filter(Boolean);
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pb-10 pt-28" id="top">
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

      <div className="relative z-10 mx-auto flex w-full max-w-[1560px] flex-col gap-8 px-[clamp(18px,3vw,44px)]">
        <div>
          <p className="os-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="os-title-hero font-display font-semibold text-ivory">
            {t.hero.title}{' '}
            <span className="italic text-gold-soft">{t.hero.titleAccent}</span>
          </h1>
          <a className="os-hero__pricing-link" href="#tarifs">{t.hero.pricingLink}</a>
          {/* Services en chips perlées — compact, laisse la place au calculateur */}
          <div className="os-hero__chips">
            {services.map((s) => (
              <span key={s} className="os-hero__chip">{s}</span>
            ))}
          </div>
        </div>

        {/* Calculateur — barre horizontale pleine largeur (voir calculator.css) */}
        <FareCalculator />
      </div>
    </section>
  );
}
