import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { VEHICLE_CLASSES, type VehicleClass } from '@/data/pricing';
import { FLEET } from '@/data/fleet';
import { formatEUR } from '@/lib/pricing';
import type { Place } from '@/lib/geocode';
import './wizard.css';

/** Contexte transmis par le calculateur au wizard de réservation. */
export interface BookingContext {
  mode: 'oneway' | 'hourly';
  from: Place;
  to?: Place;
  date: string;
  time: string;
  hours?: number;
  prices: { E: number; V: number; S: number };
  distanceKm?: number;
  routeLabel?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  ctx: BookingContext;
}

type StepId = 1 | 2 | 3;
type PayMethod = 'transfer' | 'paypal';
type Submit = 'idle' | 'sending' | 'ok' | 'error';

/** Les 3 véhicules mappés aux classes tarifaires (image + méta flotte). */
const WIZARD_VEHICLES: { cls: VehicleClass; image: string }[] = [
  { cls: 'E', image: '/fleet-eclass.png' },
  { cls: 'V', image: '/fleet-vclass.png' },
  { cls: 'S', image: '/fleet-sclass.png' },
];

interface ContactForm {
  email: string;
  fullName: string;
  phone: string;
  passengers: number;
  luggage: number;
  flightNo: string;
  pickupSign: string;
  notes: string;
  pets: boolean;
  childSeat: boolean;
  fastExit: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function reference(): string {
  return `OS-${Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, '0')}`;
}

/** Wizard de réservation plein écran — 3 étapes, design luxe noir & or. */
export default function BookingWizard({ open, onClose, ctx }: Props) {
  const { t, lang } = useI18n();
  const w = t.wizard;

  const [step, setStep] = useState<StepId>(1);
  const [vehicle, setVehicle] = useState<VehicleClass | null>(null);
  const [pay, setPay] = useState<PayMethod>('transfer');
  const [promo, setPromo] = useState('');
  const [promoOn, setPromoOn] = useState(false);
  const [submit, setSubmit] = useState<Submit>('idle');
  const [ref, setRef] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState<ContactForm>({
    email: '', fullName: '', phone: '',
    passengers: 2, luggage: 2,
    flightNo: '', pickupSign: '', notes: '',
    pets: false, childSeat: false, fastExit: false,
  });

  // onClose dans un ref pour ne pas relancer l'effet (sinon reset intempestif pendant la saisie).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Réinitialise UNIQUEMENT à l'ouverture + verrouille le scroll.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setVehicle(null);
    setSubmit('idle');
    setShowErrors(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const amount = vehicle ? ctx.prices[vehicle] : 0;
  const vehicleName = vehicle ? VEHICLE_CLASSES[vehicle].name : '';

  const dateLabel = useMemo(() => {
    if (!ctx.date) return '—';
    const d = new Date(`${ctx.date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return ctx.date;
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  }, [ctx.date, lang]);

  if (!open) return null;

  const set = <K extends keyof ContactForm>(key: K, value: ContactForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const emailErr = showErrors && (!form.email.trim() || !EMAIL_RE.test(form.email));
  const nameErr = showErrors && !form.fullName.trim();
  const phoneErr = showErrors && !form.phone.trim();

  const chooseVehicle = (cls: VehicleClass) => {
    setVehicle(cls);
    setStep(2);
  };

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
      `${ctx.routeLabel ?? ''} — ${vehicleName} — ${amount}€${ctx.mode === 'hourly' ? ` — ${ctx.hours}h` : ''}`;
    const payload = {
      type: 'booking',
      channel: 'siteweb',
      data: {
        first_name,
        last_name,
        phone: form.phone,
        email: form.email,
        pickup: ctx.from.label,
        destination: ctx.to?.label ?? w.onDemand,
        travel_date: ctx.date,
        travel_time: ctx.time,
        passengers: form.passengers,
        vehicle_class: vehicle,
        prefill,
        notes: form.notes,
      },
    };
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setRef(reference());
        setSubmit('ok');
      } else {
        setSubmit('error');
      }
    } catch {
      setSubmit('error');
    }
  };

  const steps: { id: StepId; label: string }[] = [
    { id: 1, label: w.steps.vehicle },
    { id: 2, label: w.steps.contact },
    { id: 3, label: w.steps.payment },
  ];

  return (
    <div className="osw" role="dialog" aria-modal aria-label={t.nav.book} onClick={onClose}>
      <div className="osw__panel" onClick={(e) => e.stopPropagation()}>
        <button className="osw__close" onClick={onClose} aria-label={t.common.close}>×</button>

        {submit === 'ok' ? (
          <ConfirmationScreen title={w.confirmedTitle} sub={w.confirmedSub} refLabel={w.reference} refValue={ref} closeLabel={t.common.close} onClose={onClose} />
        ) : (
          <>
            {/* Stepper */}
            <div className="osw__stepper" role="list">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  role="listitem"
                  className={`osw__step${step === s.id ? ' is-active' : ''}${step > s.id ? ' is-done' : ''}`}
                >
                  <span className="osw__step-num">{String(s.id).padStart(2, '0')}</span>
                  <span className="osw__step-label">{s.label}</span>
                  {i < steps.length - 1 && <span className="osw__step-line" aria-hidden />}
                </div>
              ))}
            </div>

            <div className="osw__body">
              {/* Colonne gauche : contenu de l'étape */}
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
                            <div className="osw__vimg">
                              <img src={image} alt={fleet?.name ?? info.name} loading="lazy" />
                            </div>
                            <div className="osw__vinfo">
                              <strong className="osw__vname">{fleet?.name ?? info.name}</strong>
                              <span className="osw__vmeta">{info.seats} {w.seats} · {info.luggage} {w.luggage}</span>
                            </div>
                            <div className="osw__vprice">
                              <span className="osw__vfrom">{t.calculator.fromPrice}</span>
                              <strong>{formatEUR(ctx.prices[cls])}</strong>
                            </div>
                            <button className="os-btn os-btn--gold osw__vbtn" onClick={() => chooseVehicle(cls)}>
                              {w.select}
                            </button>
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
                          <input type="number" min={1} max={16} value={form.passengers}
                            onChange={(e) => set('passengers', Math.max(1, Number(e.target.value) || 1))} />
                        </label>
                        <label className="osw__field">
                          <span>{w.luggageCount}</span>
                          <input type="number" min={0} max={16} value={form.luggage}
                            onChange={(e) => set('luggage', Math.max(0, Number(e.target.value) || 0))} />
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
                        <label className="osw__check">
                          <input type="checkbox" checked={form.pets} onChange={(e) => set('pets', e.target.checked)} />
                          <span>{w.pets}</span>
                        </label>
                        <label className="osw__check">
                          <input type="checkbox" checked={form.childSeat} onChange={(e) => set('childSeat', e.target.checked)} />
                          <span>{w.childSeat}</span>
                        </label>
                        <label className="osw__check">
                          <input type="checkbox" checked={form.fastExit} onChange={(e) => set('fastExit', e.target.checked)} />
                          <span>{w.fastExit}</span>
                        </label>
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

                    <div className="osw__total">
                      <span>{w.total}</span>
                      <strong>{formatEUR(amount)}</strong>
                    </div>

                    <div className="osw__paylabel">{w.payMethod}</div>
                    <div className="osw__pays">
                      <button
                        type="button"
                        className={`osw__pay${pay === 'transfer' ? ' is-active' : ''}`}
                        onClick={() => setPay('transfer')}
                        aria-pressed={pay === 'transfer'}
                      >
                        {w.bankTransfer}
                      </button>
                      <button
                        type="button"
                        className={`osw__pay${pay === 'paypal' ? ' is-active' : ''}`}
                        onClick={() => setPay('paypal')}
                        aria-pressed={pay === 'paypal'}
                      >
                        {w.paypal}
                      </button>
                    </div>

                    <div className="osw__paylabel">{w.promoCode}</div>
                    <div className="osw__promo">
                      <input type="text" value={promo} onChange={(e) => { setPromo(e.target.value); setPromoOn(false); }} placeholder={w.promoPlaceholder} />
                      <button type="button" className="os-btn os-btn--ghost" disabled={!promo.trim()} onClick={() => setPromoOn(true)}>
                        {w.apply}
                      </button>
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

              {/* Colonne droite : récap sticky */}
              <aside className="osw__recap">
                <div className="osw__recap-head">
                  <h4>{w.recapTitle}</h4>
                  <button type="button" className="osw__recap-edit" onClick={() => setStep(1)}>{w.edit}</button>
                </div>
                <div className="osw__recap-route">
                  <span className="osw__dot" aria-hidden />
                  <div>
                    <small>{w.recapFrom}</small>
                    <strong>{ctx.from.label}</strong>
                  </div>
                </div>
                {ctx.mode === 'oneway' && ctx.to && (
                  <div className="osw__recap-route">
                    <span className="osw__dot osw__dot--end" aria-hidden />
                    <div>
                      <small>{w.recapTo}</small>
                      <strong>{ctx.to.label}</strong>
                    </div>
                  </div>
                )}
                <ul className="osw__recap-list">
                  <li><span>{w.recapDate}</span><strong>{dateLabel}</strong></li>
                  <li><span>{w.recapTime}</span><strong>{ctx.time}</strong></li>
                  {ctx.mode === 'oneway' && ctx.distanceKm != null && (
                    <li><span>{w.recapDistance}</span><strong>≈ {ctx.distanceKm} {t.calculator.km}</strong></li>
                  )}
                  {ctx.mode === 'hourly' && ctx.hours != null && (
                    <li><span>{w.recapDuration}</span><strong>{ctx.hours} {w.hoursShort}</strong></li>
                  )}
                  {vehicle && <li><span>{w.recapVehicle}</span><strong>{vehicleName}</strong></li>}
                </ul>
                <div className="osw__recap-amount">
                  <span>{w.recapAmount}</span>
                  <strong>{vehicle ? formatEUR(amount) : '—'}</strong>
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
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h3 className="osw__title">{title}</h3>
      <p className="osw__sub">{sub}</p>
      <p className="osw__ref">{refLabel} <strong>{refValue}</strong></p>
      <button className="os-btn os-btn--gold" onClick={onClose}>{closeLabel}</button>
    </div>
  );
}
