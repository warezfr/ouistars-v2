import { useI18n } from '@/i18n';
import { MEET_GREET_RATES, MEET_GREET_INCLUDES, MEET_GREET_DISCLAIMER } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

export default function MeetGreeter() {
  const { t } = useI18n();
  return (
    <section className="os-section os-mg" id="meet-greet">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.meetGreet.eyebrow}</p>
          <h2>{t.meetGreet.title}</h2>
        </Reveal>

        <div className="os-mg__grid">
          <Reveal>
            <div className="os-mg__rates">
              {MEET_GREET_RATES.map((r) => (
                <div key={r.id} className="os-card os-mg__rate">
                  <div className="os-mg__airport">{r.airport}</div>
                  <div className="os-mg__price">{r.base != null ? formatEUR(r.base) : '—'}</div>
                  <div className="os-mg__meta">
                    {t.meetGreet.upTo} {r.includedPax} {t.meetGreet.paxBags}
                    {r.extraPaxSurcharge != null && (
                      <span> · +{formatEUR(r.extraPaxSurcharge)} {t.meetGreet.surcharge}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="os-card os-mg__includes">
              <h3>{t.meetGreet.includes}</h3>
              <ul>
                {MEET_GREET_INCLUDES.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="os-mg__disclaimer">⚠️ {MEET_GREET_DISCLAIMER}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
