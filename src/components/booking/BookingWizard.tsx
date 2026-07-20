import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { VEHICLE_CLASSES, HOURLY_MIN_HOURS, type VehicleClass } from '@/data/pricing';
import { FLEET } from '@/data/fleet';
import { formatEUR } from '@/lib/pricing';
import { estimateHourly } from '@/lib/estimate';
import { estimatePlaces, type Place, type OneWayEstimate } from '@/lib/geocode';
import { DateField, TimeField } from './pickers';
import './wizard.css';

/** Le hero transmet le trajet (+ estimation pré-calculée) ; le wizard gère le mode et l'horaire. */
export interface BookingContext {
  from: Place;
  to: Place | null;
  estimate?: OneWayEstimate | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  ctx: BookingContext;
}

type Phase = 'setup' | 'flow';
type Mode = 'oneway' | 'hourly';
type StepId = 1 | 2 | 3;
type PayMethod = 'transfer' | 'paypal';
type Submit = 'idle' | 'sending' | 'ok' | 'error';

const WIZARD_VEHICLES: { cls: VehicleClass; image: string }[] = [
  { cls: 'E', image: '/fleet-eclass.png' },
  { cls: 'V', image: '/fleet-vclass.png' },
  { cls: 'S', image: '/fleet-sclass.png' },
];

