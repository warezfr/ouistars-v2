import { useState } from 'react';
import { useI18n } from '@/i18n';
import { MEET_GREET_RATES, MEET_GREET_INCLUDES_I18N, MEET_GREET_DISCLAIMER_I18N } from '@/data/pricing';
import { usePricingSync } from '@/lib/livePricing';
import { formatEUR } from '@/lib/pricing';
import Reveal from '@/components/ui/Reveal';
import MeetGreetWizard from './MeetGreetWizard';
import './sections.css';
import './meetgreet.css';

/**
 * Section Meet & Greeter : un seul bloc (prestations + disclaimer + CTA).
 * La réservation se fait dans un wizard popup (type → aéroport → formulaire).
 */
export default function MeetGreeter() {
  usePricingSync(); // re-rend quand le Salon de tarification a synchronisé les tarifs
  const { t, lang } = useI18n();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <section className="os-section os-mg" id="meet-greet">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.meetGreet.eyebrow}</p>
          <h2>{t.meetGreet.title}</h2>
        </Reveal>

        <Reveal>
          <div className="os-mg2">
            <div className="os-mg2__body">
              <h3>{t.meetGreet.includes}</h3>
              <ul>
                {MEET_GREET_INCLUDES_I18N[lang].map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>

              <div className="os-mg2__tarifs">
                {MEET_GREET_RATES.map((r) => {
                  const [city, codes] = r.airport.split('—').map((s) => s.trim());
                  return (
                    <div key={r.id} className="os-mg2__tarif">
                      <span className="os-mg2__tcode" aria-hidden>{(codes ?? city).replace(/\s*&\s*/g, ' · ')}</span>
                      <span className="os-mg2__tbody">
                        <span className="os-mg2__tairport">{city}</span>
                        <span className="os-mg2__tmeta">
                          {t.meetGreet.upTo} {r.includedPax} {t.meetGreet.paxBags}
                          {r.extraPaxSurcharge != null && <> · +{formatEUR(r.extraPaxSurcharge)}/pax</>}
                        </span>
                      </span>
                      <span className="os-mg2__tprice">{r.base != null ? formatEUR(r.base) : t.meetGreet.onQuote}</span>
                    </div>
                  );
                })}
              </div>

              <p className="os-mg2__disclaimer">{MEET_GREET_DISCLAIMER_I18N[lang]}</p>
              <button className="os-btn os-btn--gold os-mg2__cta" onClick={() => setWizardOpen(true)}>
                {t.meetGreet.cta} →
              </button>
            </div>

            <div className="os-mg2__visual" style={{ backgroundImage: 'url(/meet-greet.webp)' }} />
          </div>
        </Reveal>
      </div>

      <MeetGreetWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </section>
  );
}
