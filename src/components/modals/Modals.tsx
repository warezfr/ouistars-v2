import { useEffect, useRef, useState, type ReactNode, type FormEvent, type ChangeEvent } from 'react';
import { useI18n, pickL } from '@/i18n';
import { DateField, TimeField } from '@/components/booking/pickers';
import './modal.css';

const WA_NUMBER = '33651030306';

async function postIntake(payload: unknown): Promise<{ ok: boolean; reference?: string }> {
  try {
    const res = await fetch('/api/intake', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json().catch(() => ({}))) as { reference?: string };
    return { ok: true, reference: json.reference };
  } catch {
    return { ok: false };
  }
}

/* ————— Validation « vibration dorée » ————— */
function shakeField(el: HTMLElement) {
  el.classList.remove('os-invalid');
  void el.offsetWidth; // reflow → l'animation repart à chaque tentative
  el.classList.add('os-invalid');
  el.addEventListener('input', () => el.classList.remove('os-invalid'), { once: true });
}

/** Vérifie les champs requis (+ noms additionnels selon le canal) ;
    fait vibrer en doré chaque champ manquant/invalide. */
export function validateForm(form: HTMLFormElement, extraRequired: string[] = []): boolean {
  let firstBad: HTMLInputElement | HTMLTextAreaElement | null = null;
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
    if ((el as HTMLInputElement).type === 'hidden') return; // pickers → validés à part
    const required = el.required || extraRequired.includes(el.name);
    const empty = !el.value.trim();
    const bad = (required && empty) || (!empty && !el.checkValidity());
    if (bad) { shakeField(el); if (!firstBad) firstBad = el; }
  });
  (firstBad as HTMLInputElement | null)?.focus();
  return !firstBad;
}

function Shell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="os-modal" role="dialog" aria-modal aria-label={title} onClick={onClose}>
      <div className="os-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button className="os-modal__close" onClick={onClose} aria-label={t.common.close}>×</button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

type Channel = 'email' | 'whatsapp';

/** Envoi bi-canal : e-mail (serveur) ou WhatsApp (capture back-office + wa.me).
    Les champs requis du canal sont validés avec vibration dorée. */
