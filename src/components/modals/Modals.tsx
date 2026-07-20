import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { useI18n } from '@/i18n';
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

  const send = async (channel: Channel, extraRequired: string[]) => {
    const form = formRef.current;
    if (!form || !validateForm(form, extraRequired)) return;
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
  const { state, ref, formRef, send, submit } = useSubmit('booking', {
    waText: (d, r) =>
      `${lang === 'fr' ? 'Bonjour Oui Stars, je souhaite réserver' : 'Hello Oui Stars, I would like to book'} : ` +
      `${d.prefill || `${d.pickup} → ${d.destination}`} · ${d.travel_date ?? ''} ${d.travel_time ?? ''}` +
      ` · ${d.passengers ?? 1} pax — ${d.first_name} ${d.last_name} · ${d.phone}${r ? ` · réf ${r}` : ''}` +
      `${d.notes ? ` · ${d.notes}` : ''}`,
  });
  return (
    <Shell open={open} onClose={onClose} title={t.nav.book}>
      {state === 'ok' ? (
        <p className="os-modal__ok">✓ {t.common.send} — réf. <strong>{ref}</strong></p>
      ) : (
        <form className="os-form" onSubmit={submit} ref={formRef} noValidate>
          {prefill && <input type="text" name="prefill" defaultValue={prefill} readOnly className="os-form__prefill" />}
          <div className="os-form__row">
            <input name="first_name" placeholder="Prénom *" required />
            <input name="last_name" placeholder="Nom *" required />
          </div>
          <div className="os-form__row">
            <input name="phone" placeholder="Téléphone *" required />
            <input name="email" type="email" placeholder="Email *" />
          </div>
          <div className="os-form__row">
            <input name="travel_date" type="date" required />
            <input name="travel_time" type="time" />
          </div>
          <input name="pickup" placeholder="Départ *" required />
          <input name="destination" placeholder="Destination *" required />
          <input name="passengers" type="number" min={1} defaultValue={2} placeholder="Passagers" />
          <textarea name="notes" placeholder="Précisions (vol, bagages, meet & greet…)" rows={3} />
          <SendButtons sending={state === 'sending'}
            onEmail={() => send('email', ['email'])}
            onWhatsApp={() => send('whatsapp', [])} />
          <p className="os-form__reqnote">* {t.common.required}</p>
          {state === 'error' && <p className="os-modal__err">Erreur — réessayez ou contactez-nous par WhatsApp.</p>}
        </form>
      )}
    </Shell>
  );
}

export function QuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { state, ref, formRef, send, submit } = useSubmit('quote', {
    waText: (d, r) =>
      `${lang === 'fr' ? 'Bonjour Oui Stars, demande de devis' : 'Hello Oui Stars, quote request'} : ` +
      `${d.company ?? ''} · ${d.event_type ?? ''} · ${d.start_date ?? ''}${d.end_date ? ` → ${d.end_date}` : ''}` +
      ` — ${d.contact ?? ''} · ${d.phone ?? ''}${r ? ` · réf ${r}` : ''}${d.details ? ` · ${d.details}` : ''}`,
  });
  return (
    <Shell open={open} onClose={onClose} title={t.nav.quote}>
      {state === 'ok' ? (
        <p className="os-modal__ok">✓ {t.common.send} — réf. <strong>{ref}</strong></p>
      ) : (
        <form className="os-form" onSubmit={submit} ref={formRef} noValidate>
          <input name="company" placeholder="Société *" required />
          <input name="contact" placeholder="Contact *" required />
          <div className="os-form__row">
            <input name="email" type="email" placeholder="Email *" />
            <input name="phone" placeholder="Téléphone *" />
          </div>
          <input name="event_type" placeholder="Type (congrès, gala, fashion week, délégation…)" />
          <div className="os-form__row">
            <input name="start_date" type="date" />
            <input name="end_date" type="date" />
          </div>
          <input name="vehicles" type="number" min={1} defaultValue={1} placeholder="Véhicules estimés" />
          <textarea name="details" placeholder="Votre besoin" rows={3} />
          <SendButtons sending={state === 'sending'}
            onEmail={() => send('email', ['email'])}
            onWhatsApp={() => send('whatsapp', ['phone'])} />
          <p className="os-form__reqnote">* {t.common.required}</p>
          {state === 'error' && <p className="os-modal__err">Erreur — réessayez.</p>}
        </form>
      )}
    </Shell>
  );
}

export function ChauffeurModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { state, ref, formRef, send, submit } = useSubmit('chauffeur');
  return (
    <Shell open={open} onClose={onClose} title={t.nav.join}>
      {state === 'ok' ? (
        <p className="os-modal__ok">✓ Candidature reçue — réf. <strong>{ref}</strong></p>
      ) : (
        <form className="os-form" onSubmit={submit} ref={formRef} noValidate>
          <div className="os-form__row">
            <input name="first_name" placeholder="Prénom *" required />
            <input name="last_name" placeholder="Nom *" required />
          </div>
          <div className="os-form__row">
            <input name="phone" placeholder="Téléphone *" required />
            <input name="email" type="email" placeholder="Email *" required />
          </div>
          <input name="vtc_card" placeholder="N° carte VTC" />
          <input name="city" placeholder="Ville / zone d'opération" />
          <textarea name="message" placeholder="Expérience, véhicule, langues…" rows={3} />
          <button type="button" className="os-btn os-btn--gold" disabled={state === 'sending'}
            onClick={() => send('email', [])}>
            {state === 'sending' ? t.common.sending : t.common.send}
          </button>
          <p className="os-form__reqnote">* {t.common.required}</p>
          {state === 'error' && <p className="os-modal__err">Erreur — réessayez.</p>}
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
