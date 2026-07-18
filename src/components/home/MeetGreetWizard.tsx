import { useEffect, useMemo, useState } from 'react';
import { MEET_GREET_RATES } from '@/data/pricing';
import { computeMeetGreet, formatEUR } from '@/lib/pricing';
import { DateField, TimeField } from '@/components/booking/pickers';
import { useI18n } from '@/i18n';
import './meetgreet.css';

/**
 * Wizard popup Meet & Greeter — 3 étapes qui se remplacent (avec retour) :
 *   1. Type de service (Arrivée / Transit / Départ)
 *   2. Aéroport (tarifs officiels + « autre aéroport » sur devis)
 *   3. Formulaire prérempli (récap modifiable) → e-mail ou WhatsApp
 * Les deux canaux passent par /api/intake : la demande arrive au back-office
 * et déclenche les confirmations e-mail (client + Oui Stars).
 */

type ServiceType = 'arrival' | 'transit' | 'departure';
type Step = 1 | 2 | 3 | 4;

const WA_NUMBER = '33651030306';

const SvcIcon = ({ kind }: { kind: ServiceType }) => {
  const paths: Record<ServiceType, string> = {
    // avion qui descend / correspondance / avion qui monte
    arrival: 'M3 19h18M6.5 5l4.2 4.7 6.9 1.9c.9.2 1.4 1.2 1 2-.3.7-1.1 1-1.8.8L4.4 11 3 7.8l2 .5L6.5 5z',
    transit: 'M3 19h18M12 4a6 6 0 0 1 6 6h2.5l-3.5 3.5L13.5 10H16a4 4 0 0 0-8 0H5.5a6.5 6.5 0 0 1 6.5-6z',
    departure: 'M3 19h18M4 13.5l16.2-4.3c.8-.2 1.2-1.1.9-1.9-.3-.7-1-1-1.7-.9L13 8 7.5 4 5.6 4.6l3.6 4-4.8 1.3-2-1.4-1.4.4L4 13.5z',
  };
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[kind]} />
    </svg>
  );
};