interface ContactForm {
  email: string; fullName: string; phone: string;
  passengers: number; luggage: number;
  flightNo: string; pickupSign: string; notes: string;
  pets: boolean; childSeat: boolean; fastExit: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const todayISO = () => new Date().toISOString().slice(0, 10);

function reference(): string {
  return `OS-${Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, '0')}`;
}

/** Wizard de réservation plein écran — setup (mode + horaire) puis 3 étapes, design luxe noir & or. */
export default function BookingWizard({ open, onClose, ctx }: Props) {
  const { t, lang } = useI18n();
  const w = t.wizard;
  const c = t.calculator;

  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<Mode>('oneway');
  const [roundTrip, setRoundTrip] = useState(false);
  const [date, setDate] = useState(todayISO);
  const [time, setTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('18:00');
  const [hours, setHours] = useState(HOURLY_MIN_HOURS);
  const [estimate, setEstimate] = useState<OneWayEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const [step, setStep] = useState<StepId>(1);
  const [vehicle, setVehicle] = useState<VehicleClass | null>(null);
  const [pay, setPay] = useState<PayMethod>('transfer');
  const [promo, setPromo] = useState('');
  const [promoOn, setPromoOn] = useState(false);
  const [submit, setSubmit] = useState<Submit>('idle');
  const [ref, setRef] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState<ContactForm>({
    email: '', fullName: '', phone: '', passengers: 2, luggage: 2,
    flightNo: '', pickupSign: '', notes: '', pets: false, childSeat: false, fastExit: false,
  });

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Réinitialise UNIQUEMENT à l'ouverture + verrouille le scroll.
  useEffect(() => {
    if (!open) return;
    setPhase('setup'); setMode('oneway'); setRoundTrip(false); setDate(todayISO()); setTime('10:00');
    setReturnDate(''); setReturnTime('18:00'); setHours(HOURLY_MIN_HOURS);
    setEstimate(null); setEstimating(false);
    setStep(1); setVehicle(null); setSubmit('idle'); setShowErrors(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  // Aller-retour = deux transferts (règle tarifaire officielle) → prix × 2.
  const isRound = mode === 'oneway' && roundTrip;
  const prices = useMemo(() => {
    const base = mode === 'hourly' ? estimateHourly(hours).prices : estimate?.prices ?? null;
    if (!base || !isRound) return base;
    return { E: base.E * 2, V: base.V * 2, S: base.S * 2 };
  }, [mode, hours, estimate, isRound]);

  const amount = vehicle && prices ? prices[vehicle] : 0;
  const vehicleName = vehicle ? VEHICLE_CLASSES[vehicle].name : '';
  const distanceKm = mode === 'oneway' ? estimate?.distanceKm : undefined;

  const dateLabel = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES', ru: 'ru-RU', ar: 'ar' } as Record<typeof lang, string>)[lang], { day: '2-digit', month: 'long', year: 'numeric' });
  }, [date, lang]);

  if (!open) return null;

  const set = <K extends keyof ContactForm>(key: K, value: ContactForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const emailErr = showErrors && (!form.email.trim() || !EMAIL_RE.test(form.email));
  const nameErr = showErrors && !form.fullName.trim();
  const phoneErr = showErrors && !form.phone.trim();

  // Étape 0 → réutilise l'estimation du hero (ou la calcule) puis entre dans le flux.
  const startFlow = async () => {
    if (mode === 'oneway') {
      if (!ctx.to) return;
      if (ctx.estimate) {
        setEstimate(ctx.estimate);
      } else {
        setEstimating(true);
        try { setEstimate(await estimatePlaces(ctx.from, ctx.to)); }
        finally { setEstimating(false); }
      }
    }
    setStep(1);
    setPhase('flow');
  };

  const chooseVehicle = (cls: VehicleClass) => { setVehicle(cls); setStep(2); };

  const goPayment = () => {
    setShowErrors(true);
    if (!form.email.trim() || !EMAIL_RE.test(form.email) || !form.fullName.trim() || !form.phone.trim()) return;
    setStep(3);
  };

  const confirm = async () => {
    if (!vehicle) return;
    setSubmit('sending');
    const parts = form.fullName.trim().split(/\s+/);
    const first_name = parts.shift() ?? '';
    const last_name = parts.join(' ');
    const prefill =
      `${estimate?.routeLabel ?? ''} — ${vehicleName} — ${amount}€${mode === 'hourly' ? ` — ${hours}h` : ''}${isRound ? ' — A/R' : ''}`;
    const payload = {
      type: 'booking', channel: 'siteweb',
      website: '', // honeypot anti-bot (doit rester vide)
      data: {
        first_name, last_name, phone: form.phone, email: form.email,
        pickup: ctx.from.label,
        destination: mode === 'oneway' ? (ctx.to?.label ?? '') : w.onDemand,
        travel_date: date, travel_time: time,
        return_date: isRound ? returnDate : '',
        return_time: isRound ? returnTime : '',
        passengers: form.passengers, vehicle_class: vehicle, prefill,
        notes: [isRound ? `${w.tripRound} — ${w.recapReturn} ${returnDate} ${returnTime}` : '', form.notes]
          .filter(Boolean).join(' · '),
        route_id: mode === 'oneway' ? (ctx.estimate?.routeId ?? null) : null,
        price_amount: amount, // indicatif — le serveur recalcule depuis la grille
      },
      pricing: {
        mode,
        roundTrip: isRound,
        routeId: mode === 'oneway' ? (ctx.estimate?.routeId ?? null) : null,
        distanceKm: mode === 'oneway' ? (ctx.estimate?.distanceKm ?? null) : null,
        hours: mode === 'hourly' ? hours : null,
        vehicleClass: vehicle,
      },
    };
    try {
      const res = await fetch('/api/intake', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) { setRef(reference()); setSubmit('ok'); } else setSubmit('error');
    } catch { setSubmit('error'); }
  };

  const steps: { id: StepId; label: string }[] = [
    { id: 1, label: w.steps.vehicle },
    { id: 2, label: w.steps.contact },
    { id: 3, label: w.steps.payment },
  ];

  return (
    <div className="osw" role="dialog" aria-modal aria-label={t.nav.book}>
      <div className="osw__overlay" onClick={onClose} aria-hidden />
      <div className="osw__panel">
        <button className="osw__close" onClick={onClose} aria-label={t.common.close}>×</button>

        {submit === 'ok' ? (
          <ConfirmationScreen title={w.confirmedTitle} sub={w.confirmedSub} refLabel={w.reference} refValue={ref} closeLabel={t.common.close} onClose={onClose} />
        ) : phase === 'setup' ? (
          /* ————— Étape 0 : trajet, mode et horaire ————— */
          <section className="osw__setup">
            <h3 className="osw__title">{w.setupTitle}</h3>
            <p className="osw__sub">{w.setupSub}</p>

            <div className="osw__trip">
              <div className="osw__trip-pt"><span className="osw__dot" aria-hidden /><div><small>{w.recapFrom}</small><strong>{ctx.from.label}</strong></div></div>
              {ctx.to && <div className="osw__trip-pt"><span className="osw__dot osw__dot--end" aria-hidden /><div><small>{w.recapTo}</small><strong>{ctx.to.label}</strong></div></div>}
            </div>

            <div className="osw__modes">
              <button type="button" className={`osw__mode${mode === 'oneway' ? ' is-active' : ''}`} onClick={() => setMode('oneway')} aria-pressed={mode === 'oneway'}>
                <strong>{c.tabOneWay}</strong>
                <span>{w.modeOneWaySub}</span>
              </button>
              <button type="button" className={`osw__mode${mode === 'hourly' ? ' is-active' : ''}`} onClick={() => setMode('hourly')} aria-pressed={mode === 'hourly'}>
                <strong>{c.tabHourly}</strong>
                <span>{w.modeHourlySub}</span>
              </button>
            </div>

            {mode === 'oneway' && (
              <div className="osw__trip-type" role="radiogroup" aria-label={w.recapMode}>
                <button type="button" className={`osw__tt${!roundTrip ? ' is-active' : ''}`}
                  onClick={() => setRoundTrip(false)} aria-pressed={!roundTrip}>
                  → {w.tripOne}
                </button>
                <button type="button" className={`osw__tt${roundTrip ? ' is-active' : ''}`}
                  onClick={() => { setRoundTrip(true); if (!returnDate) setReturnDate(date); }} aria-pressed={roundTrip}>
                  ⇄ {w.tripRound}
                </button>
                {roundTrip && <small className="osw__tt-note">{w.tripRoundNote}</small>}
              </div>
            )}

            <div className="osw__setup-grid">
              <DateField label={c.date} value={date} min={todayISO()} locale={lang} onChange={setDate} />
              <TimeField label={c.time} value={time} locale={lang} onChange={setTime} />
              {isRound && (
                <>
                  <DateField label={w.returnDate} value={returnDate} min={date} locale={lang} onChange={setReturnDate} />
                  <TimeField label={w.returnTime} value={returnTime} locale={lang} onChange={setReturnTime} />
                </>
              )}
              {mode === 'hourly' && (
                <label className="osw__field">
                  <span>{c.duration}</span>
                  <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                    {Array.from({ length: 10 }, (_, i) => i + HOURLY_MIN_HOURS).map((h) => (
                      <option key={h} value={h}>{c.hoursOption.replace('{n}', String(h))}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="osw__actions">
              <button className="os-btn os-btn--ghost" onClick={onClose}>{t.common.close}</button>
              <button className="os-btn os-btn--gold" onClick={startFlow} disabled={estimating}>
                {estimating ? c.calculating : w.continue}
              </button>
            </div>
          </section>
        ) : (
          /* ————— Flux : véhicule → coordonnées → paiement ————— */
          <>
            <div className="osw__stepper" role="list">
              {steps.map((s, i) => (
                <div key={s.id} role="listitem" className={`osw__step${step === s.id ? ' is-active' : ''}${step > s.id ? ' is-done' : ''}`}>
                  <span className="osw__step-num">{String(s.id).padStart(2, '0')}</span>
                  <span className="osw__step-label">{s.label}</span>
                  {i < steps.length - 1 && <span className="osw__step-line" aria-hidden />}
                </div>
              ))}
            </div>

            <div className="osw__body">
              <div className="osw__main">
                {step === 1 && (
                  <section className="osw__section">
                    <h3 className="osw__title">{w.vehicleTitle}</h3>
                    <p className="osw__sub">{w.vehicleSub}</p>
                    <div className="osw__vehicles">
                      {WIZARD_VEHICLES.map(({ cls, image }) => {
                        const info = VEHICLE_CLASSES[cls];
                        const fleet = FLEET.find((f) => f.className === info.name);
                        return (
                          <article key={cls} className={`osw__vcard${vehicle === cls ? ' is-selected' : ''}`}>
                            <div className="osw__vimg"><img src={image} alt={fleet?.name ?? info.name} loading="lazy" /></div>
                            <div className="osw__vinfo">
                              <strong className="osw__vname">{fleet?.name ?? info.name}</strong>
                              <span className="osw__vmeta">{info.seats} {w.seats} · {info.luggage} {w.luggage}</span>
                            </div>
                            <div className="osw__vprice">
                              <span className="osw__vfrom">{c.fromPrice}</span>
                              <strong>{prices ? formatEUR(prices[cls]) : '—'}</strong>
                            </div>
                            <button className="os-btn os-btn--gold osw__vbtn" onClick={() => chooseVehicle(cls)}>{w.select}</button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                {step === 2 && (
                  <section className="osw__section">
                    <h3 className="osw__title">{w.contactTitle}</h3>
                    <p className="osw__sub">{w.contactSub}</p>
                    <div className="osw__form">
                      <label className={`osw__field${emailErr ? ' is-err' : ''}`}>
                        <span>{w.email} *</span>
                        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                        {emailErr && <em className="osw__err">{form.email.trim() ? w.errEmail : w.errRequired}</em>}
                      </label>
                      <label className={`osw__field${nameErr ? ' is-err' : ''}`}>
                        <span>{w.fullName} *</span>
                        <input type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
                        {nameErr && <em className="osw__err">{w.errRequired}</em>}
                      </label>
                      <label className={`osw__field${phoneErr ? ' is-err' : ''}`}>
                        <span>{w.phone} *</span>
                        <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
                        {phoneErr && <em className="osw__err">{w.errRequired}</em>}
                      </label>
                      <div className="osw__field-grid">
                        <label className="osw__field">
                          <span>{w.passengers}</span>
                          <input type="number" min={1} max={16} value={form.passengers} onChange={(e) => set('passengers', Math.max(1, Number(e.target.value) || 1))} />
                        </label>
                        <label className="osw__field">
                          <span>{w.luggageCount}</span>
                          <input type="number" min={0} max={16} value={form.luggage} onChange={(e) => set('luggage', Math.max(0, Number(e.target.value) || 0))} />
                        </label>
                      </div>
                      <div className="osw__field-grid">
                        <label className="osw__field">
                          <span>{w.flightNo}</span>
                          <input type="text" value={form.flightNo} onChange={(e) => set('flightNo', e.target.value)} placeholder="AF1234" />
                        </label>
                        <label className="osw__field">
                          <span>{w.pickupSign}</span>
                          <input type="text" value={form.pickupSign} onChange={(e) => set('pickupSign', e.target.value)} />
                        </label>
                      </div>
                      <label className="osw__field osw__field--full">
                        <span>{w.notes}</span>
                        <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={w.notesPlaceholder} />
                      </label>
                      <div className="osw__checks">
                        <label className="osw__check"><input type="checkbox" checked={form.pets} onChange={(e) => set('pets', e.target.checked)} /><span>{w.pets}</span></label>
                        <label className="osw__check"><input type="checkbox" checked={form.childSeat} onChange={(e) => set('childSeat', e.target.checked)} /><span>{w.childSeat}</span></label>
                        <label className="osw__check"><input type="checkbox" checked={form.fastExit} onChange={(e) => set('fastExit', e.target.checked)} /><span>{w.fastExit}</span></label>
                      </div>
                    </div>
                    <div className="osw__actions">
                      <button className="os-btn os-btn--ghost" onClick={() => setStep(1)}>{w.back}</button>
                      <button className="os-btn os-btn--gold" onClick={goPayment}>{w.continue}</button>
                    </div>
                  </section>
                )}

                {step === 3 && (
                  <section className="osw__section">
                    <h3 className="osw__title">{w.paymentTitle}</h3>
                    <p className="osw__sub">{w.paymentSub}</p>
                    <div className="osw__total"><span>{w.total}</span><strong>{formatEUR(amount)}</strong></div>
                    <div className="osw__paylabel">{w.payMethod}</div>
                    <div className="osw__pays">
                      <button type="button" className={`osw__pay${pay === 'transfer' ? ' is-active' : ''}`} onClick={() => setPay('transfer')} aria-pressed={pay === 'transfer'}>{w.bankTransfer}</button>
                      <button type="button" className={`osw__pay${pay === 'paypal' ? ' is-active' : ''}`} onClick={() => setPay('paypal')} aria-pressed={pay === 'paypal'}>{w.paypal}</button>
                    </div>
                    <div className="osw__paylabel">{w.promoCode}</div>
                    <div className="osw__promo">
                      <input type="text" value={promo} onChange={(e) => { setPromo(e.target.value); setPromoOn(false); }} placeholder={w.promoPlaceholder} />
                      <button type="button" className="os-btn os-btn--ghost" disabled={!promo.trim()} onClick={() => setPromoOn(true)}>{w.apply}</button>
                    </div>
                    {promoOn && <p className="osw__promo-ok">✓ {w.promoApplied}</p>}
                    {submit === 'error' && <p className="osw__error-msg">{w.errorSub}</p>}
                    <div className="osw__actions">
                      <button className="os-btn os-btn--ghost" onClick={() => setStep(2)}>{w.back}</button>
                      <button className="os-btn os-btn--gold" onClick={confirm} disabled={submit === 'sending'}>
                        {submit === 'sending' ? w.confirming : w.confirm}
                      </button>
                    </div>
                  </section>
                )}
              </div>

              {/* Récap sticky */}
              <aside className="osw__recap">
                <div className="osw__recap-head">
                  <h4>{w.recapTitle}</h4>
                  <button type="button" className="osw__recap-edit" onClick={() => setPhase('setup')}>{w.edit}</button>
                </div>
                <div className="osw__recap-route">
                  <span className="osw__dot" aria-hidden />
                  <div><small>{w.recapFrom}</small><strong>{ctx.from.label}</strong></div>
                </div>
                {mode === 'oneway' && ctx.to && (
                  <div className="osw__recap-route">
                    <span className="osw__dot osw__dot--end" aria-hidden />
                    <div><small>{w.recapTo}</small><strong>{ctx.to.label}</strong></div>
                  </div>
                )}
                <ul className="osw__recap-list">
                  <li><span>{w.recapMode}</span><strong>{mode === 'hourly' ? c.tabHourly : isRound ? w.tripRound : w.tripOne}</strong></li>
                  <li><span>{w.recapDate}</span><strong>{dateLabel}</strong></li>
                  <li><span>{w.recapTime}</span><strong>{time}</strong></li>
                  {isRound && <li><span>{w.recapReturn}</span><strong>{returnDate} · {returnTime}</strong></li>}
                  {mode === 'oneway' && distanceKm != null && (
                    <li><span>{w.recapDistance}</span><strong>≈ {distanceKm} {c.km}</strong></li>
                  )}
                  {mode === 'hourly' && <li><span>{w.recapDuration}</span><strong>{hours} {w.hoursShort}</strong></li>}
                  {vehicle && <li><span>{w.recapVehicle}</span><strong>{vehicleName}</strong></li>}
                </ul>
                <div className="osw__recap-amount">
                  <span>{w.recapAmount}</span>
                  <strong>{vehicle && prices ? formatEUR(amount) : '—'}</strong>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmationScreen({ title, sub, refLabel, refValue, closeLabel, onClose }: {
  title: string; sub: string; refLabel: string; refValue: string; closeLabel: string; onClose: () => void;
}) {
  return (
    <div className="osw__done">
      <div className="osw__done-check" aria-hidden>
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </div>
      <h3 className="osw__title">{title}</h3>
      <p className="osw__sub">{sub}</p>
      <p className="osw__ref">{refLabel} <strong>{refValue}</strong></p>
      <button className="os-btn os-btn--gold" onClick={onClose}>{closeLabel}</button>
    </div>
  );
}