function useSubmit(type: string, opts?: { waText?: (d: Record<string, string>, ref: string) => string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [ref, setRef] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const send = async (channel: Channel, extraRequired: string[], extraOk = true) => {
    const form = formRef.current;
    if (!form) return;
    const fieldsOk = validateForm(form, extraRequired); // fait toujours vibrer les manquants
    if (!fieldsOk || !extraOk) return;
    setState('sending');
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const res = await postIntake({ type, channel: channel === 'whatsapp' ? 'whatsapp' : 'siteweb', data });
    const reference = res.reference ?? `OS-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    if (channel === 'whatsapp') {
      // Même hors ligne, le client peut joindre la conciergerie : on ouvre WhatsApp.
      const txt = opts?.waText?.(data, res.ok ? reference : '') ?? `Bonjour Oui Stars — réf ${reference}`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
      setRef(reference); setState('ok');
      return;
    }
    if (res.ok) { setRef(reference); setState('ok'); }
    else setState('error');
  };

  const submit = (e: FormEvent<HTMLFormElement>) => e.preventDefault();
  return { state, ref, formRef, send, submit };
}

/** Paire de boutons e-mail / WhatsApp commune aux formulaires. */
function SendButtons({ sending, onEmail, onWhatsApp }: { sending: boolean; onEmail: () => void; onWhatsApp: () => void }) {
  const { t } = useI18n();
  return (
    <div className="os-form__sends">
      <button type="button" className="os-btn os-btn--gold" disabled={sending} onClick={onEmail}>
        {sending ? t.common.sending : t.common.sendEmail}
      </button>
      <button type="button" className="os-btn os-btn--wa" disabled={sending} onClick={onWhatsApp}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden><path d="M20 4A10 10 0 0 0 3.6 15.6L2 22l6.6-1.6A10 10 0 1 0 20 4zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-3.9.9.9-3.8-.2-.3A8 8 0 1 1 12 20zm4.5-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6 8.4a4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c2 .9 2.1.6 2.5.6a2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .1-1.1c0-.1-.3-.2-.5-.3z"/></svg>
        {t.common.sendWhatsApp}
      </button>
    </div>
  );
}

export function BookingModal({ open, onClose, prefill }: { open: boolean; onClose: () => void; prefill?: string }) {
  const { t, lang } = useI18n();
  const [tDate, setTDate] = useState('');
  const [tTime, setTTime] = useState('');
  const [dateInvalid, setDateInvalid] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const { state, ref, formRef, send, submit } = useSubmit('booking', {
    waText: (d, r) =>
      `${pickL(lang, { fr: 'Bonjour Oui Stars, je souhaite réserver', en: 'Hello Oui Stars, I would like to book', es: 'Hola Oui Stars, deseo reservar', ru: 'Здравствуйте, Oui Stars, хочу забронировать', ar: 'مرحباً Oui Stars، أودّ الحجز' })} : ` +
      `${d.prefill || `${d.pickup} → ${d.destination}`} · ${d.travel_date ?? ''} ${d.travel_time ?? ''}` +
      ` · ${d.passengers ?? 1} pax — ${d.first_name} ${d.last_name} · ${d.phone}${r ? ` · réf ${r}` : ''}` +
      `${d.notes ? ` · ${d.notes}` : ''}`,
  });
  const trySend = (channel: Channel, extra: string[]) => {
    const dateOk = Boolean(tDate);
    if (!dateOk) { setDateInvalid(false); requestAnimationFrame(() => setDateInvalid(true)); }
    send(channel, extra, dateOk);
  };
  return (
    <Shell open={open} onClose={onClose} title={t.nav.book}>
      {state === 'ok' ? (
        <p className="os-modal__ok">✓ {t.common.send} — réf. <strong>{ref}</strong></p>
      ) : (
        <form className="os-form" onSubmit={submit} ref={formRef} noValidate>
          {prefill && <input type="text" name="prefill" defaultValue={prefill} readOnly className="os-form__prefill" />}
          <div className="os-form__row">
            <input name="first_name" placeholder={`${t.meetGreet.firstName} *`} required />
            <input name="last_name" placeholder={`${t.meetGreet.lastName} *`} required />
          </div>
          <div className="os-form__row">
            <input name="phone" placeholder={`${t.meetGreet.phone} *`} required />
            <input name="email" type="email" placeholder={`${t.meetGreet.email} *`} />
          </div>
          <div className={`os-form__row os-form__pickers${dateInvalid ? ' os-invalid-wrap' : ''}`}>
            <DateField value={tDate} min={today} locale={lang}
              label={`${t.wizard.recapDate} *`}
              onChange={(v) => { setTDate(v); setDateInvalid(false); }} />
            <TimeField value={tTime} locale={lang} label={t.wizard.recapTime} onChange={setTTime} />
          </div>
          <input type="hidden" name="travel_date" value={tDate} />
          <input type="hidden" name="travel_time" value={tTime} />
          <input name="pickup" placeholder={`${t.calculator.fromLabel} *`} required />
          <input name="destination" placeholder={`${t.calculator.toLabel} *`} required />
          <input name="passengers" type="number" min={1} defaultValue={2} placeholder={t.calculator.passengers} />
          <textarea name="notes" placeholder={t.wizard.notesPlaceholder} rows={3} />
          <SendButtons sending={state === 'sending'}
            onEmail={() => trySend('email', ['email'])}
            onWhatsApp={() => trySend('whatsapp', [])} />
          <p className="os-form__reqnote">* {t.common.required}</p>
          {state === 'error' && <p className="os-modal__err">{t.meetGreet.error}</p>}
        </form>
      )}
    </Shell>
  );
}

export function QuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const { state, ref, formRef, send, submit } = useSubmit('quote', {
    waText: (d, r) =>
      `${pickL(lang, { fr: 'Bonjour Oui Stars, demande de devis', en: 'Hello Oui Stars, quote request', es: 'Hola Oui Stars, solicitud de presupuesto', ru: 'Здравствуйте, Oui Stars, запрос расчёта', ar: 'مرحباً Oui Stars، طلب عرض سعر' })} : ` +
      `${d.company ?? ''} · ${d.event_type ?? ''} · ${d.start_date ?? ''}${d.end_date ? ` → ${d.end_date}` : ''}` +
      ` — ${d.contact ?? ''} · ${d.phone ?? ''}${r ? ` · réf ${r}` : ''}${d.details ? ` · ${d.details}` : ''}`,
  });
  return (
    <Shell open={open} onClose={onClose} title={t.nav.quote}>
      {state === 'ok' ? (
        <p className="os-modal__ok">✓ {t.common.send} — réf. <strong>{ref}</strong></p>
      ) : (
        <form className="os-form" onSubmit={submit} ref={formRef} noValidate>
          <input name="company" placeholder={`${pickL(lang, { fr: 'Société', en: 'Company', es: 'Empresa', ru: 'Компания', ar: 'الشركة' })} *`} required />
          <input name="contact" placeholder={`${pickL(lang, { fr: 'Contact', en: 'Contact', es: 'Contacto', ru: 'Контактное лицо', ar: 'جهة الاتصال' })} *`} required />
          <div className="os-form__row">
            <input name="email" type="email" placeholder={`${t.meetGreet.email} *`} />
            <input name="phone" placeholder={`${t.meetGreet.phone} *`} />
          </div>
          <input name="event_type" placeholder={pickL(lang, { fr: 'Type (congrès, gala, fashion week, délégation…)', en: 'Type (congress, gala, fashion week, delegation…)', es: 'Tipo (congreso, gala, fashion week, delegación…)', ru: 'Тип (конгресс, гала, неделя моды, делегация…)', ar: 'النوع (مؤتمر، حفل، أسبوع موضة، وفد…)' })} />
          <div className="os-form__row os-form__pickers">
            <DateField value={startDate} min={today} locale={lang}
              label={pickL(lang, { fr: 'Début', en: 'Start', es: 'Inicio', ru: 'Начало', ar: 'البداية' })}
              onChange={setStartDate} />
            <DateField value={endDate} min={startDate || today} locale={lang}
              label={pickL(lang, { fr: 'Fin', en: 'End', es: 'Fin', ru: 'Окончание', ar: 'النهاية' })}
              onChange={setEndDate} />
          </div>
          <input type="hidden" name="start_date" value={startDate} />
          <input type="hidden" name="end_date" value={endDate} />
          <input name="vehicles" type="number" min={1} defaultValue={1} placeholder={pickL(lang, { fr: 'Véhicules estimés', en: 'Estimated vehicles', es: 'Vehículos estimados', ru: 'Примерное число машин', ar: 'عدد السيارات المتوقع' })} />
          <textarea name="details" placeholder={pickL(lang, { fr: 'Votre besoin', en: 'Your needs', es: 'Su necesidad', ru: 'Ваш запрос', ar: 'احتياجكم' })} rows={3} />
          <SendButtons sending={state === 'sending'}
            onEmail={() => send('email', ['email'])}
            onWhatsApp={() => send('whatsapp', ['phone'])} />
          <p className="os-form__reqnote">* {t.common.required}</p>
          {state === 'error' && <p className="os-modal__err">{t.meetGreet.error}</p>}
        </form>
      )}
    </Shell>
  );
}

/* ————————————————————————————————————————————————————————————————
   Candidature chauffeur complète — héritée de « Become a partner »
   (ancien site) : identité, véhicule, PIÈCES JOINTES OBLIGATOIRES.
   Dépôt en 3 temps vers /api/apply (create → doc… → finalize) :
   le serveur re-contrôle les pièces — impossible de candidater sans.
   ———————————————————————————————————————————————————————————————— */

/** Pièces demandées — mêmes clés que l'API. */
const DOCS_BASE = ['profile_photo', 'driving_licence', 'vtc_card_doc'] as const;
const DOCS_VEHICLE = ['vehicle_photo', 'carte_grise', 'maintenance_control', 'insurance'] as const;
type DocKey = typeof DOCS_BASE[number] | typeof DOCS_VEHICLE[number];

const DOC_T: Record<DocKey, { fr: string; en: string; es: string; ru: string; ar: string }> = {
  profile_photo: { fr: 'Photo de profil', en: 'Profile picture', es: 'Foto de perfil', ru: 'Фото профиля', ar: 'صورة شخصية' },
  driving_licence: { fr: 'Permis de conduire', en: 'Driving licence', es: 'Permiso de conducir', ru: 'Водительское удостоверение', ar: 'رخصة القيادة' },
  vtc_card_doc: { fr: 'Carte professionnelle VTC', en: 'PHV professional card', es: 'Tarjeta profesional VTC', ru: 'Профессиональная карта VTC', ar: 'البطاقة المهنية VTC' },
  vehicle_photo: { fr: 'Photo du véhicule', en: 'Vehicle photo', es: 'Foto del vehículo', ru: 'Фото автомобиля', ar: 'صورة السيارة' },
  carte_grise: { fr: 'Carte grise', en: 'Registration document', es: 'Permiso de circulación', ru: 'Свидетельство о регистрации', ar: 'بطاقة تسجيل السيارة' },
  maintenance_control: { fr: 'Contrôle technique', en: 'Maintenance control', es: 'Inspección técnica', ru: 'Техосмотр', ar: 'الفحص التقني' },
  insurance: { fr: 'Attestation d’assurance', en: 'Insurance certificate', es: 'Certificado de seguro', ru: 'Страховой сертификат', ar: 'شهادة التأمين' },
};

interface DocFile { name: string; contentType: string; base64: string; size: number }

/** Lecture + compression côté client : images redimensionnées (max 1600 px,
    JPEG 78 %) pour rester sous la limite d'upload ; PDF acceptés ≤ 3 Mo. */
async function prepareFile(file: File): Promise<DocFile | { error: 'type' | 'size' }> {
  if (file.type === 'application/pdf') {
    if (file.size > 3_000_000) return { error: 'size' };
    const b64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return { name: file.name, contentType: 'application/pdf', base64: b64, size: file.size };
  }
  if (!file.type.startsWith('image/')) return { error: 'type' };
  // Environnement sans canvas (tests, très vieux navigateurs) → fichier transmis tel quel.
  const canCompress = typeof document !== 'undefined' && !!document.createElement('canvas').getContext?.('2d');
  if (!canCompress) {
    if (file.size > 3_000_000) return { error: 'size' };
    const b64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return { name: file.name, contentType: file.type || 'image/jpeg', base64: b64, size: file.size };
  }
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL('image/jpeg', 0.78);
    const b64 = out.split(',')[1] ?? '';
    return { name: file.name.replace(/\.\w+$/, '') + '.jpg', contentType: 'image/jpeg', base64: b64, size: Math.round(b64.length * 0.75) };
  } catch {
    // Environnement sans canvas (tests) → fichier transmis tel quel s'il est raisonnable.
    if (file.size > 3_000_000) return { error: 'size' };
    const b64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return { name: file.name, contentType: file.type || 'image/jpeg', base64: b64, size: file.size };
  }
}

async function postApply(payload: unknown): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  try {
    const res = await fetch('/api/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: {} };
  }
}

export function ChauffeurModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [hasVehicle, setHasVehicle] = useState(true);
  const [docs, setDocs] = useState<Partial<Record<DocKey, DocFile>>>({});
  const [docErr, setDocErr] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [ref, setRef] = useState('');
  const [serverErr, setServerErr] = useState<string | null>(null);

  const L = (v: { fr: string; en: string; es: string; ru: string; ar: string }) => pickL(lang, v);
  const requiredDocs: DocKey[] = [...DOCS_BASE, ...(hasVehicle ? DOCS_VEHICLE : [])];

  const setDoc = (key: DocKey) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocErr(null);
    const r = await prepareFile(file);
    if ('error' in r) {
      setDocErr(r.error === 'size'
        ? L({ fr: 'Fichier trop lourd (3 Mo max pour un PDF) — envoyez une photo.', en: 'File too large (3 MB max for PDF) — send a photo instead.', es: 'Archivo demasiado pesado (máx. 3 MB en PDF) — envíe una foto.', ru: 'Файл слишком большой (PDF до 3 МБ) — отправьте фото.', ar: 'الملف كبير جدًا (3 م.ب كحد أقصى للـ PDF) — أرسل صورة.' })
        : L({ fr: 'Format non pris en charge — photo (JPG/PNG) ou PDF.', en: 'Unsupported format — photo (JPG/PNG) or PDF.', es: 'Formato no compatible — foto (JPG/PNG) o PDF.', ru: 'Неподдерживаемый формат — фото (JPG/PNG) или PDF.', ar: 'صيغة غير مدعومة — صورة (JPG/PNG) أو PDF.' }));
      return;
    }
    setDocs((d) => ({ ...d, [key]: r }));
    e.target.closest('.os-doctile')?.classList.remove('os-invalid');
  };

  async function submit() {
    const form = formRef.current;
    if (!form) return;
    setServerErr(null); setDocErr(null);

    // 1) Champs + pièces obligatoires — vibration dorée sur tout ce qui manque.
    const fieldsOk = validateForm(form, []);
    let firstBadTile: HTMLElement | null = null;
    requiredDocs.forEach((k) => {
      if (!docs[k]) {
        const tile = form.querySelector<HTMLElement>(`[data-doc="${k}"]`);
        if (tile) {
          tile.classList.remove('os-invalid');
          void tile.offsetWidth;
          tile.classList.add('os-invalid');
          if (!firstBadTile) firstBadTile = tile;
        }
      }
    });
    if (!fieldsOk || firstBadTile) {
      (firstBadTile as HTMLElement | null)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setState('sending');
    const d = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // 2) Création de la candidature (brouillon serveur).
    const created = await postApply({
      action: 'create',
      website: d.website ?? '',
      data: {
        first_name: d.first_name, last_name: d.last_name, phone: d.phone, email: d.email,
        city: d.city ?? '', country: d.country ?? 'France', vtc_card: d.vtc_card,
        vehicle_class: hasVehicle ? (d.vehicle_class ?? '') : '',
        experience: d.experience ?? '', languages: d.languages ?? '', message: d.message ?? '',
      },
      vehicle: hasVehicle ? {
        make: d.vehicle_make, model: d.vehicle_model, year: d.vehicle_year ?? '',
        plate: d.vehicle_plate, seats: d.vehicle_seats ? Number(d.vehicle_seats) : undefined,
        color: d.vehicle_color ?? '',
      } : undefined,
    });
    const id = created.json.id as string | undefined;
    const reference = created.json.reference as string | undefined;
    if (!created.ok || !id || !reference) { setState('error'); return; }

    // 3) Téléversement des pièces, une par une.
    const keys = requiredDocs.filter((k) => docs[k]);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const f = docs[k]!;
      setProgress(`${i + 1}/${keys.length}`);
      const up = await postApply({
        action: 'doc', id, reference, key: k,
        name: f.name, contentType: f.contentType, base64: f.base64,
      });
      if (!up.ok) {
        setState('error');
        setServerErr(L({ fr: `Échec d'envoi : ${DOC_T[k].fr}`, en: `Upload failed: ${DOC_T[k].en}`, es: `Fallo de envío: ${DOC_T[k].es}`, ru: `Сбой загрузки: ${DOC_T[k].ru}`, ar: `فشل الإرسال: ${DOC_T[k].ar}` }));
        return;
      }
    }

    // 4) Finalisation — le serveur re-vérifie les pièces obligatoires.
    const fin = await postApply({ action: 'finalize', id, reference });
    if (!fin.ok) {
      setState('error');
      const labels = (fin.json.missingLabels as string[] | undefined)?.join(', ');
      if (labels) setServerErr(L({ fr: `Pièces manquantes : ${labels}`, en: `Missing documents: ${labels}`, es: `Documentos faltantes: ${labels}`, ru: `Не хватает документов: ${labels}`, ar: `مستندات ناقصة: ${labels}` }));
      return;
    }
    setRef(reference);
    setState('ok');
  }

  const secTitle = (no: string, txt: string) => (
    <p className="os-apply__sec"><span>{no}</span>{txt}</p>
  );

  return (
    <Shell open={open} onClose={onClose} title={L({ fr: 'Devenez partenaire', en: 'Become a partner', es: 'Hágase socio', ru: 'Станьте партнёром', ar: 'كن شريكًا' })}>
      {state === 'ok' ? (
        <div>
          <p className="os-modal__ok">✓ {L({ fr: 'Candidature complète reçue', en: 'Full application received', es: 'Candidatura completa recibida', ru: 'Полная заявка получена', ar: 'تم استلام الترشح كاملًا' })} — réf. <strong>{ref}</strong></p>
          <p className="os-form__reqnote">{L({ fr: 'Notre équipe examine votre dossier et revient vers vous sous 48 h.', en: 'Our team reviews your file and comes back within 48 h.', es: 'Nuestro equipo revisa su expediente y le responde en 48 h.', ru: 'Наша команда рассмотрит досье и свяжется с вами в течение 48 ч.', ar: 'يدرس فريقنا ملفك ويعود إليك خلال 48 ساعة.' })}</p>
        </div>
      ) : (
        <form className="os-form os-apply" onSubmit={(e) => e.preventDefault()} ref={formRef} noValidate>
          <p className="os-apply__lead">{L({
            fr: 'Complétez vos disponibilités ou faites de Oui Stars votre principale source de courses.',
            en: 'Fill the gaps in your schedule — or make Oui Stars your main source of rides.',
            es: 'Complete su agenda o haga de Oui Stars su principal fuente de servicios.',
            ru: 'Заполняйте свободные часы — или сделайте Oui Stars основным источником заказов.',
            ar: 'املأ فراغات جدولك أو اجعل Oui Stars مصدر مشاويرك الرئيسي.',
          })}</p>

          {/* Honeypot anti-bot */}
          <input name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: -9999, height: 0, opacity: 0 }} aria-hidden />

          {secTitle('01', L({ fr: 'Vous', en: 'You', es: 'Usted', ru: 'О вас', ar: 'أنت' }))}
          <div className="os-form__row">
            <input name="first_name" placeholder={`${t.meetGreet.firstName} *`} required />
            <input name="last_name" placeholder={`${t.meetGreet.lastName} *`} required />
          </div>
          <div className="os-form__row">
            <input name="phone" placeholder={`${t.meetGreet.phone} *`} required />
            <input name="email" type="email" placeholder={`${t.meetGreet.email} *`} required />
          </div>
          <div className="os-form__row">
            <input name="vtc_card" placeholder={`${L({ fr: 'N° carte professionnelle VTC', en: 'PHV professional card no.', es: 'N.º tarjeta profesional VTC', ru: '№ проф. карты VTC', ar: 'رقم البطاقة المهنية VTC' })} *`} required />
            <input name="city" placeholder={L({ fr: 'Ville / zone d’opération', en: 'City / operating area', es: 'Ciudad / zona', ru: 'Город / зона работы', ar: 'المدينة / المنطقة' })} />
          </div>
          <div className="os-form__row">
            <input name="country" defaultValue="France" placeholder={L({ fr: 'Pays', en: 'Country', es: 'País', ru: 'Страна', ar: 'البلد' })} />
            <input name="languages" placeholder={L({ fr: 'Langues parlées', en: 'Spoken languages', es: 'Idiomas', ru: 'Языки', ar: 'اللغات' })} />
          </div>
          <input name="experience" placeholder={L({ fr: 'Expérience (années, maisons, références…)', en: 'Experience (years, houses, references…)', es: 'Experiencia (años, casas, referencias…)', ru: 'Опыт (годы, компании, рекомендации…)', ar: 'الخبرة (سنوات، شركات، مراجع…)' })} />

          {secTitle('02', L({ fr: 'Votre véhicule', en: 'Your vehicle', es: 'Su vehículo', ru: 'Ваш автомобиль', ar: 'سيارتك' }))}
          <div className="os-apply__toggle" role="radiogroup">
            <button type="button" className={hasVehicle ? 'is-on' : ''} onClick={() => setHasVehicle(true)}>
              {L({ fr: 'J’ai mon propre véhicule', en: 'I have my own vehicle', es: 'Tengo mi propio vehículo', ru: 'У меня свой автомобиль', ar: 'لدي سيارتي الخاصة' })}
            </button>
            <button type="button" className={!hasVehicle ? 'is-on' : ''} onClick={() => setHasVehicle(false)}>
              {L({ fr: 'Sans véhicule', en: 'No vehicle', es: 'Sin vehículo', ru: 'Без автомобиля', ar: 'بدون سيارة' })}
            </button>
          </div>
          {hasVehicle && (
            <>
              <div className="os-form__row">
                <input name="vehicle_make" placeholder={`${L({ fr: 'Marque', en: 'Make', es: 'Marca', ru: 'Марка', ar: 'الماركة' })} * (Mercedes, BMW…)`} required />
                <input name="vehicle_model" placeholder={`${L({ fr: 'Modèle', en: 'Model', es: 'Modelo', ru: 'Модель', ar: 'الطراز' })} * (Classe E, Série 5…)`} required />
              </div>
              <div className="os-form__row">
                <input name="vehicle_plate" placeholder={`${L({ fr: 'Immatriculation', en: 'Plate', es: 'Matrícula', ru: 'Номер', ar: 'اللوحة' })} *`} required />
                <input name="vehicle_year" placeholder={L({ fr: 'Année', en: 'Year', es: 'Año', ru: 'Год', ar: 'السنة' })} inputMode="numeric" />
              </div>
              <div className="os-form__row">
                <select name="vehicle_class" defaultValue="business" aria-label="Classe">
                  <option value="business">{L({ fr: 'Berline Business (Classe E)', en: 'Business sedan (E-Class)', es: 'Berlina Business (Clase E)', ru: 'Бизнес-седан (E-класс)', ar: 'سيدان بيزنس (الفئة E)' })}</option>
                  <option value="van">{L({ fr: 'Van (Classe V)', en: 'Van (V-Class)', es: 'Van (Clase V)', ru: 'Минивэн (V-класс)', ar: 'فان (الفئة V)' })}</option>
                  <option value="first">{L({ fr: 'First (Classe S)', en: 'First (S-Class)', es: 'First (Clase S)', ru: 'Первый класс (S-класс)', ar: 'الفئة الأولى (S)' })}</option>
                  <option value="other">{L({ fr: 'Autre', en: 'Other', es: 'Otro', ru: 'Другое', ar: 'أخرى' })}</option>
                </select>
                <input name="vehicle_seats" placeholder={L({ fr: 'Places passagers', en: 'Passenger seats', es: 'Plazas', ru: 'Мест', ar: 'المقاعد' })} inputMode="numeric" />
              </div>
            </>
          )}

          {secTitle('03', L({ fr: 'Pièces jointes — obligatoires', en: 'Attachments — required', es: 'Documentos — obligatorios', ru: 'Документы — обязательно', ar: 'المرفقات — إلزامية' }))}
          <div className="os-apply__tiles">
            {requiredDocs.map((k) => (
              <label key={k} className={`os-doctile${docs[k] ? ' is-done' : ''}`} data-doc={k}>
                <input type="file" accept="image/*,application/pdf" onChange={setDoc(k)} />
                <span className="os-doctile__ic" aria-hidden>{docs[k] ? '✓' : '+'}</span>
                <span className="os-doctile__label">{L(DOC_T[k])} *</span>
                <span className="os-doctile__state">
                  {docs[k]
                    ? docs[k]!.name
                    : L({ fr: 'Photo ou PDF', en: 'Photo or PDF', es: 'Foto o PDF', ru: 'Фото или PDF', ar: 'صورة أو PDF' })}
                </span>
              </label>
            ))}
          </div>
          {docErr && <p className="os-modal__err">{docErr}</p>}

          <textarea name="message" placeholder={L({ fr: 'Un mot sur vous (optionnel)', en: 'A word about you (optional)', es: 'Unas palabras sobre usted (opcional)', ru: 'Пара слов о себе (необязательно)', ar: 'كلمة عنك (اختياري)' })} rows={2} />

          <button type="button" className="os-btn os-btn--gold" disabled={state === 'sending'} onClick={submit}>
            {state === 'sending'
              ? `${t.common.sending}${progress ? ` (${progress})` : ''}`
              : L({ fr: 'Déposer ma candidature', en: 'Submit my application', es: 'Enviar mi candidatura', ru: 'Отправить заявку', ar: 'إرسال ترشحي' })}
          </button>
          <p className="os-form__reqnote">* {t.common.required} — {L({ fr: 'aucune candidature n’est examinée sans les pièces demandées.', en: 'no application is reviewed without the requested documents.', es: 'ninguna candidatura se examina sin los documentos solicitados.', ru: 'заявки без документов не рассматриваются.', ar: 'لا يُنظر في أي ترشح دون المستندات المطلوبة.' })}</p>
          {state === 'error' && <p className="os-modal__err">{serverErr ?? t.meetGreet.error}</p>}
        </form>
      )}
    </Shell>
  );
}

