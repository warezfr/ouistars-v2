import { useI18n } from '@/i18n';
import { SERVICES } from '@/data/services';
import FareCalculator from './FareCalculator';
import './hero.css';

interface Props { onBook: (prefill?: string) => void; onQuote: () => void; }

export default function Hero({ onBook, onQuote }: Props) {
  const { lang, t } = useI18n();
  return (
    <section className="os-hero" id="top">
      <div className="os-hero__bg" aria-hidden />
      <div className="os-hero__veil" aria-hidden />
      <div className="os-container os-hero__grid">
        <div className="os-hero__copy">
          <p className="os-eyebrow">{t.hero.eyebrow}</p>
          <h1>
            {t.hero.title} <span className="os-hero__accent">{t.hero.titleAccent}</span>
          </h1>
          <a className="os-hero__pricing-link" href="#tarifs">{t.hero.pricingLink}</a>
          <p className="os-lead os-hero__sub">{t.hero.subtitle}</p>
          <div className="os-hero__cta">
            <button className="os-btn os-btn--gold" onClick={() => onBook()}>{t.hero.ctaBook}</button>
            <button className="os-btn os-btn--ghost" onClick={onQuote}>{t.hero.ctaQuote}</button>
          </div>
          <ul className="os-hero__chips" aria-label={t.services.title}>
            {SERVICES.map((s) => (
              <li key={s.id} className="os-hero__chip">{lang === 'fr' ? s.fr : s.en}</li>
            ))}
          </ul>
        </div>
        <FareCalculator onBook={onBook} />
      </div>
    </section>
  );
}
