import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, RefObject } from 'react';
import './pickers.css';

type Locale = 'fr' | 'en' | 'es' | 'ru' | 'ar';

/** Libellés localisés des pickers. */
const PICKER_TXT: Record<Locale, { pickDate: string; pickTime: string; prevMonth: string; nextMonth: string; times: string }> = {
  fr: { pickDate: 'Choisir une date', pickTime: 'Choisir une heure', prevMonth: 'Mois précédent', nextMonth: 'Mois suivant', times: 'Heures' },
  en: { pickDate: 'Select a date', pickTime: 'Select a time', prevMonth: 'Previous month', nextMonth: 'Next month', times: 'Times' },
  es: { pickDate: 'Elegir una fecha', pickTime: 'Elegir una hora', prevMonth: 'Mes anterior', nextMonth: 'Mes siguiente', times: 'Horas' },
  ru: { pickDate: 'Выберите дату', pickTime: 'Выберите время', prevMonth: 'Предыдущий месяц', nextMonth: 'Следующий месяц', times: 'Время' },
  ar: { pickDate: 'اختر تاريخاً', pickTime: 'اختر وقتاً', prevMonth: 'الشهر السابق', nextMonth: 'الشهر التالي', times: 'الأوقات' },
};

/* ---------------------------------------------------------------- helpers */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Parse 'YYYY-MM-DD' into a local Date (midnight). Returns null if invalid. */
function parseISO(iso: string | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function toISO(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

/** Days since epoch at local midnight — safe for day comparisons. */
function dayIndex(dt: Date): number {
  return Math.floor(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime() / 86_400_000);
}

function sameDay(a: Date, b: Date): boolean {
  return dayIndex(a) === dayIndex(b);
}

/** Monday-first weekday index (0 = Monday … 6 = Sunday). */
function mondayIndex(dt: Date): number {
  return (dt.getDay() + 6) % 7;
}

const WEEKDAYS: Record<Locale, string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  ru: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

/* ------------------------------------------------------ shared behaviours */

/** Close on outside mousedown + Escape while `open`. */
function useDismiss(
  open: boolean,
  wrapperRef: RefObject<HTMLDivElement | null>,
  close: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      const el = wrapperRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, wrapperRef, close]);
}

/* ---------------------------------------------------------------- icons */

function CalendarIcon(): ReactElement {
  return (
    <svg
      className="osp-ico"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

function ClockIcon(): ReactElement {
  return (
    <svg
      className="osp-ico"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/* ============================================================== DateField */

export interface DateFieldProps {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  locale?: Locale;
  label?: string;
}

export function DateField({
  value,
  onChange,
  min,
  locale = 'fr',
  label,
}: DateFieldProps): ReactElement {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => parseISO(value), [value]);
  const minDate = useMemo(() => parseISO(min), [min]);
  const today = useMemo(() => new Date(), []);

  // The month currently displayed in the popover (first of the month).
  const [view, setView] = useState<Date>(() => {
    const base = parseISO(value) ?? parseISO(min) ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (open) {
      const base = parseISO(value) ?? parseISO(min) ?? new Date();
      setView(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  }, [open, value, min]);

  useDismiss(open, wrapperRef, () => setOpen(false));

  const displayLabel = useMemo(() => {
    if (!selected) return PICKER_TXT[locale].pickDate;
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(selected);
  }, [selected, locale]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(view),
    [view, locale],
  );

  // Disallow navigating to a month entirely before `min`.
  const minMonthStart = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    : null;
  const canGoPrev = !minMonthStart || view.getTime() > minMonthStart.getTime();

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = mondayIndex(first);
    const list: (Date | null)[] = [];
    for (let i = 0; i < lead; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push(new Date(year, month, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  const goMonth = (delta: number): void => {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  };

  const pick = (d: Date): void => {
    onChange(toISO(d));
    setOpen(false);
  };

  return (
    <div className="osp" ref={wrapperRef}>
      {label ? <span className="osp-label">{label}</span> : null}
      <button
        type="button"
        className="osp-field"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label ?? PICKER_TXT[locale].pickDate}
      >
        <span className={selected ? 'osp-value' : 'osp-value osp-placeholder'}>
          {displayLabel}
        </span>
        <CalendarIcon />
      </button>

      {open ? (
        <div className="osp-pop osp-pop--cal" role="dialog" aria-label={monthTitle}>
          <div className="osp-cal-head">
            <button
              type="button"
              className="osp-nav"
              onClick={() => goMonth(-1)}
              disabled={!canGoPrev}
              aria-label={PICKER_TXT[locale].prevMonth}
            >
              &lsaquo;
            </button>
            <span className="osp-cal-title">{monthTitle}</span>
            <button
              type="button"
              className="osp-nav"
              onClick={() => goMonth(1)}
              aria-label={PICKER_TXT[locale].nextMonth}
            >
              &rsaquo;
            </button>
          </div>

          <div className="osp-cal-dow">
            {WEEKDAYS[locale].map((d, i) => (
              <span key={i} className="osp-dow">
                {d}
              </span>
            ))}
          </div>

          <div className="osp-cal-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} className="osp-cell osp-cell--empty" />;
              const disabled = minDate ? dayIndex(d) < dayIndex(minDate) : false;
              const isSel = selected ? sameDay(d, selected) : false;
              const isToday = sameDay(d, today);
              const cls = [
                'osp-cell',
                isSel ? 'is-selected' : '',
                isToday && !isSel ? 'is-today' : '',
                disabled ? 'is-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  disabled={disabled}
                  aria-pressed={isSel}
                  aria-label={new Intl.DateTimeFormat(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(d)}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================== TimeField */

export interface TimeFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  locale?: Locale;
  label?: string;
  stepMinutes?: number;
}

export function TimeField({
  value,
  onChange,
  locale = 'fr',
  label,
  stepMinutes = 15,
}: TimeFieldProps): ReactElement {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useDismiss(open, wrapperRef, () => setOpen(false));

  const step = stepMinutes > 0 ? stepMinutes : 15;

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let mins = 0; mins < 24 * 60; mins += step) {
      out.push(`${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`);
    }
    return out;
  }, [step]);

  // Scroll the selected slot into view when the popover opens.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('.osp-slot.is-selected');
    el?.scrollIntoView({ block: 'center' });
  }, [open]);

  const displayValue = value || PICKER_TXT[locale].pickTime;

  const pick = (t: string): void => {
    onChange(t);
    setOpen(false);
  };

  return (
    <div className="osp" ref={wrapperRef}>
      {label ? <span className="osp-label">{label}</span> : null}
      <button
        type="button"
        className="osp-field"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label ?? PICKER_TXT[locale].pickTime}
      >
        <span className={value ? 'osp-value' : 'osp-value osp-placeholder'}>
          {displayValue}
        </span>
        <ClockIcon />
      </button>

      {open ? (
        <div
          className="osp-pop osp-pop--time"
          role="listbox"
          aria-label={label ?? PICKER_TXT[locale].times}
          ref={listRef}
        >
          {slots.map((t) => {
            const isSel = t === value;
            return (
              <button
                key={t}
                type="button"
                role="option"
                aria-selected={isSel}
                className={isSel ? 'osp-slot is-selected' : 'osp-slot'}
                onClick={() => pick(t)}
              >
                {t}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