export default function MeetGreetWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const mg = t.meetGreet;

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<ServiceType | null>(null);
  const [airportId, setAirportId] = useState<string | null>(null);
  const [otherAirport, setOtherAirport] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    travel_date: '', travel_time: '', flight_number: '', passengers: 2, notes: '',
  });
  const [sending, setSending] = useState<'email' | 'whatsapp' | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [reference, setReference] = useState('');

  // Réinitialise à chaque ouverture + verrouille le scroll de la page.
  useEffect(() => {
    if (!open) return;
    setStep(1); setService(null); setAirportId(null); setOtherAirport('');
    setSending(null); setErrMsg(''); setReference('');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const services: { id: ServiceType; label: string; desc: string }[] = [
    { id: 'arrival', label: mg.svcArrival, desc: mg.svcArrivalDesc },
    { id: 'transit', label: mg.svcTransit, desc: mg.svcTransitDesc },
    { id: 'departure', label: mg.svcDeparture, desc: mg.svcDepartureDesc },
  ];
  const svcLabel = services.find((s) => s.id === service)?.label ?? '';

  const airportLabel = airportId === 'other'
    ? (otherAirport || mg.otherAirport)
    : MEET_GREET_RATES.find((r) => r.id === airportId)?.airport ?? '';

  const price = useMemo(() => {
    if (!airportId || airportId === 'other') return null;
    return computeMeetGreet(airportId, form.passengers);
  }, [airportId, form.passengers]);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;

  const summaryText = () =>
    `${mg.wizTitle} — ${svcLabel} · ${airportLabel}` +
    `${form.travel_date ? ` · ${form.travel_date}` : ''}${form.travel_time ? ` ${form.travel_time}` : ''}` +
    `${form.flight_number ? ` · ${lang === 'fr' ? 'vol' : 'flight'} ${form.flight_number}` : ''}` +
    ` · ${form.passengers} pax${price != null ? ` · ${formatEUR(price)}` : ` · ${mg.onQuote}`}`;

  async function submit(channelKind: 'email' | 'whatsapp') {
    setErrMsg('');
    if (!form.first_name.trim() || !form.phone.trim() || !form.travel_date) { setErrMsg(mg.needFields); return; }
    if (channelKind === 'email' && !form.email.trim()) { setErrMsg(mg.needEmail); return; }
    setSending(channelKind);

    let ref = '';
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'greeter',
          channel: channelKind === 'whatsapp' ? 'whatsapp' : 'siteweb',
          website: '',
          data: {
            service_type: service,
            airport_id: airportId,
            airport_label: airportLabel,
            ...form,
            email: form.email || '',
          },
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { reference?: string };
        ref = json.reference ?? '';
      }
    } catch { /* réseau : WhatsApp reste possible ci-dessous */ }

    if (channelKind === 'whatsapp') {
      const txt = `${lang === 'fr' ? 'Bonjour Oui Stars,' : 'Hello Oui Stars,'} ${summaryText()}` +
        ` — ${form.first_name} ${form.last_name} · ${form.phone}${ref ? ` · réf ${ref}` : ''}` +
        `${form.notes ? ` · ${form.notes}` : ''}`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    } else if (!ref) {
      setSending(null); setErrMsg(mg.error); return;
    }

    setReference(ref);
    setSending(null);
    setStep(4);
  }

  const stepTitles = [mg.chooseService, mg.chooseAirport, mg.yourDetails];

  return (
    <div className="os-mgw" role="dialog" aria-modal onClick={onClose}>
      <div className="os-mgw__panel" onClick={(e) => e.stopPropagation()}>
        <button className="os-mgw__close" onClick={onClose} aria-label={t.common.close}>×</button>

        <header className="os-mgw__head">
          <p className="os-eyebrow">{mg.title}</p>
          <h3>{step === 4 ? mg.okTitle : stepTitles[step - 1]}</h3>
          {step < 4 && (
            <div className="os-mgw__progress" aria-hidden>
              {mg.steps.map((s, i) => (
                <span key={s} className={`os-mgw__dot ${i + 1 === step ? 'is-now' : ''} ${i + 1 < step ? 'is-done' : ''}`}>
                  <i>{i + 1 < step ? '✓' : i + 1}</i>{s}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ————— Étape 1 : type de service ————— */}
        {step === 1 && (
          <div className="os-mgw__step" key="s1">
            <div className="os-mgw__cards">
              {services.map((s) => (
                <button key={s.id} className={`os-mgw__card ${service === s.id ? 'is-sel' : ''}`}
                  onClick={() => { setService(s.id); setStep(2); }}>
                  <span className="os-mgw__cardicon"><SvcIcon kind={s.id} /></span>
                  <span className="os-mgw__cardname">{s.label}</span>
                  <span className="os-mgw__carddesc">{s.desc}</span>
                  <span className="os-mgw__cardarrow">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ————— Étape 2 : aéroport ————— */}
        {step === 2 && (
          <div className="os-mgw__step" key="s2">
            <div className="os-mgw__airports">
              {MEET_GREET_RATES.map((r) => (
                <button key={r.id} className={`os-mgw__airport ${airportId === r.id ? 'is-sel' : ''}`}
                  onClick={() => { setAirportId(r.id); setStep(3); }}>
                  <span className="os-mgw__aname">{r.airport}</span>
                  <span className="os-mgw__aprice">{r.base != null ? formatEUR(r.base) : mg.onQuote}</span>
                  <span className="os-mgw__ameta">
                    {mg.upTo} {r.includedPax} {mg.paxBags}
                    {r.extraPaxSurcharge != null && <> · +{formatEUR(r.extraPaxSurcharge)} {mg.surcharge}</>}
                  </span>
                </button>
              ))}
              <button className={`os-mgw__airport os-mgw__airport--other ${airportId === 'other' ? 'is-sel' : ''}`}
                onClick={() => { setAirportId('other'); setStep(3); }}>
                <span className="os-mgw__aname">{mg.otherAirport}</span>
                <span className="os-mgw__aprice">{mg.onQuote}</span>
                <span className="os-mgw__ameta">{mg.otherAirportDesc}</span>
              </button>
            </div>
            <button className="os-mgw__back" onClick={() => setStep(1)}>← {mg.back}</button>
          </div>
        )}

        {/* ————— Étape 3 : formulaire prérempli ————— */}
        {step === 3 && (
          <div className="os-mgw__step" key="s3">
            <div className="os-mgw__recap">
              <button className="os-mgw__chip" onClick={() => setStep(1)} title={mg.edit}>
                <SvcIcon kind={service ?? 'arrival'} /><span>{svcLabel}</span><i>✎</i>
              </button>
              <button className="os-mgw__chip" onClick={() => setStep(2)} title={mg.edit}>
                <span>{airportLabel}</span><i>✎</i>
              </button>
              <span className="os-mgw__chip os-mgw__chip--price">
                {mg.estTotal} : <b>{price != null ? formatEUR(price) : mg.onQuote}</b>
              </span>
            </div>

            {airportId === 'other' && (
              <input className="os-mgw__input os-mgw__input--full" placeholder={mg.otherAirportPh}
                value={otherAirport} onChange={(e) => setOtherAirport(e.target.value)} />
            )}

            <div className="os-mgw__form">
              <label className="os-mgw__labeled">
                <span>{mg.firstName} <i className="os-mgw__req">*</i></span>
                <input className="os-mgw__input" value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)} />
              </label>
              <label className="os-mgw__labeled">
                <span>{mg.lastName}</span>
                <input className="os-mgw__input" value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)} />
              </label>
              <label className="os-mgw__labeled">
                <span>{mg.phone} <i className="os-mgw__req">*</i></span>
                <input className="os-mgw__input" type="tel" placeholder="+33 6 …" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} />
              </label>
              <label className="os-mgw__labeled">
                <span>{mg.email}</span>
                <input className="os-mgw__input" type="email" placeholder="vous@exemple.com" value={form.email}
                  onChange={(e) => set('email', e.target.value)} />
              </label>
              <div className="os-mgw__labeled">
                <span>{mg.date} <i className="os-mgw__req">*</i></span>
                <DateField value={form.travel_date} min={new Date().toISOString().slice(0, 10)}
                  locale={lang} onChange={(iso) => set('travel_date', iso)} />
              </div>
              <div className="os-mgw__labeled">
                <span>{mg.time}</span>
                <TimeField value={form.travel_time} locale={lang} onChange={(v) => set('travel_time', v)} />
              </div>
              <label className="os-mgw__labeled">
                <span>{mg.flight}</span>
                <input className="os-mgw__input" placeholder="AF 1234" value={form.flight_number}
                  onChange={(e) => set('flight_number', e.target.value)} />
              </label>
              <label className="os-mgw__labeled">
                <span>{mg.pax}</span>
                <input className="os-mgw__input" type="number" min={1} max={20} value={form.passengers}
                  onChange={(e) => set('passengers', Math.max(1, Number(e.target.value) || 1))} />
              </label>
              <textarea className="os-mgw__input os-mgw__input--full" rows={2} placeholder={mg.notesPh}
                value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>

            <p className="os-mgw__legend"><i className="os-mgw__req">*</i> {mg.requiredNote}</p>
            {errMsg && <p className="os-mgw__err">{errMsg}</p>}

            <div className="os-mgw__actions">
              <button className="os-btn os-btn--gold" disabled={sending !== null} onClick={() => submit('email')}>
                {sending === 'email' ? t.common.sending : <>✉ {mg.sendEmail}</>}
              </button>
              <button className="os-btn os-mgw__wa" disabled={sending !== null} onClick={() => submit('whatsapp')}>
                {sending === 'whatsapp' ? t.common.sending : <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden><path d="M20 4A10 10 0 0 0 3.6 15.6L2 22l6.6-1.6A10 10 0 1 0 20 4zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-3.9.9.9-3.8-.2-.3A8 8 0 1 1 12 20zm4.5-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6 8.4a4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c2 .9 2.1.6 2.5.6a2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .1-1.1c0-.1-.3-.2-.5-.3z"/></svg>
                  {mg.sendWhatsApp}
                </>}
              </button>
            </div>
            <button className="os-mgw__back" onClick={() => setStep(2)}>← {mg.back}</button>
          </div>
        )}

        {/* ————— Étape 4 : confirmation ————— */}
        {step === 4 && (
          <div className="os-mgw__step os-mgw__done" key="s4">
            <div className="os-mgw__doneicon">✓</div>
            <p>{mg.okBody}</p>
            {reference && <p className="os-mgw__ref">{mg.okRef} : <b>{reference}</b></p>}
            <p className="os-mgw__donesum">{summaryText()}</p>
            <button className="os-btn os-btn--ghost" onClick={onClose}>{t.common.close}</button>
          </div>
        )}
      </div>
    </div>
  );
}