/** Bouton conciergerie — un majordome (nœud papillon, plateau) qui ouvre WhatsApp. */
export function WhatsAppCTA() {
  return (
    <a className="os-wa" href="https://wa.me/33651030306" target="_blank" rel="noreferrer"
      aria-label="Conciergerie WhatsApp" title="Notre majordome vous répond sur WhatsApp — 24/7">
      <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {/* tête */}
        <circle cx="12" cy="6.1" r="2.9" />
        {/* nœud papillon */}
        <path d="M9.6 11.6 12 12.7l2.4-1.1-.5 2.2h-3.8z" fill="currentColor" stroke="none" />
        {/* épaules & veste (revers en V) */}
        <path d="M4.6 20.5c.6-4.1 3.4-6.4 7.4-6.4s6.8 2.3 7.4 6.4" />
        <path d="M9.4 14.6 12 17.4l2.6-2.8" />
        {/* plateau du majordome */}
        <path d="M16.4 4.4h4.4" />
        <path d="M18.6 4.4v-.9" />
      </svg>
      <span className="os-wa__badge" aria-hidden>
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M20 4A10 10 0 0 0 3.6 15.6L2 22l6.6-1.6A10 10 0 1 0 20 4zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-3.9.9.9-3.8-.2-.3A8 8 0 1 1 12 20zm4.5-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6 8.4a4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c2 .9 2.1.6 2.5.6a2.5 2.5 0 0 0 1.6-1.2 2 2 0 0 0 .1-1.1c0-.1-.3-.2-.5-.3z"/></svg>
      </span>
    </a>
  );
}
