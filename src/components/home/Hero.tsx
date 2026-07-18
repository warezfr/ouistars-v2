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
    <section className="relative flex min-h-screen flex-col overflow-hidden pb-7 pt-28" id="top">
      {/* Vidéo éclaircie (brightness) — voiles allégés pour la laisser respirer */}
      <video
        className="absolute inset-0 h-full w-full object-cover brightness-125"
        src="/herolast.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      {/* Dégradé noir → transparent (lisibilité du contenu, allégé) */}
      <div className="absolute inset-0 bg-gradient-to-r from-night/75 via-night/35 to-night/10" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-night/40" aria-hidden />
      {/* Voile doré subtil */}
      <div
        className="absolute inset-0 bg-[radial-gradient(62%_52%_at_76%_24%,rgba(201,162,75,0.14),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-8 px-[clamp(18px,3vw,44px)]">
        <div>
          <p className="os-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="os-title-hero font-display font-semibold text-ivory">
            {t.hero.title}{' '}
            <span className="italic text-gold-soft">{t.hero.titleAccent}</span>
          </h1>
          <a className="os-hero__pricing-link" href="#tarifs">{t.hero.pricingLink}</a>
        </div>

        {/* Calé en bas du hero : la vidéo reste visible au centre */}
        <div className="mt-auto flex flex-col gap-5">
          {/* Calculateur — barre horizontale pleine largeur (voir calculator.css) */}
          <FareCalculator />

          {/* Bandeau défilant des services — sous le calculateur */}
          <div className="os-hero__marquee" aria-hidden>
            <div className="os-hero__marquee-track">
              {[...services, ...services].map((s, i) => (
                <span key={i} className="os-hero__mq-item">{s}<i>✦</i></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
